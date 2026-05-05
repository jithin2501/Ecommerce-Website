const cron = require('node-cron');
const Order = require('./models/Order');

// Placeholder for future cron jobs
const cleanupOldData = async () => {
    // Logic for cleaning up if needed
};

module.exports = function startCronJobs() {
    console.log('🕐 Cron jobs initialized...');

    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ [Cron] Running maintenance...');
        await cleanupOldData();
    });
};