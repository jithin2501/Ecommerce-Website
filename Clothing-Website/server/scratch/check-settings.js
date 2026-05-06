const mongoose = require('mongoose');
require('dotenv').config();

async function checkSettings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const SiteSettings = mongoose.model('SiteSettings', new mongoose.Schema({
      autoRotateProducts: Boolean
    }));
    
    const settings = await SiteSettings.findOne();
    console.log("Current Site Settings:", settings);
    
    const Product = mongoose.model('Product', new mongoose.Schema({
      name: String,
      isActive: Boolean,
      featuredIn: [String]
    }));
    
    const totalActive = await Product.countDocuments({ isActive: true });
    console.log("Total Active Products:", totalActive);
    
    const featuredCount = await Product.countDocuments({ featuredIn: { $exists: true, $not: { $size: 0 } } });
    console.log("Products with Manual Featured Tags:", featuredCount);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSettings();
