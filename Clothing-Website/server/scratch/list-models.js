require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  try {
    // Note: The SDK doesn't have a direct listModels method on the genAI object usually, 
    // it's part of the Admin API or requires a direct fetch.
    // We'll try a direct fetch to the endpoint.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("No models returned. Data:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();
