const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary Error: Missing credentials in .env file!');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Object} file - Multer file object
 * @param {String} folder - Target folder (e.g. 'newborn', 'toddler')
 */
const uploadToCloudinary = async (file, folder = 'general') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `sumathi-trends/${folder}`,
        resource_type: 'auto', // Detects if it's an image or video
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary Upload Stream Error:', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
};

/**
 * Delete a file from Cloudinary using its URL
 * @param {String} url - Cloudinary URL
 */
const deleteFromCloudinary = async (url) => {
  if (!url) return;
  try {
    // Extract public_id from URL
    // Format: .../upload/v12345/sumathi-trends/folder/public_id.jpg
    const parts = url.split('/');
    const fileNameWithExt = parts.pop();
    const publicIdWithFolder = parts.slice(parts.indexOf('sumathi-trends')).join('/') + '/' + fileNameWithExt.split('.')[0];
    
    await cloudinary.uploader.destroy(publicIdWithFolder);
  } catch (err) {
    console.error('❌ Cloudinary delete error:', err);
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
