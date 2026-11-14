const ActivityLog = require('../models/ActivityLog');

async function getLog(req, res, next) {
  try {
    const { date } = req.params;
    const log = await ActivityLog.findOne({ userId: req.user.uid, date }).lean();
    res.json({ success: true, data: log || { date, steps: 0, distance: 0, activeCalories: 0 } });
  } catch (err) {
    next(err);
  }
}

async function upsertLog(req, res, next) {
  try {
    const uid = req.user.uid;
    const { date, steps, distance, activeCalories, caloriesBurned, source = 'manual' } = req.body;
    const resolvedCalories = activeCalories !== undefined ? activeCalories : caloriesBurned;

    const log = await ActivityLog.findOneAndUpdate(
      { userId: uid, date },
      { userId: uid, date, steps, distance, activeCalories: resolvedCalories, source },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLog, upsertLog };
