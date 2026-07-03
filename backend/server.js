const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Chat = require('./models/Chat');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

const app = express();
const port = process.env.PORT || 5005;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let genAI;
try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here') {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (e) {
    console.error("Failed to initialize Google Generative AI", e);
}

// Get all chats for the sidebar
app.get('/api/chats', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).select('_id title updatedAt');
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Link guest chats to a logged-in user
app.post('/api/chats/link', async (req, res) => {
  try {
    const { guestId, userId } = req.body;
    if (!guestId || !userId) return res.status(400).json({ error: 'Missing parameters' });
    
    await Chat.updateMany({ userId: guestId }, { $set: { userId: userId } });
    res.json({ message: 'Chats linked successfully' });
  } catch (error) {
    console.error('Error linking chats:', error);
    res.status(500).json({ error: 'Failed to link chats' });
  }
});

// Get a specific chat's history
app.get('/api/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Delete a specific chat
app.delete('/api/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, chatId, userId, files } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!genAI) {
       return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it to your backend/.env file.' });
    }

    // Find or create chat document
    let isNewChat = false;
    if (chatId) {
      chatDoc = await Chat.findOne({ _id: chatId, userId });
      if (!chatDoc) {
        return res.status(404).json({ error: 'Chat not found or unauthorized' });
      }
    } else {
      // Create new chat with a temporary title
      const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
      chatDoc = new Chat({ title, userId, messages: [] });
      isNewChat = true;
    }

    // Prepare message parts
    let userMessageContent = message;
    let parts = [{ text: message }];

    if (files && files.length > 0) {
      userMessageContent += '\n[File(s) Attached]';
      files.forEach(f => {
        parts.push({
          inlineData: {
            data: f.data,
            mimeType: f.mimeType
          }
        });
      });
    }

    // Add user message to document
    chatDoc.messages.push({ role: 'user', content: userMessageContent });

    // Smart Intent Detection: Is this an image generation request?
    const intentPrompt = `Does this user request explicitly ask to generate, draw, make, create, or edit an image/picture/logo/art? Respond with exactly "YES" or "NO". Request: "${message}"`;
    const intentModel = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
    const intentResult = await intentModel.generateContent(intentPrompt);
    const isImageRequest = intentResult.response.text().trim().toUpperCase().includes('YES');

    let text = "";

    if (isImageRequest) {
      try {
        const { enhanceImagePrompt } = require('./dist/image-engine/imagePromptEnhancer');
        const { generateImage } = require('./dist/image-engine/imageGenerator');
        
        const enhancedRes = await enhanceImagePrompt(message);
        if (enhancedRes.success) {
          const imageUrl = await generateImage(enhancedRes.enhancedPrompt);
          text = `Done! Your image is ready.\n\n![Generated Image](${imageUrl})`;
        } else {
          text = `I'm sorry, I couldn't generate that image. ${enhancedRes.error || ""}`;
        }
      } catch (err) {
        console.error("Error in image generation module:", err);
        text = "I'm sorry, I encountered an internal error while generating your image.";
      }
    } else {
      // Standard text chat
      const modelName = (files && files.length > 0) ? "gemini-flash-latest" : "gemini-flash-lite-latest";
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: "You are a helpful AI assistant named Rivo. Your name is Rivo. Always introduce yourself as Rivo if asked."
      });

      // Format history for Gemini API based on DB messages (excluding the one we just added)
      const formattedHistory = chatDoc.messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: formattedHistory,
      });
      
      let retries = 3;
      while (retries > 0) {
        try {
          const result = await chat.sendMessage(parts);
          const response = await result.response;
          text = response.text();
          break; // Success!
        } catch (err) {
          if (err.status === 503 && retries > 1) {
            retries--;
            await new Promise(r => setTimeout(r, 1000));
          } else {
            throw err;
          }
        }
      }
    }

    // Add bot message to document
    chatDoc.messages.push({ role: 'model', content: text });

    if (isNewChat && titlePromise) {
      try {
        const titleResult = await titlePromise;
        let generatedTitle = titleResult.response.text().trim();
        // Remove quotes if the AI included them
        generatedTitle = generatedTitle.replace(/^["'](.*)["']$/, '$1');
        if (generatedTitle) {
          chatDoc.title = generatedTitle;
        }
      } catch (e) {
        console.error("Failed to generate smart title", e);
      }
    }

    await chatDoc.save();

    res.json({ response: text, chatId: chatDoc._id });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate response. Check your API key and network.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
