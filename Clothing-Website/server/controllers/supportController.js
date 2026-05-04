const { uploadToCloudinary } = require('../conf/cloudinary');
const SupportIssue = require('../models/SupportIssue');
const ClientUser = require('../models/ClientUser');

// Helper to use Cloudinary instead of S3
const uploadSupportFile = async (file) => {
  return await uploadToCloudinary(file, 'support');
};

exports.submitSupportIssue = async (req, res) => {
  try {
    const { userId, customerId, orderId, description } = req.body;
    const attachmentUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadSupportFile(file);
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        attachmentUrls.push({ url, fileType });
      }
    }

    const issue = await SupportIssue.create({
      userId,
      customerId,
      orderId,
      description,
      attachments: attachmentUrls
    });

    res.json({ success: true, data: issue });
  } catch (error) {
    console.error('submitSupportIssue error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit support issue' });
  }
};

const Order = require('../models/Order');

exports.getAllIssues = async (req, res) => {
  try {
    const issues = await SupportIssue.find().sort({ createdAt: -1 }).lean();

    // Dynamically join order data AND client data for each issue
    const joinedIssues = await Promise.all(issues.map(async (issue) => {
      // 1. Fetch official CID from ClientUser
      const clientDoc = await ClientUser.findOne({ uids: issue.userId }).lean();
      
      // 2. Fetch order data
      const orderData = await Order.findOne({ displayId: issue.orderId }).lean();
      
      return {
        ...issue,
        officialCustomerId: clientDoc?.customerId || issue.customerId || 'N/A',
        orderContext: orderData || null
      };
    }));

    res.json({ success: true, data: joinedIssues });
  } catch (error) {
    console.error('getAllIssues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch support issues' });
  }
};

exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const issue = await SupportIssue.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update issue' });
  }
};
exports.getIssuesByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const issues = await SupportIssue.find({ orderId }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: issues });
  } catch (error) {
    console.error('getIssuesByOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch issues' });
  }
};
