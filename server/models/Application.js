const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true },
  employerEmail: { type: String, default: '', lowercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  location: { type: String, default: '' },
  qualifications: { type: String, default: '' },
  resumeName: { type: String, required: true },
  resumeData: { type: String, required: true },
  role: { type: String, default: 'Veterinarian' },
  jobTitle: { type: String, required: true, trim: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
    default: 'Applied',
  },
  statusHistory: [{
    status: { type: String, enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'] },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);
