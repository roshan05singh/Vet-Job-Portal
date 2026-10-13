const mongoose = require('mongoose');

const learningResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  category: { type: String, required: true, trim: true, maxlength: 80, index: true },
  summary: { type: String, required: true, trim: true, maxlength: 1000 },
  url: { type: String, required: true, trim: true, maxlength: 1000 },
  tags: [{ type: String, trim: true, maxlength: 60 }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  published: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.models.LearningResource || mongoose.model('LearningResource', learningResourceSchema);
