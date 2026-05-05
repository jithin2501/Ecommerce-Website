const express = require('express');
const router = express.Router();
const paymentCtrl = require('../controllers/paymentController');
const {
    protect,
    protectClient,
    requireOwnership,
    anyAuth
} = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Rate-limited & Protected: Ensures only authenticated users can create/verify payments
router.post('/create-order', protectClient, paymentLimiter, paymentCtrl.createOrder);
router.post('/verify-payment', protectClient, paymentLimiter, paymentCtrl.verifyPayment);
router.post('/calculate-summary', protectClient, paymentLimiter, paymentCtrl.calculateSummary);
router.get('/gift/:hash', paymentCtrl.getOrderByGiftHash);

// Admin-only — protected by JWT (Allowed for all admins with permission)
router.get('/orders', protect, paymentCtrl.getAllOrders);

// User-specific order history — Protected by Client Token + Ownership Check
router.get('/user-orders/:uid', protectClient, requireOwnership, paymentCtrl.getUserOrders);
router.get('/orders/:orderId', protectClient, paymentCtrl.getOrderById);

// Tracking — Allows BOTH Admin JWT (for dashboard) and Client Token (for customer)
router.get('/track/:orderId', anyAuth, paymentCtrl.syncTrackingStatus);

// Admin mark as delivered
router.post('/mark-delivered/:orderId', protect, paymentCtrl.markAsDelivered);

module.exports = router;