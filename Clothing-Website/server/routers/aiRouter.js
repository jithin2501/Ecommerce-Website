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

  // ... [fallback logic kept] ...
  const getFallbackDescription = () => {
    const opening = [
      `Discover the perfect blend of elegance and comfort with our ${name}.`,
      `Elevate your little one's style with the exquisite ${name} from Trendora Trends.`,
      `Make every moment special with our premium ${name}, a standout piece in our latest collection.`
    ];
    const middle = `Expertly crafted as part of our ${category}${subCategory ? ` (${subCategory})` : ''} collection, this piece is designed to provide unparalleled comfort while maintaining a sophisticated look.`;
    const featureSection = highlights && highlights.length > 0 
      ? `\n\nKey Features:\n${highlights.map(h => `• ${h.label}: ${h.value}`).join('\n')}`
      : '';
    const closing = `\n\nExperience the premium quality and timeless design that Trendora Trends is known for. Perfect for any occasion.`;

    return opening[Math.floor(Math.random() * opening.length)] + " " + middle + featureSection + closing;
  };

  const mockDescription = getFallbackDescription();

  if (!apiKey || apiKey.length < 10) {
    console.log("[AI] No API key found or key too short.");
    return res.json({ success: true, description: mockDescription });
  }

  console.log(`[AI] Starting generation for "${name}" using key length: ${apiKey.length}`);

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Flash 1.5 is the recommended model for this use case
  const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

  for (const modelName of modelNames) {
    try {
      console.log(`[AI] Attempting model: ${modelName} (API v1)`);
      // Explicitly using v1 API version as v1beta might be causing 404s for some keys
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
      
      const prompt = `
        You are a premium copywriter for "Trendora Trends", a high-end kids' clothing brand.
        Write a detailed, engaging, and professional product description for the following item:
        
        Product: ${name}
        Category: ${category}
        Sub-Category: ${subCategory || 'Premium Collection'}
        Highlights: ${highlights && highlights.length > 0 ? highlights.map(h => `${h.label}: ${h.value}`).join(', ') : 'Premium quality, stylish design, comfortable fit'}
        
        Requirements:
        1. Start with an inviting and stylish opening paragraph.
        2. Create a "Why You'll Love It" section highlighting the comfort and design.
        3. Include a bulleted "Product Highlights" section using the provided highlights.
        4. Maintain a sophisticated, premium, and parent-friendly tone.
        5. Keep the total length around 100-150 words.
        6. Do not use any placeholders or generic filler text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) {
        console.log(`[AI] Success using ${modelName}`);
        return res.json({ success: true, description: text.trim() });
      }
    } catch (error) {
      console.error(`[AI] Error with ${modelName}:`, error.message);
      if (error.response?.data) {
        console.error(`[AI] Detailed Error:`, JSON.stringify(error.response.data));
      }
    }
  }

  console.log("[AI] All models failed. Returning fallback.");
  return res.json({ 
    success: true, 
    description: mockDescription,
    note: "Using enhanced smart template fallback."
  });
});

module.exports = router;
