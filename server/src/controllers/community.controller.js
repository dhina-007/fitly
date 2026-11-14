const Community = require('../models/Community');
const FeedPost = require('../models/FeedPost');
const User = require('../models/User');
const { ensureCommunitySeedData } = require('../services/communityProgress.service');

let seededOnce = false;
async function ensureSeed() {
  if (!seededOnce) {
    seededOnce = true;
    await ensureCommunitySeedData();
  }
}

// 1. Get Feed Posts (Admin-created posts visible to all authenticated users)
async function getFeedPosts(req, res, next) {
  try {
    await ensureSeed();
    const uid = req.user.uid;
    const [posts, currentUser] = await Promise.all([
      FeedPost.find({}).sort({ isPinned: -1, createdAt: -1 }).lean(),
      User.findOne({ firebaseUid: uid }).select('feedJoined isAdmin').lean(),
    ]);

    const enriched = posts.map((post) => ({
      ...post,
      likesCount: (post.likes || []).length,
      userLiked: (post.likes || []).includes(uid),
      joinedCount: (post.joinedUsers || []).length,
      userJoined: (post.joinedUsers || []).includes(uid),
    }));

    res.json({
      success: true,
      data: enriched,
      feedJoined: Boolean(currentUser?.feedJoined),
      isAdmin: Boolean(req.user.isAdmin || currentUser?.isAdmin),
    });
  } catch (err) {
    next(err);
  }
}

// 2. Create Feed Post (Admin ONLY)
async function createFeedPost(req, res, next) {
  try {
    const { title = '', content, category = 'announcement', communityId = null, isPinned = false } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Feed post content is required' });
    }

    let resolvedCommunityId = null;
    let communityName = null;
    if (communityId) {
      const comm = await Community.findById(communityId).lean();
      if (comm) {
        resolvedCommunityId = comm._id;
        communityName = comm.name;
      }
    }

    const adminUser = await User.findOne({ firebaseUid: req.user.uid }).lean();
    const post = await FeedPost.create({
      title: title.trim(),
      content: content.trim(),
      category,
      communityId: resolvedCommunityId,
      communityName,
      authorId: req.user.uid,
      authorName: adminUser?.name || req.user.name || 'Fitly Admin',
      authorRole: 'Admin',
      isPinned: Boolean(isPinned),
    });

    res.status(201).json({
      success: true,
      data: {
        ...post.toObject(),
        likesCount: 0,
        userLiked: false,
        joinedCount: 0,
        userJoined: false,
      },
    });
  } catch (err) {
    next(err);
  }
}

// 3. Delete Feed Post (Admin ONLY)
async function deleteFeedPost(req, res, next) {
  try {
    const deleted = await FeedPost.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Feed post not found' });
    }
    res.json({ success: true, message: 'Feed post deleted' });
  } catch (err) {
    next(err);
  }
}

// 4. Join / Follow Global Admin Feed (Normal User & Admin)
async function toggleSubscribeFeed(req, res, next) {
  try {
    const uid = req.user.uid;
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: req.user.email ? req.user.email.toLowerCase() : `${uid}@fitly.app`,
        name: req.user.name || 'Fitly User',
        isAdmin: Boolean(req.user.isAdmin),
      });
    }
    user.feedJoined = !user.feedJoined;
    await user.save();

    res.json({
      success: true,
      data: { feedJoined: user.feedJoined },
      message: user.feedJoined ? 'Joined Fitly Official Feed!' : 'Left Fitly Official Feed',
    });
  } catch (err) {
    next(err);
  }
}

// 5. Like / Unlike a Feed Post
async function toggleLikeFeedPost(req, res, next) {
  try {
    const uid = req.user.uid;
    const post = await FeedPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Feed post not found' });
    }

    const idx = post.likes.indexOf(uid);
    let userLiked = false;
    if (idx >= 0) {
      post.likes.splice(idx, 1);
      userLiked = false;
    } else {
      post.likes.push(uid);
      userLiked = true;
    }
    await post.save();

    res.json({
      success: true,
      data: { _id: post._id, likesCount: post.likes.length, userLiked },
    });
  } catch (err) {
    next(err);
  }
}

