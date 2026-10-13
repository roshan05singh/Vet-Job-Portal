const mongoose = require('mongoose');

const interviewPracticeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  specialization: { type: String, default: '', maxlength: 80 },
  answers: [{ questionId: { type: String, required: true, maxlength: 100 }, answer: { type: String, default: '', maxlength: 3000 }, selfRating: { type: Number, min: 1, max: 5, default: null } }],
  completedAt: { type: Date, default: null },
}, { timestamps: true });
interviewPracticeSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.models.InterviewPractice || mongoose.model('InterviewPractice', interviewPracticeSchema);
