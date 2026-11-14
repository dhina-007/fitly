const mongoose = require('mongoose');

const communityMemberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: 'Fitly Member' },
  userAvatar: { type: String, default: null },
  joinedAt: { type: Date, default: Date.now },
  tasksCompleted: { type: Number, default: 0 },
  lastTaskTitle: { type: String, default: null },
  lastUpdatedAt: { type: Date, default: null },
}, { _id: false });

const communityUpdateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: 'Fitly Member' },
  taskKey: { type: String, default: null },
  taskTitle: { type: String, required: true },
  taskCategory: {
    type: String,
    enum: ['habit', 'workout', 'water', 'weight', 'activity'],
    default: 'habit',
  },
  completedAt: { type: Date, default: Date.now },
}, { _id: true });

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, default: '', maxlength: 400 },
  category: {
    type: String,
    enum: ['workout', 'steps', 'nutrition', 'sleep', 'habits', 'general'],
    default: 'general',
  },
  icon: { type: String, default: 'Users' },
  reward: { type: String, default: 'Community Badge' },
  taskHint: {
    type: String,
    default: 'Complete your daily habits or workouts to automatically update this community.',
  },
  createdBy: { type: String, required: true },
  createdByName: { type: String, default: 'Fitly Admin' },
  members: [communityMemberSchema],
  updates: [communityUpdateSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

communitySchema.index({ 'members.userId': 1 });
communitySchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Community', communitySchema);
