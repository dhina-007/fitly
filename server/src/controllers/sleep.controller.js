const SleepLog = require('../models/SleepLog');

async function getLogs(req, res, next) {
  try {
    const { range = '30d' } = req.query;
    const uid = req.user.uid;
    const days = { '7d': 7, '30d': 30, '90d': 90 }[range] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await SleepLog.find({ userId: uid, createdAt: { $gte: startDate } })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

async function addLog(req, res, next) {
  try {
    const uid = req.user.uid;
    const { date, bedtime, wakeTime, quality, notes, hours, duration } = req.body;

    const sleepDuration = Number(duration || hours) || 7.5;
    const bed = bedtime ? new Date(bedtime) : new Date(Date.now() - sleepDuration * 3600000);
    const wake = wakeTime ? new Date(wakeTime) : new Date(bed.getTime() + sleepDuration * 3600000);
    const computedDuration = Math.round(((wake - bed) / 3600000) * 10) / 10;

    let numQuality = typeof quality === 'number' ? quality : 4;
    if (typeof quality === 'string') {
      const qLower = quality.toLowerCase();
      if (qLower.includes('great') || qLower.includes('excellent')) numQuality = 5;
      else if (qLower.includes('good')) numQuality = 4;
      else if (qLower.includes('fair') || qLower.includes('avg')) numQuality = 3;
      else numQuality = 2;
    }

    const log = await SleepLog.findOneAndUpdate(
      { userId: uid, date },
      { userId: uid, date, bedtime: bed, wakeTime: wake, duration: computedDuration, quality: numQuality, notes, source: 'manual' },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLogs, addLog };
