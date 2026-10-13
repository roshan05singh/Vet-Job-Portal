const mongoose = require('mongoose');

const careerGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 1200 },
  targetDate: { type: Date, default: null },
  milestones: [{ title: { type: String, required: true, trim: true, maxlength: 160 }, completed: { type: Boolean, default: false } }],
}, { timestamps: true });

module.exports = mongoose.models.CareerGoal || mongoose.model('CareerGoal', careerGoalSchema);
