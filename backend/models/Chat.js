const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  content: {
    type: String,
    required: true
  }
});

const chatSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'New Chat'
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
