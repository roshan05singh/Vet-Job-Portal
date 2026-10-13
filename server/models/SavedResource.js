const mongoose = require('mongoose');

const savedResourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningResource', required: true },
  createdAt: { type: Date, default: Date.now },
});
savedResourceSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.models.SavedResource || mongoose.model('SavedResource', savedResourceSchema);
