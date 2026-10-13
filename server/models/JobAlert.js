const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  keywords: { type: String, default: '', trim: true, maxlength: 120 },
  location: { type: String, default: '', trim: true, maxlength: 100 },
  specialization: { type: String, default: '', trim: true, maxlength: 60 },
  type: { type: String, default: '', trim: true, maxlength: 40 },
  minSalary: { type: Number, default: null, min: 0 },
  maxSalary: { type: Number, default: null, min: 0 },
  currency: { type: String, default: 'INR', uppercase: true, trim: true, maxlength: 3 },
  frequency: { type: String, enum: ['Instant', 'Daily', 'Weekly'], default: 'Instant' },
  active: { type: Boolean, default: true },
  pendingJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  lastDigestSentAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.models.JobAlert || mongoose.model('JobAlert', jobAlertSchema);
