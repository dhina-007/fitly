const Exercise = require('../models/Exercise');

exports.getExercises = async (req, res, next) => {
  try {
    const { bodyPart, category, search, equipment } = req.query;
    let query = {};
    if (bodyPart) query.bodyPart = bodyPart;
    if (category) query.category = category;
    if (equipment) query.equipment = equipment;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const exercises = await Exercise.find(query).limit(100);
    res.json({ success: true, count: exercises.length, data: exercises });
  } catch (error) {
    next(error);
  }
};

exports.getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ success: false, message: 'Exercise not found' });
    res.json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};
