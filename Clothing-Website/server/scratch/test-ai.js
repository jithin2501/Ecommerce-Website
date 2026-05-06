require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing with API Key length:", apiKey ? apiKey.length : 0);
  
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ["gemini-1.5-flash", "gemini-pro"];

  for (const modelName of modelNames) {
    try {
      console.log(`Testing model: ${modelName} (v1beta)...`);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
      const result = await model.generateContent("Hello, respond with 'Success'");
      console.log(`[${modelName}] Result:`, result.response.text());
    } catch (err) {
      console.error(`[${modelName}] Error:`, err.message);
      if (err.response && err.response.data) {
        console.error("Detailed Error:", JSON.stringify(err.response.data));
      }
    }
  }
}

testAI();
