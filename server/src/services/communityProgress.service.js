const User = require('../models/User');
const Community = require('../models/Community');
const FeedPost = require('../models/FeedPost');

const ADMIN_UID = 'admin-user-uid-fitly';
const MEMBER_UID = 'dev-user-uid-12345';

/**
 * Automatically updates all communities a user has joined whenever they complete
 * one of their own tasks (daily habit, workout, etc.).
 * Prevents duplicate recording for the same taskKey.
 */
async function recordUserTaskCompletion(userId, { taskKey, taskTitle, taskCategory = 'habit' }) {
  if (!userId || !taskTitle) return { updatedCommunities: 0 };

  try {
    const [user, joinedCommunities] = await Promise.all([
      User.findOne({ firebaseUid: userId }).lean(),
      Community.find({ isActive: true, 'members.userId': userId }),
    ]);

    if (!joinedCommunities || joinedCommunities.length === 0) {
      return { updatedCommunities: 0 };
    }

    const userName = user?.name || 'Dhina';
    const userAvatar = user?.profilePhoto || null;
    const now = new Date();
    let updatedCommunities = 0;

    for (const community of joinedCommunities) {
      const member = community.members.find((m) => m.userId === userId);
      if (!member) continue;

      // Avoid double counting the same taskKey if toggled repeatedly
      const alreadyRecorded = taskKey
        ? community.updates.some((u) => u.userId === userId && u.taskKey === taskKey)
        : false;

      member.userName = userName;
      if (userAvatar) member.userAvatar = userAvatar;
      member.lastTaskTitle = taskTitle;
      member.lastUpdatedAt = now;

      if (!alreadyRecorded) {
        member.tasksCompleted = (member.tasksCompleted || 0) + 1;
        community.updates.unshift({
          userId,
          userName,
          taskKey: taskKey || null,
          taskTitle,
          taskCategory,
          completedAt: now,
        });
        if (community.updates.length > 30) {
          community.updates = community.updates.slice(0, 30);
        }
      }

      await community.save();
      updatedCommunities++;
    }

    return { updatedCommunities };
  } catch (err) {
    console.warn('Community auto-update skipped:', err.message);
    return { updatedCommunities: 0 };
  }
}

/**
 * Ensures default Admin user, Member user, and starter Admin-created
 * Communities & Feed posts exist in MongoDB.
 */
async function ensureCommunitySeedData() {
  try {
    // 1. Ensure Admin User exists
    const existingAdmin = await User.findOne({
      $or: [{ firebaseUid: ADMIN_UID }, { email: 'admin@fitly.app' }],
    });
    if (existingAdmin) {
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
      }
    } else {
      await User.create({
        firebaseUid: ADMIN_UID,
        name: 'Fitly Admin',
        email: 'admin@fitly.app',
        isAdmin: true,
        onboardingCompleted: true,
        fitnessGoal: 'general_fitness',
      });
    }

    // 2. Ensure Normal Member User exists (never force isAdmin = true)
    const existingMember = await User.findOne({
      $or: [{ firebaseUid: MEMBER_UID }, { email: 'dhina@fitly.app' }],
    });
    if (!existingMember) {
      await User.create({
        firebaseUid: MEMBER_UID,
        name: 'Dhina',
        email: 'dhina@fitly.app',
        isAdmin: false,
        onboardingCompleted: true,
        currentWeight: 71.0,
        targetWeight: 68.0,
        height: 173,
        age: 26,
        gender: 'male',
        activityLevel: 'moderately_active',
        fitnessGoal: 'weight_loss',
      });
    }

    // 3. Seed starter Admin Communities if none exist
    const communityCount = await Community.countDocuments({ isActive: true });
    let createdCommunities = [];
    if (communityCount === 0) {
      createdCommunities = await Community.insertMany([
        {
          name: 'Daily Habit & Consistency Club',
          description: 'Join to automatically share progress whenever you complete your own daily habits.',
          category: 'habits',
          icon: 'Zap',
          reward: 'Consistency Badge',
          taskHint: 'Complete any daily habit in Daily Habits Tracker to auto-update your score here.',
          createdBy: ADMIN_UID,
          createdByName: 'Fitly Admin',
          members: [],
          updates: [],
        },
        {
          name: 'Strength & Workout finishers',
          description: 'Official coach-led training community. Every completed workout syncs automatically.',
          category: 'workout',
          icon: 'Dumbbell',
          reward: 'Iron Finisher Badge',
          taskHint: 'Finish a workout session to automatically log your achievement in this community.',
          createdBy: ADMIN_UID,
          createdByName: 'Fitly Admin',
          members: [],
          updates: [],
        },
        {
          name: 'Clean Nutrition & Hydration',
          description: 'Build sustainable hydration and mindful nutrition routines alongside other members.',
          category: 'nutrition',
          icon: 'Apple',
          reward: 'Nutrition Champion',
          taskHint: 'Complete nutrition or hydration habits to update your streak automatically.',
          createdBy: ADMIN_UID,
          createdByName: 'Fitly Admin',
          members: [],
          updates: [],
        },
      ]);
    } else {
      createdCommunities = await Community.find({ isActive: true }).limit(2).lean();
    }

    // 4. Seed starter Admin Feed Posts if none exist
    const feedCount = await FeedPost.countDocuments();
    if (feedCount === 0) {
      const firstComm = createdCommunities[0];
      await FeedPost.insertMany([
        {
          title: 'Welcome to the Official Fitly Community Feed',
          content: 'Admins publish training spotlights, challenges, and coaching announcements here. Join the Feed and your favorite communities — every time you complete your own habit or workout, your joined communities update automatically!',
          category: 'announcement',
          communityId: firstComm?._id || null,
          communityName: firstComm?.name || null,
          authorId: ADMIN_UID,
          authorName: 'Fitly Admin',
          authorRole: 'Admin',
          isPinned: true,
        },
        {
          title: 'This Week Coach Focus: Consistency Over Intensity',
          content: 'Aim for 3 structured workouts and 1 daily hydration/step habit this week. Join the Daily Habit & Consistency Club in the Communities tab and watch your completed tasks sync automatically.',
          category: 'workout',
          communityId: createdCommunities[1]?._id || null,
          communityName: createdCommunities[1]?.name || null,
          authorId: ADMIN_UID,
          authorName: 'Fitly Admin',
          authorRole: 'Admin',
          isPinned: false,
        },
      ]);
    }
  } catch (err) {
    console.warn('Community seed check failed:', err.message);
  }
}

module.exports = {
  recordUserTaskCompletion,
  ensureCommunitySeedData,
  ADMIN_UID,
  MEMBER_UID,
};
