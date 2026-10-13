const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startsAt: { type: Date, required: true },
  timeZone: { type: String, default: 'UTC', trim: true, maxlength: 80 },
  durationMinutes: { type: Number, default: 30, min: 15, max: 240 },
  mode: { type: String, enum: ['Video', 'Phone', 'In person'], required: true },
  locationOrLink: { type: String, default: '', maxlength: 500 },
  notes: { type: String, default: '', maxlength: 2000 },
  status: { type: String, enum: ['Scheduled', 'Cancelled'], default: 'Scheduled' },
  candidateResponse: { type: String, enum: ['Pending', 'Confirmed', 'Declined'], default: 'Pending' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);
