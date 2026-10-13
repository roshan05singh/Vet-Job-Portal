const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  goal: { type: String, required: true, trim: true, maxlength: 1500 },
  topic: { type: String, required: true, trim: true, maxlength: 100 },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
}, { timestamps: true });
mentorshipRequestSchema.index({ mentorId: 1, menteeId: 1 }, { unique: true, partialFilterExpression: { status: 'Pending' } });

module.exports = mongoose.models.MentorshipRequest || mongoose.model('MentorshipRequest', mentorshipRequestSchema);
