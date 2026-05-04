const jwt = require('jsonwebtoken');
const AdminUser = require('../models/adminUserModel');

const seedSuperAdmin = async () => {
  const exists = await AdminUser.findOne({ role: 'superadmin' });
  if (!exists) {
    await AdminUser.create({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      role: 'superadmin',
      isActive: true,
      permissions: [
        'Contact Messages',
        'Review Management',
        'Product Management',
        'Client Management',
        'Payment Management',
        'Order Management',
        'Support Management'
      ]
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await AdminUser.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set HTTP-Only Cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.status(200).json({ 
      success: true, 
      role: user.role,
      permissions: user.permissions 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('adminToken');
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  try {
    const user = await AdminUser.findById(req.admin.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, logout, getMe, seedSuperAdmin };