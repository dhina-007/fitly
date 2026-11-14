const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  action: { type: String, default: null },
  loggedEntry: { type: mongoose.Schema.Types.Mixed, default: null },
  toolCalls: [{ type: mongoose.Schema.Types.Mixed }],
  timestamp: { type: Date, default: Date.now },
}, { _id: true });

const aiConversationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  messages: [messageSchema],
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

aiConversationSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
