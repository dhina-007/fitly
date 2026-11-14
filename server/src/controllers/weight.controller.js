const WeightLog = require('../models/WeightLog');
const User = require('../models/User');
const { predictMaintenanceCalories } = require('../utils/calorieCalculator');

async function getLogs(req, res, next) {
  try {
    const { range = '30d' } = req.query;
    const uid = req.user.uid;

    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365 };
    const query = { userId: uid };

    if (range !== 'all' && range !== 'lifetime') {
      const days = daysMap[range] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startStr = startDate.toISOString().split('T')[0];
      query.date = { $gte: startStr };
    }

    const logs = await WeightLog.find(query)
      .sort({ date: 1 })
      .lean();

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

const fs = require('fs');
const path = require('path');

async function addLog(req, res, next) {
  try {
    const uid = req.user.uid;
    const rawWeight = req.body.weight !== undefined ? req.body.weight : req.body.weightKg;
    const weight = parseFloat(rawWeight);
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const { notes, base64Image } = req.body;

    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({ success: false, message: 'Valid weight is required' });
    }

    // Get user profile metrics to calculate BMI & predicted maintenance calories
    const user = await User.findOne({ firebaseUid: uid }).select(
      'height age gender activityLevel fitnessGoal isCustomMaintenance'
    );
    let bmi;
    if (user?.height) {
      const heightM = user.height / 100;
      bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
    }

    let imageUrl = undefined;
    if (base64Image) {
      // Decode base64 and save it
      const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer;
      let ext = 'jpeg';
      if (matches && matches.length === 3) {
        ext = matches[1].split('/')[1] || 'jpeg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Image, 'base64');
      }
      const filename = `weight_${uid}_${date}_${Date.now()}.${ext}`;
      const filepath = path.join(__dirname, '..', '..', 'uploads', filename);
      fs.writeFileSync(filepath, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    const log = await WeightLog.findOneAndUpdate(
      { userId: uid, date },
      { userId: uid, date, weight, notes, bmi, ...(imageUrl && { imageUrl }) },
      { new: true, upsert: true, runValidators: true }
    );

    // Update current weight & auto-recalculate maintenance calories if not manually overridden
    const userUpdates = { currentWeight: weight };
    if (bmi !== undefined) userUpdates.bmi = bmi;
    const predicted = predictMaintenanceCalories({
      weight,
      height: user?.height,
      age: user?.age,
      gender: user?.gender,
      activityLevel: user?.activityLevel,
      fitnessGoal: user?.fitnessGoal,
    });
    if (predicted) {
      userUpdates.bmr = predicted.bmr;
      userUpdates.predictedTdee = predicted.maintenanceCalories;
      if (!user?.isCustomMaintenance) {
        userUpdates.tdee = predicted.maintenanceCalories;
        userUpdates.calorieTarget = predicted.calorieTarget;
        userUpdates.proteinTarget = predicted.proteinTarget;
        userUpdates.carbTarget = predicted.carbTarget;
        userUpdates.fatTarget = predicted.fatTarget;
      }
    }
    await User.findOneAndUpdate({ firebaseUid: uid }, { $set: userUpdates });

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

async function deleteLog(req, res, next) {
  try {
    const uid = req.user.uid;
    const log = await WeightLog.findOneAndDelete({ _id: req.params.id, userId: uid });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLogs, addLog, deleteLog };