// 6. Join / Participate in a Feed Post (e.g. Challenge / Announcement)
async function toggleJoinFeedPost(req, res, next) {
  try {
    const uid = req.user.uid;
    const post = await FeedPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Feed post not found' });
    }

    if (!Array.isArray(post.joinedUsers)) post.joinedUsers = [];
    const idx = post.joinedUsers.indexOf(uid);
    let userJoined = false;
    if (idx >= 0) {
      post.joinedUsers.splice(idx, 1);
      userJoined = false;
    } else {
      post.joinedUsers.push(uid);
      userJoined = true;
    }
    await post.save();

    res.json({
      success: true,
      data: { _id: post._id, joinedCount: post.joinedUsers.length, userJoined },
    });
  } catch (err) {
    next(err);
  }
}

// 7. Get All Active Communities (Posted by Admin, visible to all)
async function getCommunities(req, res, next) {
  try {
    await ensureSeed();
    const uid = req.user.uid;
    const communities = await Community.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = communities.map((c) => {
      const members = c.members || [];
      const myMember = members.find((m) => m.userId === uid) || null;
      const leaderboard = [...members]
        .sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0))
        .slice(0, 10);

      return {
        ...c,
        memberCount: members.length,
        isJoined: Boolean(myMember),
        myStats: myMember,
        leaderboard,
        updates: (c.updates || []).slice(0, 10),
      };
    });

    res.json({
      success: true,
      data: enriched,
      isAdmin: Boolean(req.user.isAdmin),
    });
  } catch (err) {
    next(err);
  }
}

// 8. Create Community (Admin ONLY)
async function createCommunity(req, res, next) {
  try {
    const {
      name,
      description = '',
      category = 'general',
      icon = 'Users',
      reward = 'Community Badge',
      taskHint = 'Complete your daily habits or workouts to automatically update this community.',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Community name is required' });
    }

    const adminUser = await User.findOne({ firebaseUid: req.user.uid }).lean();
    const community = await Community.create({
      name: name.trim(),
      description: description.trim(),
      category,
      icon,
      reward: reward.trim() || 'Community Badge',
      taskHint: taskHint.trim(),
      createdBy: req.user.uid,
      createdByName: adminUser?.name || req.user.name || 'Fitly Admin',
      members: [],
      updates: [],
    });

    res.status(201).json({
      success: true,
      data: {
        ...community.toObject(),
        memberCount: 0,
        isJoined: false,
        myStats: null,
        leaderboard: [],
        updates: [],
      },
    });
  } catch (err) {
    next(err);
  }
}

// 9. Delete Community (Admin ONLY)
async function deleteCommunity(req, res, next) {
  try {
    const community = await Community.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.json({ success: true, message: 'Community removed' });
  } catch (err) {
    next(err);
  }
}

// 10. Join Community (Normal User & Admin)
async function joinCommunity(req, res, next) {
  try {
    const uid = req.user.uid;
    const community = await Community.findOne({ _id: req.params.id, isActive: true });
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const existing = community.members.find((m) => m.userId === uid);
    if (existing) {
      return res.json({
        success: true,
        data: community,
        message: 'Already a member of this community',
      });
    }

    const user = await User.findOne({ firebaseUid: uid }).lean();
    community.members.push({
      userId: uid,
      userName: user?.name || req.user.name || 'Dhina',
      userAvatar: user?.profilePhoto || null,
      joinedAt: new Date(),
      tasksCompleted: 0,
      lastTaskTitle: null,
      lastUpdatedAt: null,
    });
    await community.save();

    res.json({
      success: true,
      data: {
        ...community.toObject(),
        isJoined: true,
        memberCount: community.members.length,
      },
      message: `Joined ${community.name}! Completing your tasks will now update here automatically.`,
    });
  } catch (err) {
    next(err);
  }
}

// 11. Leave Community
async function leaveCommunity(req, res, next) {
  try {
    const uid = req.user.uid;
    const community = await Community.findOne({ _id: req.params.id, isActive: true });
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    community.members = community.members.filter((m) => m.userId !== uid);
    await community.save();

    res.json({
      success: true,
      data: {
        ...community.toObject(),
        isJoined: false,
        memberCount: community.members.length,
      },
      message: `Left ${community.name}`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFeedPosts,
  createFeedPost,
  deleteFeedPost,
  toggleSubscribeFeed,
  toggleLikeFeedPost,
  toggleJoinFeedPost,
  getCommunities,
  createCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
};
