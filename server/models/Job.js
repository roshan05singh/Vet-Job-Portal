const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  clinic: { type: String, required: true },
  location: { type: String, default: 'Remote / Flexible' },
  type: { type: String, default: 'Full Time' },
  opportunityType: { type: String, enum: ['Job', 'Internship', 'Externship', 'Locum', 'Relief'], default: 'Job', index: true },
  status: { type: String, enum: ['Published', 'Hidden'], default: 'Published', index: true },
  moderationNote: { type: String, default: '', maxlength: 500 },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  moderatedAt: { type: Date, default: null },
  duration: { type: String, default: '', maxlength: 120 },
  eligibility: { type: String, default: '', maxlength: 1000 },
  responsibilities: { type: String, default: '', maxlength: 3000 },
  stipend: { type: String, default: '', maxlength: 200 },
  applicationDeadline: { type: Date, default: null },
  mentorshipDetails: { type: String, default: '', maxlength: 1000 },
  learningObjectives: { type: String, default: '', maxlength: 2000 },
  applicationInstructions: { type: String, default: '', maxlength: 1000 },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  shiftDetails: { type: String, default: '', maxlength: 500 },
  latitude: { type: Number, min: -90, max: 90, default: null },
  longitude: { type: Number, min: -180, max: 180, default: null },
  experienceLevel: { type: String, default: '' },
  workMode: { type: String, enum: ['On-site', 'Remote', 'Hybrid', 'Flexible', ''], default: '' },
  salaryMin: { type: Number, min: 0, default: null },
  salaryMax: { type: Number, min: 0, default: null },
  currency: { type: String, default: 'INR', uppercase: true, trim: true },
  payFrequency: { type: String, enum: ['hour', 'day', 'week', 'month', 'year', ''], default: '' },
  benefits: [{ type: String, trim: true }],
  accommodation: { type: String, default: '' },
  relocationAssistance: { type: String, default: '' },
  pay: { type: String, default: '₹ Competitive' },
  recruiterEmail: { type: String, default: '', lowercase: true },
  businessDetails: {
    businessName: { type: String, default: '' },
    contactName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
  },
  schedule: { type: String, default: 'Flexible schedule' },
  tags: [{ type: String }],
  description: { type: String, default: 'New veterinary staffing opportunity.' },
  requirements: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

jobSchema.index({ createdAt: -1 });
jobSchema.index({ type: 1, location: 1 });
jobSchema.index({ salaryMin: 1, salaryMax: 1 });
jobSchema.index({ title: 'text', clinic: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
