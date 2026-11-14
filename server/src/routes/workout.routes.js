const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getWorkouts,
  getWorkoutById,
  getRecommendedWorkout,
  logWorkout,
  getWorkoutLogs,
  getExerciseSubstitutions,
} = require('../controllers/workout.controller');

router.get('/', requireAuth, getWorkouts);
router.get('/recommendation', requireAuth, getRecommendedWorkout);
router.get('/logs', requireAuth, getWorkoutLogs);
router.get('/substitutions', requireAuth, getExerciseSubstitutions);
router.get('/:id', requireAuth, getWorkoutById);
router.post('/logs', requireAuth, logWorkout);

module.exports = router;
