const mongoose = require('mongoose');
const User = require('../models/User');

async function resolveUserDoc(reqUser, autoCreate = false) {
  let user = null;
  if (reqUser._id && mongoose.Types.ObjectId.isValid(reqUser._id)) {
    user = await User.findById(reqUser._id);
  }
  if (!user && reqUser.uid) {
    user = await User.findOne({ firebaseUid: reqUser.uid });
  }
  if (!user && autoCreate && reqUser.uid) {
    user = await User.create({
      firebaseUid: reqUser.uid,
      email: reqUser.email ? reqUser.email.toLowerCase() : `${reqUser.uid}@fitly.app`,
      name: reqUser.name || 'Fitly User',
      isAdmin: Boolean(reqUser.isAdmin),
    });
  }
  return user;
}

function getFastingStage(hours) {
  if (hours < 4) return 'Anabolic Phase (0-4h)';
  if (hours < 12) return 'Catabolic Phase (4-12h)';
  if (hours < 18) return 'Ketosis Fat-Burn Zone (12-18h)';
  return 'Autophagy & Cell Renewal (18h+)';
}

exports.getFastingStatus = async (req, res, next) => {
  try {
    const user = await resolveUserDoc(req.user, false);
    const fasting = user?.fasting || {};
    
    let elapsedSeconds = 0;
    if (fasting.isFasting && fasting.startTime) {
      elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(fasting.startTime).getTime()) / 1000));
    }

    const elapsedHours = elapsedSeconds / 3600;

    res.json({
      success: true,
      data: {
        isFasting: Boolean(fasting.isFasting),
        protocol: fasting.protocol || '16:8',
        startTime: fasting.startTime,
        targetHours: fasting.targetHours || 16,
        elapsedSeconds,
        stage: getFastingStage(elapsedHours),
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.startFast = async (req, res, next) => {
  try {
    const { targetHours = 16, protocol = '16:8' } = req.body;
    const user = await resolveUserDoc(req.user, true);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.fasting = {
      isFasting: true,
      startTime: new Date(),
      targetHours: Number(targetHours) || 16,
      protocol: protocol || `${targetHours}:${24 - targetHours}`,
    };
    await user.save();

    res.json({
      success: true,
      data: {
        isFasting: true,
        protocol: user.fasting.protocol,
        startTime: user.fasting.startTime,
        targetHours: user.fasting.targetHours,
        elapsedSeconds: 0,
        stage: getFastingStage(0),
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.endFast = async (req, res, next) => {
  try {
    const user = await resolveUserDoc(req.user, true);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const fasting = user.fasting || {};
    let finalElapsedSeconds = 0;
    if (fasting.startTime) {
      finalElapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(fasting.startTime).getTime()) / 1000));
    }

    user.fasting = {
      isFasting: false,
      startTime: null,
      targetHours: fasting.targetHours || 16,
      protocol: fasting.protocol || '16:8',
    };
    await user.save();

    res.json({
      success: true,
      data: {
        isFasting: false,
        totalDurationSeconds: finalElapsedSeconds,
        message: 'Fast ended successfully',
      }
    });
  } catch (error) {
    next(error);
  }
};
