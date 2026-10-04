const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  clinic: { type: String, required: true },
  location: { type: String, default: 'Remote / Flexible' },
  type: { type: String, default: 'Full Time' },
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

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
