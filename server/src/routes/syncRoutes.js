const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const SleepLog = require('../models/SleepLog');

// POST /api/sync/device
router.post('/device', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { date, steps, activeCalories, sleepHours, source } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    // Upsert Activity Log
    if (steps !== undefined || activeCalories !== undefined) {
      await ActivityLog.findOneAndUpdate(
        { userId, date },
        {
          $set: {
            steps: steps || 0,
            activeCalories: activeCalories || 0,
            source: source || 'health_connect'
          }
        },
        { upsert: true, new: true }
      );
    }

    // Upsert Sleep Log
    if (sleepHours !== undefined) {
      const hoursNum = Number(sleepHours) || 7.5;
      const bed = new Date(Date.now() - hoursNum * 3600000);
      const wake = new Date();
      await SleepLog.findOneAndUpdate(
        { userId, date },
        {
          $set: {
            userId,
            date,
            bedtime: bed,
            wakeTime: wake,
            duration: hoursNum,
            quality: 4,
            source: source || 'health_connect'
          }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, message: 'Device data synced successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
