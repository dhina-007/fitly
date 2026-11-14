const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getHabits, createHabit, updateHabit, toggleHabit, deleteHabit, getHabitLogs } = require('../controllers/habit.controller');

router.get('/', requireAuth, getHabits);
router.post('/', requireAuth, createHabit);
router.put('/:habitId', requireAuth, updateHabit);
router.post('/:habitId/toggle', requireAuth, toggleHabit);
router.delete('/:habitId', requireAuth, deleteHabit);
router.get('/logs', requireAuth, getHabitLogs);

module.exports = router;
