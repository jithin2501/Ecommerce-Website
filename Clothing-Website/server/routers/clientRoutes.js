const express    = require('express');
const router     = express.Router();
const clientCtrl = require('../controllers/clientController');
const { protectClient, requireOwnership } = require('../middleware/authMiddleware');

// Public client auth endpoints (called from Login.jsx)
router.post('/register', clientCtrl.register);
router.post('/login',    clientCtrl.login);
router.post('/google',   clientCtrl.googleLogin);
router.post('/phone',    clientCtrl.phoneLogin);

// Protected routes
const protected = [protectClient, requireOwnership];

router.post('/sync-cart',     ...protected, clientCtrl.syncCart);
router.post('/sync-wishlist', ...protected, clientCtrl.syncWishlist);

// Profile management endpoints
router.get('/profile/:uid',   ...protected, clientCtrl.getProfile);
router.put('/profile/:uid',   ...protected, clientCtrl.updateProfile);
router.delete('/delete/:uid', ...protected, clientCtrl.deleteAccount);

// Address management endpoints
router.get('/addresses/:uid',          ...protected, clientCtrl.getAddresses);
router.post('/addresses/:uid',         ...protected, clientCtrl.addAddress);
router.put('/addresses/:uid/:addrId',  ...protected, clientCtrl.updateAddress);
router.delete('/addresses/:uid/:addrId', ...protected, clientCtrl.deleteAddress);

module.exports = router;