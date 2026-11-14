const mongoose = require('mongoose');

const feedPostSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '', maxlength: 140 },
  content: { type: String, required: true, trim: true, maxlength: 1500 },
  category: {
    type: String,
    enum: ['announcement', 'workout', 'nutrition', 'motivation', 'challenge'],
    default: 'announcement',
  },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null },
  communityName: { type: String, default: null },
  authorId: { type: String, required: true },
  authorName: { type: String, default: 'Fitly Admin' },
  authorRole: { type: String, default: 'Admin' },
  likes: [{ type: String }],
  joinedUsers: [{ type: String }],
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

feedPostSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('FeedPost', feedPostSchema);
