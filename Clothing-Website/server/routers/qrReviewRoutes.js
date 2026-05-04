// routers/qrReviewRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/qrReviewController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.post('/submit', ctrl.submitQRReview);
router.get('/approved', ctrl.getApprovedQRReviews);

// Admin - Now uses the central secure cookie protection
router.get('/admin', protect, ctrl.getAllQRReviews);
router.get('/admin/settings', protect, ctrl.getQRSettings);
router.patch('/admin/settings', protect, ctrl.toggleQRAutoApprove);
router.patch('/admin/:id/approve', protect, ctrl.approveQRReview);
router.patch('/admin/:id/unapprove', protect, ctrl.unapproveQRReview);
router.delete('/admin/:id', protect, ctrl.deleteQRReview);

module.exports = router;