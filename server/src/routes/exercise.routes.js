const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exercise.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, exerciseController.getExercises);
router.get('/:id', protect, exerciseController.getExerciseById);

module.exports = router;
