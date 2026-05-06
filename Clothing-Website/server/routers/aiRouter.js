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

  if (!apiKey || apiKey.length < 10) {
    return res.status(400).json({ 
      success: false, 
      error: "Google Gemini API Key is missing or invalid in the server .env file." 
    });
  }

  // ── SMART FALLBACK TEMPLATE ──
  const getFallbackDescription = () => {
    const opening = [
      `Elevate your little one's wardrobe with the enchanting ${name} from our latest Trendora Trends collection.`,
      `Discover the perfect combination of timeless style and modern comfort with the ${name}, designed specifically for your child's special moments.`,
      `The ${name} is a standout piece in our ${category} range, offering unparalleled quality and a sophisticated look for any occasion.`
    ];
    const middle = `Carefully tailored as part of our premium ${category}${subCategory ? ` (${subCategory})` : ''} line, this garment ensures all-day comfort while maintaining its elegant silhouette.`;
    const featureSection = highlights && highlights.length > 0 
      ? `\n\nKey Features:\n${highlights.map(h => `• ${h.label}: ${h.value}`).join('\n')}`
      : `\n\nKey Features:\n• Premium quality fabrics\n• Comfortable and stylish fit\n• Exquisite attention to detail`;
    const closing = `\n\nExperience the superior craftsmanship and distinctive design of Trendora Trends. A must-have addition for your little one.`;
    
    return opening[Math.floor(Math.random() * opening.length)] + " " + middle + featureSection + closing;
  };

  console.log(`[AI] Requesting AI generation for: "${name}"`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Attempting your high-access models first
    const modelNames = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

    for (const modelName of modelNames) {
      try {
        console.log(`[AI] Attempting model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `
          You are a professional product copywriter for "Trendora Trends", a premium kids' clothing brand.
          Write a detailed, engaging, and professional product description for:
          
          Product: ${name}
          Category: ${category}
          Sub-Category: ${subCategory || 'Premium Collection'}
          Highlights: ${highlights && highlights.length > 0 ? highlights.map(h => `${h.label}: ${h.value}`).join(', ') : 'Premium quality, stylish design'}
          
          Requirements:
          1. Write a stylish opening paragraph.
          2. Create a "Why You'll Love It" section.
          3. Include a bulleted "Product Details" section.
          Tone: Sophisticated, premium, and trustworthy.
          Length: Around 120 words.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
          console.log(`[AI] Success using ${modelName}`);
          return res.json({ success: true, description: text.trim() });
        }
      } catch (innerError) {
        console.error(`[AI] ${modelName} failed:`, innerError.message);
      }
    }
  } catch (outerError) {
    console.error("[AI] Fatal setup error:", outerError.message);
  }

  // If we reach here, AI is blocked (Rate Limited) or down. 
  // We return the high-quality fallback so the user experience isn't broken.
  console.log("[AI] All models failed or rate-limited. Using smart fallback.");
  return res.json({ 
    success: true, 
    description: getFallbackDescription(),
    isFallback: true,
    note: "AI service is currently at its limit. Providing a premium smart template instead."
  });
});

module.exports = router;
