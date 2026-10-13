const mongoose = require('mongoose');

const clinicReviewSchema = new mongoose.Schema({
  clinicOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['Published', 'Hidden'], default: 'Published', index: true },
  reports: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: { type: String, maxlength: 300 }, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true });
clinicReviewSchema.index({ applicationId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.models.ClinicReview || mongoose.model('ClinicReview', clinicReviewSchema);
