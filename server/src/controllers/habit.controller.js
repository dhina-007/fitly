const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const { recordUserTaskCompletion } = require('../services/communityProgress.service');

async function getHabits(req, res, next) {
  try {
    const habits = await Habit.find({ userId: req.user.uid, isActive: true }).lean();
    
    // Get target date string (YYYY-MM-DD)
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    
    // Find logs for target date
    const logs = await HabitLog.find({ userId: req.user.uid, date: targetDate }).lean();
    const completedHabitIds = new Set(logs.filter(l => l.completed).map(l => l.habitId.toString()));
    
    const habitsWithStatus = habits.map(h => ({
      ...h,
      completedToday: completedHabitIds.has(h._id.toString())
    }));
    
    res.json({ success: true, data: habitsWithStatus });
  } catch (err) {
    next(err);
  }
}

async function createHabit(req, res, next) {
  try {
    const { name, description, icon, category, color, reminderTime } = req.body;
    const habit = await Habit.create({ userId: req.user.uid, name, description, icon, category, color, reminderTime });
    res.status(201).json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
}

async function toggleHabit(req, res, next) {
  try {
    const uid = req.user.uid;
    const { habitId } = req.params;
    const { date } = req.body;

    // Verify habit belongs to user
    const habit = await Habit.findOne({ _id: habitId, userId: uid });
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });

    let log = await HabitLog.findOne({ userId: uid, habitId, date });
    if (log) {
      log.completed = !log.completed;
      log.completedAt = log.completed ? new Date() : null;
    } else {
      log = new HabitLog({ userId: uid, habitId, date, completed: true, completedAt: new Date() });
    }
    await log.save();

    // Update streak & auto-sync completed task to joined communities
    let communitySync = { updatedCommunities: 0 };
    if (log.completed) {
      habit.currentStreak += 1;
      if (habit.currentStreak > habit.longestStreak) habit.longestStreak = habit.currentStreak;
      const targetDate = date || new Date().toISOString().split('T')[0];
      communitySync = await recordUserTaskCompletion(uid, {
        taskKey: `habit:${habit._id}:${targetDate}`,
        taskTitle: `Completed task: ${habit.name}`,
        taskCategory: 'habit',
      });
    } else {
      habit.currentStreak = Math.max(0, habit.currentStreak - 1);
    }
    await habit.save();

    res.json({ success: true, data: log, communityUpdatesCount: communitySync.updatedCommunities });
  } catch (err) {
    next(err);
  }
}

async function deleteHabit(req, res, next) {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.habitId, userId: req.user.uid },
      { isActive: false },
      { new: true }
    );
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    res.json({ success: true, message: 'Habit deleted' });
  } catch (err) {
    next(err);
  }
}

async function getHabitLogs(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const logs = await HabitLog.find({
      userId: req.user.uid,
      date: { $gte: startDate, $lte: endDate },
    }).lean();
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

async function updateHabit(req, res, next) {
  try {
    const { habitId } = req.params;
    const { name, description, icon, category, color, reminderTime } = req.body;
    
    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, userId: req.user.uid },
      { name, description, icon, category, color, reminderTime },
      { new: true }
    );
    
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    res.json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHabits, createHabit, updateHabit, toggleHabit, deleteHabit, getHabitLogs };
