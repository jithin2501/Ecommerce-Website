const crypto = require('crypto');
const razorpay = require('../conf/razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { uploadToCloudinary } = require('../conf/cloudinary');

const FREE_SHIPPING_THRESHOLD = 0; // Everything is Free Shipping now!
const GIFT_WRAP_COST = 50;

const calculateOrderTotals = async (items, giftWrapping) => {
  const isGiftWrap = giftWrapping === true || giftWrapping === 'true';
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error(`Product not found: ${item.name || item.productId}`);

    if (product.stock < (item.qty || 1)) {
      throw new Error(`Sorry, only ${product.stock} units of "${product.name}" are available.`);
    }

    const itemPrice = product.price;
    const itemQty = Number(item.qty) || 1;
    subtotal += itemPrice * itemQty;

    validatedItems.push({
      ...item,
      price: itemPrice
    });
  }

  const shipping = 0; // Forced to zero per user request
  const giftCost = isGiftWrap ? GIFT_WRAP_COST : 0;
  const subtotalWithExtras = subtotal + shipping + giftCost;
  const tax = Math.round(subtotalWithExtras * 0.05 * 100) / 100;
  const total = subtotalWithExtras + tax;

  return { subtotal, shipping, giftCost, tax, total, validatedItems };
};

exports.createOrder = async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ success: false, error: 'Razorpay not configured' });
  }
  try {
    const {
      amount: clientAmount,
      userId,
      userName,
      userEmail,
      items,
      giftWrapping,
      isGift,
      giftVideoUrl,
      shippingAddress,
      currency = 'INR',
      receipt = `rcpt_${Date.now()}`
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Items are required' });
    }

    let totals;
    try {
      totals = await calculateOrderTotals(items, giftWrapping);
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    const { total: finalCalculatedAmount, validatedItems } = totals;

    const options = {
      amount: Math.round(finalCalculatedAmount * 100),
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let displayId = 'ST-';
    for (let i = 0; i < 6; i++) displayId += chars.charAt(Math.floor(Math.random() * chars.length));

    const giftHash = isGift ? crypto.randomBytes(16).toString('hex') : undefined;

    let finalEmail = userEmail || shippingAddress?.email;
    if (!finalEmail && userId && userId !== 'guest') {
      const client = await ClientUser.findOne({ customerId: userId }).lean();
      if (client?.email) finalEmail = client.email;
    }

    await Order.create({
      orderId: order.id,
      displayId,
      userId: userId || 'guest',
      userName: userName || shippingAddress?.name || shippingAddress?.fullName,
      userEmail: finalEmail,
      amount: finalCalculatedAmount,
      currency,
      items: validatedItems,
      shippingAddress,
      giftWrapping: !!giftWrapping,
      isGift: !!isGift,
      giftVideoUrl: giftVideoUrl || '',
      giftHash: giftHash,
      status: 'pending'
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create Razorpay order',
      detail: error.message
    });
  }
};

exports.calculateSummary = async (req, res) => {
  try {
    const { items, giftWrapping } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Items are required' });
    }

    const totals = await calculateOrderTotals(items, giftWrapping);
    res.json({ success: true, ...totals });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ success: false, error: 'Razorpay not configured' });
  }
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSignature) {
      let method = 'Unknown';
      try {
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        method = paymentDetails.method;
      } catch (err) { }

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          status: 'success',
          paymentId: razorpay_payment_id,
          paymentMethod: method
        },
        { new: true }
      );

      if (updatedOrder) {
        try {
          for (const item of updatedOrder.items) {
            if (item.productId && item.qty) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -Number(item.qty) }
              });
            }
          }
        } catch (stockError) { }

        // SR Removed: Manual delivery logic now used
        await updatedOrder.save();
      }

      return res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
};

const ClientUser = require('../models/ClientUser');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const joinedData = await Promise.all(orders.map(async (o) => {
      if (o.userId && o.userId !== 'guest') {
        const userDoc = await ClientUser.findOne({ customerId: o.userId }).lean();
        if (userDoc) {
          o.user = {
            id: userDoc.customerId || 'N/A',
            name: userDoc.name || 'Unknown',
            email: userDoc.email || 'N/A'
          };
        }
      }
      return o;
    }));

    res.json({ success: true, count: joinedData.length, data: joinedData });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ success: false, error: 'User UID is required' });

    const orders = await Order.find({ userId: uid, status: 'success' }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch your orders' });
  }
};

