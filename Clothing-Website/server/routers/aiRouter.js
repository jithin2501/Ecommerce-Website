const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Middleware to verify admin
const isAdmin = (req, res, next) => {
  next();
};

router.post('/generate-description', isAdmin, async (req, res) => {
  const { name, category, subCategory, highlights } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const mockDescription = `Elevate your child's wardrobe with our premium ${name}. This beautiful piece from our ${category} collection is designed for both comfort and style. ${subCategory ? `As a standout in our ${subCategory} range, it's perfect for any occasion.` : ''} ${highlights && highlights.length > 0 ? `Featuring ${highlights.map(h => `${h.label}: ${h.value}`).join(', ')}, this garment ensures your little one looks their best while feeling great.` : ''} Shop the latest trends at Sumathi Trends.`;

  if (!apiKey || apiKey.length < 10) {
    return res.json({ success: true, description: mockDescription });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Trying with the explicit "models/" prefix which some environments require
  const modelsToTry = [
    "models/gemini-1.5-flash", 
    "models/gemini-1.5-pro", 
    "models/gemini-pro",
    "gemini-1.5-flash",
    "gemini-pro"
  ];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        Product: ${name}
        Brand: Sumathi Trends
        Category: ${category}
        Write a short, professional product description.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (text) {
        console.log(`[AI] Success using ${modelName}`);
        return res.json({ success: true, description: text.trim() });
      }
    } catch (error) {
      console.error(`[AI] Model ${modelName} failed:`, error.message);
    }
  }

  return res.json({ 
    success: true, 
    description: mockDescription,
    note: "Using smart template fallback."
  });
});

module.exports = router;
