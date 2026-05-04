const cron = require('node-cron');
const Order = require('./models/Order');
const shiprocket = require('./services/shiprocket');

// ── Run immediately on startup to catch any missed orders ──
const syncUnsyncedOrders = async () => {
    try {
        // Fix: catch null/empty fields too, not just $exists: false
        const unsyncedOrders = await Order.find({
            status: 'success',
            $or: [
                { shiprocketOrderId: { $exists: false } },
                { shiprocketOrderId: null },
                { shiprocketOrderId: '' }
            ]
        });

        if (unsyncedOrders.length === 0) {
            console.log('✅ No unsynced orders found.');
            return;
        }

        console.log(`🔄 Found ${unsyncedOrders.length} unsynced order(s), pushing to Shiprocket...`);

        for (const order of unsyncedOrders) {
            try {
                console.log(`📦 Attempting to sync order: ${order.displayId}`);
                const result = await shiprocket.createOrder(order);

                if (result.success) {
                    await Order.findByIdAndUpdate(order._id, {
                        shiprocketOrderId: result.shiprocketOrderId,
                        shiprocketShipmentId: result.shiprocketShipmentId,
                        trackingStatus: 'PROCESSING',
                        trackingLink: shiprocket.generateTrackingLink(result.shiprocketShipmentId)
                    });
                    console.log(`✅ Synced order to Shiprocket: ${order.displayId} → SR ID: ${result.shiprocketOrderId}`);
                } else {
                    // Save the error back to DB so you can see it in admin dashboard
                    await Order.findByIdAndUpdate(order._id, {
                        shiprocketError: result.error
                    });
                    console.warn(`⚠️  Shiprocket rejected order ${order.displayId}:`, result.error);
                }
            } catch (err) {
                console.error(`❌ Error syncing order ${order.displayId}:`, err.message);
            }
        }
    } catch (err) {
        console.error('❌ syncUnsyncedOrders error:', err.message);
    }
};

module.exports = function startCronJobs() {
    console.log('🕐 Cron jobs initialized...');

    // ── Run immediately when server starts ──
    syncUnsyncedOrders();

    // ── Then run every 5 minutes automatically ──
    cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ [Cron] Running Shiprocket sync check...');
        await syncUnsyncedOrders();
    });
};