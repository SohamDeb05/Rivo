const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

let genAI;
try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here') {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (e) {
    console.error("Failed to initialize Google Generative AI", e);
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!genAI) {
       return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it to your backend/.env file.' });
    }

    // Using the lite model which rarely experiences high demand outages
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-lite-latest",
      systemInstruction: "You are a helpful AI assistant. If the user asks you to create, generate, or draw an image, you MUST respond by generating an image url using the pollinations.ai service. Output the following exact markdown format: `![A highly detailed descriptive prompt](https://image.pollinations.ai/prompt/A%20highly%20detailed%20descriptive%20prompt%20with%20URL%20encoding)`. Make sure to URL-encode the prompt in the URL. Be highly descriptive in the prompt to ensure a high quality image. Do not apologize or say you cannot generate images."
    });

    // Format history for Gemini API
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    let retries = 3;
    let text = "";
    
    while (retries > 0) {
      try {
        const result = await chat.sendMessage(message);
        const response = await result.response;
        text = response.text();
        break; // Success!
      } catch (err) {
        if (err.status === 503 && retries > 1) {
          retries--;
          // Wait 1 second before retrying
          await new Promise(r => setTimeout(r, 1000));
        } else {
          throw err;
        }
      }
    }

    res.json({ response: text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate response. Check your API key and network.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