exports.syncTrackingStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Since SR is removed, we just return what's in the DB
    res.json({
      success: true,
      trackingStatus: order.trackingStatus,
      courier: 'Sumathi Express',
      awb: order.displayId,
      activities: order.trackingActivities || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.uploadGiftVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file provided' });
    }

    // Use our Cloudinary helper
    // 'gift-videos' is the folder name in Cloudinary
    const videoUrl = await uploadToCloudinary(req.file, 'gift-videos');

    res.json({
      success: true,
      videoUrl
    });
  } catch (error) {
    console.error('Gift video upload error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to upload video' });
  }
};

exports.markAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Random Tracking Messages as requested
    const mockActivities = [
      { status: 'DELIVERED', activity: 'Delivered Sat, Apr 25, 26', date: '2026-04-25T11:58:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'DELIVERY_UPDATE', activity: 'Out For Delivery Update Sat, Apr 25, 26', date: '2026-04-25T10:30:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'OFD', activity: 'Out for Delivery Sat, Apr 25, 26', date: '2026-04-25T10:15:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'REPROMISE', activity: 'Delivery Rescheduled Fri, Apr 24, 26', date: '2026-04-24T22:36:00', location: '' },
      { status: 'UNDELIVERED_ATTEMPTED', activity: 'Delivery Attempted Fri, Apr 24, 26', date: '2026-04-24T20:09:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'RESCHEDULE_REQUEST', activity: 'Undelivered Update Fri, Apr 24, 26', date: '2026-04-24T18:31:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'DELIVERY_UPDATE', activity: 'Out For Delivery Update Fri, Apr 24, 26', date: '2026-04-24T11:03:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'OFD', activity: 'Out for Delivery Fri, Apr 24, 26', date: '2026-04-24T11:03:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'RECEIVED_AT_DH', activity: 'Reached Destination Hub Fri, Apr 24, 26', date: '2026-04-24T08:04:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'EXPECTED', activity: 'Scheduled for Delivery Fri, Apr 24, 26', date: '2026-04-24T06:47:00', location: 'BheemanadyMDH_BMY NILESHWAR' },
      { status: 'RECEIVED_AT_DH', activity: 'Reached Destination Hub Thu, Apr 23, 26', date: '2026-04-23T23:58:00', location: 'SASVellurTrikapurODH_VTR NILESHWAR' },
      { status: 'EXPECTED', activity: 'Scheduled for Delivery Thu, Apr 23, 26', date: '2026-04-23T11:04:00', location: 'SASVellurTrikapurODH_VTR NILESHWAR' },
      { status: 'MH_RECEIVED', activity: 'Reached Processing Center Thu, Apr 23, 26', date: '2026-04-23T08:17:00', location: 'Motherhub_ANJ BENGALURU' },
      { status: 'SHIPPED', activity: 'Shipped Thu, Apr 23, 26 - Dispatched to Ekart Logistics', date: '2026-04-23T04:37:00', location: 'BheemanadyMDH_BMY' },
      { status: 'MH_RECEIVED', activity: 'Reached Processing Center Thu, Apr 23, 26', date: '2026-04-23T04:30:00', location: 'Motherhub_ANJ BENGALURU' },
      { status: 'LPD_GENERATED', activity: 'Shipment Ready Wed, Apr 22, 26', date: '2026-04-22T15:16:00', location: 'Yelahanka Pickup Hub' },
      { status: 'PICKED_UP', activity: 'Shipment Pickup Complete Wed, Apr 22, 26', date: '2026-04-22T15:16:00', location: 'Yelahanka Pickup Hub' },
      { status: 'OUT_FOR_PICKUP', activity: 'Pickup Out For Pickup Wed, Apr 22, 26', date: '2026-04-22T10:51:00', location: 'Yelahanka Pickup Hub' },
      { status: 'CREATED', activity: 'Order Created Tue, Apr 21, 26', date: '2026-04-21T11:19:00', location: 'Fkl-BLRAnjaniHoskote' },
    ];

    order.trackingStatus = 'DELIVERED';
    order.trackingActivities = mockActivities;
    await order.save();

    res.json({ success: true, message: 'Order marked as delivered with simulated tracking data' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    let order;
    
    // 1. Try finding by MongoDB ID
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId);
    }
    
    // 2. Try by Display ID (e.g. ST-XXXXX)
    if (!order) {
      order = await Order.findOne({ displayId: orderId });
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch order details' });
  }
};

exports.getOrderByGiftHash = async (req, res) => {
  try {
    const { hash } = req.params;
    if (!hash) return res.status(400).json({ success: false, error: 'Hash is required' });

    const order = await Order.findOne({ giftHash: hash, isGift: true, status: 'success' }).lean();
    if (!order) {
      return res.status(404).json({ success: false, error: 'Gift message not found' });
    }

    res.json({
      success: true,
      data: {
        userName: order.userName,
        giftVideoUrl: order.giftVideoUrl,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};