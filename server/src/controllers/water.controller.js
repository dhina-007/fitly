const WaterLog = require('../models/WaterLog');

async function getLog(req, res, next) {
  try {
    const { date } = req.params;
    const log = await WaterLog.findOne({ userId: req.user.uid, date }).lean();
    res.json({ success: true, data: log || { date, entries: [], totalAmount: 0 } });
  } catch (err) {
    next(err);
  }
}

async function addWater(req, res, next) {
  try {
    const uid = req.user.uid;
    const amount = Number(req.body.amount !== undefined ? req.body.amount : req.body.amountMl);
    const date = req.body.date || new Date().toISOString().split('T')[0];

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid water amount is required' });
    }

    let log = await WaterLog.findOne({ userId: uid, date });
    if (!log) log = new WaterLog({ userId: uid, date, entries: [], totalAmount: 0 });

    log.entries.push({ amount, time: new Date() });
    log.totalAmount = log.entries.reduce((sum, e) => sum + e.amount, 0);
    await log.save();

    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

async function deleteEntry(req, res, next) {
  try {
    const uid = req.user.uid;
    const { date, entryId } = req.params;

    const log = await WaterLog.findOne({ userId: uid, date });
    if (!log) return res.status(404).json({ success: false, message: 'Not found' });

    log.entries = log.entries.filter(e => e._id.toString() !== entryId);
    log.totalAmount = log.entries.reduce((sum, e) => sum + e.amount, 0);
    await log.save();

    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLog, addWater, deleteEntry };
