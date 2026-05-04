const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

async function nextCustomerId() {
  const count = await ClientUser.countDocuments();
  return `CUST-${String(count + 1).padStart(5, '0')}`;
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await ClientUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const customerId = await nextCustomerId();
    const user = await ClientUser.create({
      name,
      email,
      password,
      customerId,
      uids: [customerId], // Using customerId as a fallback for the old UID logic
      loginTypes: ['email'],
      lastSeen: new Date(),
    });

    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error('❌ register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user and explicitly select password
    const user = await ClientUser.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error('❌ login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { uid, name, email, photo } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    let user = await ClientUser.findOne({ uids: uid });

    if (!user) {

      const customerId = await nextCustomerId();
      user = await ClientUser.create({
        uids: [uid],
        customerId,
        loginTypes: ['google'],
        name: name || '',
        email: email || '',
        photo: photo || '',
        lastSeen: new Date(),
      });

    } else {

      if (name) user.name = name;
      if (email) user.email = email;
      if (photo) user.photo = photo;
      user.lastSeen = new Date();
      await user.save();

    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ googleLogin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.phoneLogin = async (req, res) => {
  try {
    const { uid, name, phone } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });

    let user = await ClientUser.findOne({ uids: uid });

    if (!user) {

      const customerId = await nextCustomerId();
      user = await ClientUser.create({
        uids: [uid],
        customerId,
        loginTypes: ['phone'],
        name: name || '',
        phone: phone || '',
        lastSeen: new Date(),
      });

    } else {

      if (name) user.name = name;
      if (phone) user.phone = phone;
      user.lastSeen = new Date();
      await user.save();

    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ phoneLogin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.syncCart = async (req, res) => {
  try {
    const { uid, cart } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    await ClientUser.findOneAndUpdate({ uids: uid }, { cart, lastSeen: new Date() });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ syncCart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.syncWishlist = async (req, res) => {
  try {
    const { uid, wishlist } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    await ClientUser.findOneAndUpdate({ uids: uid }, { wishlist, lastSeen: new Date() });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ syncWishlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await ClientUser.findOne({ uids: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ getProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, email, phone, gender } = req.body;

    const updates = { lastSeen: new Date() };
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (gender !== undefined) updates.gender = gender;

    const updatedUser = await ClientUser.findOneAndUpdate(
      { uids: uid },
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('❌ updateProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await ClientUser.findOneAndDelete({ uids: uid });
    if (!result) return res.status(404).json({ error: 'User not found' });

    await ProductReview.deleteMany({ uid: { $in: result.uids } });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('❌ deleteAccount error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const user = await ClientUser.findOne({ uids: req.params.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, addresses: user.addresses || [] });
  } catch (err) {
    console.error('❌ getAddresses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const user = await ClientUser.findOne({ uids: req.params.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }
    user.addresses.push(req.body);
    user.markModified('addresses');
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error('❌ addAddress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { uid, addrId } = req.params;
    const user = await ClientUser.findOne({ uids: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    const addrIndex = user.addresses.findIndex(a => String(a.id || a._id) === String(addrId));
    if (addrIndex === -1) return res.status(404).json({ error: 'Address not found' });

    user.addresses[addrIndex] = { ...user.addresses[addrIndex].toObject(), ...req.body };
    user.markModified('addresses');
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error('❌ updateAddress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { uid, addrId } = req.params;
    const user = await ClientUser.findOne({ uids: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const addressToDelete = user.addresses.find(a => String(a.id || a._id) === String(addrId));
    const wasDefault = addressToDelete?.isDefault;

    user.addresses = user.addresses.filter(a => String(a.id || a._id) !== String(addrId));

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    user.markModified('addresses');
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error('❌ deleteAddress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};