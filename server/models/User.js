const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  avatarData: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  qualifications: { type: String, default: '' },
  resumeName: { type: String, default: '' },
  resumeData: { type: String, default: '' },
  role: { type: String, default: 'Veterinarian' },
  businessDetails: {
    businessName: { type: String, default: '' },
    contactName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
  },
  resetTokenHash: { type: String, default: '' },
  resetTokenExpiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
