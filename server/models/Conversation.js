const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  }],
  lastMessageAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
