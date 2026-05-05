const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  displayId: { type: String, required: true },
  paymentId: { type: String },
  userId: { type: String, required: true },
  userName: { type: String },
  userEmail: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, default: 'pending' }, // pending, success, failed
  paymentMethod: { type: String, default: 'Razorpay' },
  user: { type: mongoose.Schema.Types.Mixed }, // Snapshot of { name, customerId }
  items: [{ type: mongoose.Schema.Types.Mixed }],
  shippingAddress: { type: mongoose.Schema.Types.Mixed },
  trackingStatus: { type: String, default: 'Unshipped' },
  trackingLink: { type: String },
  trackingActivities: [mongoose.Schema.Types.Mixed], 
  giftWrapping: { type: Boolean, default: false },
  isGift: { type: Boolean, default: false },
  giftVideoUrl: { type: String },
  giftHash: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
