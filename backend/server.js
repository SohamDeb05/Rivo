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

// Serve attachments as raw media (useful for external APIs that need an image URL)
app.get('/api/media/:chatId/:messageIndex/:attachmentIndex', async (req, res) => {
  try {
    const { chatId, messageIndex, attachmentIndex } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.messages[messageIndex]) return res.status(404).send('Not found');
    
    const attachment = chat.messages[messageIndex].attachments?.[attachmentIndex];
    if (!attachment) return res.status(404).send('Attachment not found');

    const imgBuffer = Buffer.from(attachment.data, 'base64');
    res.set('Content-Type', attachment.mimeType);
    res.send(imgBuffer);
  } catch (error) {
    console.error('Error serving media:', error);
    res.status(500).send('Internal server error');
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    let { message, chatId, userId, files, regenerate } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!genAI) {
       return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it to your backend/.env file.' });
    }

    // Find or create chat document
    let isNewChat = false;
    let chatDoc;
    if (chatId) {
      chatDoc = await Chat.findOne({ _id: chatId, userId });
      if (!chatDoc) {
        return res.status(404).json({ error: 'Chat not found or unauthorized' });
      }
    } else {
      if (!message) return res.status(400).json({ error: 'Message is required' });
      // Create new chat with a temporary title
      const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
      chatDoc = new Chat({ title, userId, messages: [] });
      isNewChat = true;
    }

    let userMessageContent = message;
    let parts = [];
    let originalMessageText = message;

    if (regenerate) {
       if (chatDoc.messages.length > 0 && chatDoc.messages[chatDoc.messages.length - 1].role === 'model') {
           chatDoc.messages.pop(); // Remove the last bot response
       }
       if (chatDoc.messages.length > 0 && chatDoc.messages[chatDoc.messages.length - 1].role === 'user') {
           const lastUserMsg = chatDoc.messages[chatDoc.messages.length - 1];
           if (!message) {
               message = lastUserMsg.content;
               originalMessageText = message.replace('\n[File(s) Attached]', '');
               files = lastUserMsg.attachments;
           } else {
               originalMessageText = message;
           }
       } else {
           if (!message) return res.status(400).json({ error: 'Message is required to regenerate an unsaved message' });
           if (files && files.length > 0) {
             userMessageContent += '\n[File(s) Attached]';
           }
           // Add user message to document since it wasn't there
           chatDoc.messages.push({ 
             role: 'user', 
             content: userMessageContent,
             attachments: files && files.length > 0 ? files.map(f => ({ data: f.data, mimeType: f.mimeType })) : undefined
           });
           originalMessageText = message;
       }
    } else {
       if (!message) return res.status(400).json({ error: 'Message is required' });
       
       if (files && files.length > 0) {
         userMessageContent += '\n[File(s) Attached]';
       }

       // Add user message to document
       chatDoc.messages.push({ 
         role: 'user', 
         content: userMessageContent,
         attachments: files && files.length > 0 ? files.map(f => ({ data: f.data, mimeType: f.mimeType })) : undefined
       });
    }

    // Build parts for the current message
    parts.push({ text: originalMessageText });
    if (files && files.length > 0) {
      files.forEach(f => {
        let mime = f.mimeType;
        if (!mime || mime.trim() === '') {
           mime = 'application/pdf';
        }
        parts.push({
          inlineData: {
            data: f.data,
            mimeType: mime
          }
        });
      });
    }

    // Smart Intent Detection: Generate, Edit, or Text Chat
    const hasImage = files && files.length > 0;
    
    let imageMode = 'NO';
    const msgLower = message.toLowerCase();
    const imageKeywords = ['image', 'picture', 'photo', 'pic', 'generate', 'create', 'draw', 'edit', 'modify'];
    const mightBeImageRequest = imageKeywords.some(kw => msgLower.includes(kw)) || hasImage;

    if (mightBeImageRequest) {
      const intentPrompt = `Does this user request ask to generate a new image, OR edit/modify an existing image?
Respond with exactly "GENERATE" if they want a new image.
Respond with exactly "EDIT" if they want to modify/edit an image.
Respond with exactly "NO" if it's just a normal text chat.
Request: "${message}"
Has Uploaded Image: ${hasImage ? "YES" : "NO"}
`;
      const intentModel = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
      const intentResult = await intentModel.generateContent(intentPrompt);
      const intentStr = intentResult.response.text().trim().toUpperCase();
      
      imageMode = intentStr.includes('EDIT') ? (hasImage ? 'EDIT' : 'GENERATE') 
                      : intentStr.includes('GENERATE') ? 'GENERATE' 
                      : 'NO';
    }

    let titlePromise = null;
    if (isNewChat) {
      const titleModel = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
      titlePromise = titleModel.generateContent(`Generate a highly concise 2 to 4 word title for this prompt. Do not use quotes or punctuation: "${message}"`);
    }

    let text = "";

    if (imageMode !== 'NO') {
      try {
        const { processImageRequest } = require('./dist/image-engine/imageRouter');
        
        let referenceImageUrl = undefined;
        if (imageMode === 'EDIT') {
           const attachmentIndex = chatDoc.messages[chatDoc.messages.length - 1].attachments.findIndex(a => a.mimeType.startsWith('image/'));
           if (attachmentIndex !== -1) {
             const protocol = req.protocol === 'http' && req.get('host').includes('localhost') ? 'http' : 'https';
             referenceImageUrl = `${protocol}://${req.get('host')}/api/media/${chatDoc._id}/${chatDoc.messages.length - 1}/${attachmentIndex}`;
           }
        }

        const engineResult = await processImageRequest({
           prompt: message,
           mode: imageMode,
           referenceImageUrl
        });
        
        if (engineResult.success) {
          text = `Done! Your image is ready.\n\n![Generated Image](${engineResult.imageUrl})`;
        } else {
          text = `I'm sorry, I couldn't process your request. ${engineResult.error || ""}`;
        }
      } catch (err) {
        console.error("Error in image processing module:", err);
        text = "I'm sorry, I encountered an internal error while processing your image.";
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
    await chatDoc.save();

    res.json({ response: text, chatId: chatDoc._id });

    if (isNewChat && titlePromise) {
      // Process title asynchronously to avoid blocking response
      titlePromise.then(async (titleResult) => {
        try {
          let generatedTitle = titleResult.response.text().trim();
          generatedTitle = generatedTitle.replace(/^["'](.*)["']$/, '$1');
          if (generatedTitle) {
            chatDoc.title = generatedTitle;
            await chatDoc.save();
          }
        } catch (e) {
          console.error("Failed to update smart title", e);
        }
      }).catch(e => {
        console.error("Failed to generate smart title", e);
      });
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error.response) console.error('Gemini API Error Response:', error.response.data);
    res.status(500).json({ error: 'Failed to generate response. Check your API key and network.' });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
  });
}

module.exports = app;
