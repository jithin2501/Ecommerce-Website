const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.cookies.adminToken || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const superAdminOnly = (req, res, next) => {
  if (req.admin?.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Access denied. Superadmin only.' });
  }
  next();
};

const protectClient = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'You are not logged in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ClientUser = require('../models/ClientUser');
    const currentUser = await ClientUser.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = currentUser;
    req.clientUid = currentUser.customerId; // Compatibility with UID logic
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const requireOwnership = (req, res, next) => {
  // Checks req.params.uid or req.body.uid
  const resourceUid = req.params.uid || req.body.uid;
  if (!resourceUid) {
    return res.status(400).json({ success: false, message: 'Resource UID missing for ownership check.' });
  }

  // Allow if Client customerId matches
  if (req.clientUid === resourceUid) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Forbidden: You do not own this resource.' });
};

// Allows access if EITHER a valid Admin JWT OR a valid Client token is present
const anyAuth = async (req, res, next) => {
  const token = req.cookies.adminToken || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  // Try Admin JWT first
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (err) {
    // If not Admin, try Client Auth
    try {
      const decodedClient = jwt.verify(token, process.env.JWT_SECRET);
      const ClientUser = require('../models/ClientUser');
      const currentUser = await ClientUser.findById(decodedClient.id);
      
      if (currentUser) {
        req.user = currentUser;
        req.clientUid = currentUser.customerId;
        return next();
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    } catch (clientErr) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  }
};

module.exports = {
  protect,
  protectClient,
  superAdminOnly,
  requireOwnership,
  anyAuth
};