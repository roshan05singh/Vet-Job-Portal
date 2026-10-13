const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, trim: true, maxlength: 40 },
  message: { type: String, required: true, trim: true, maxlength: 300 },
  link: { type: String, default: '', maxlength: 200 },
  readAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
