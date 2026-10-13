const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kind: { type: String, enum: ['Candidate', 'Employer'], required: true },
  documentName: { type: String, required: true, maxlength: 120 },
  documentData: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });

module.exports = mongoose.models.VerificationRequest || mongoose.model('VerificationRequest', verificationRequestSchema);
