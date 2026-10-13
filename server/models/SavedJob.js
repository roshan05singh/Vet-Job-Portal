const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  createdAt: { type: Date, default: Date.now },
});

savedJobSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.models.SavedJob || mongoose.model('SavedJob', savedJobSchema);
