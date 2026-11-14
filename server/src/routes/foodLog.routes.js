const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getDayLog, addFoodEntry, deleteFoodEntry } = require('../controllers/foodLog.controller');

router.get('/:date', requireAuth, getDayLog);
router.post('/', requireAuth, addFoodEntry);
router.delete('/:logId/entries/:entryId', requireAuth, deleteFoodEntry);

module.exports = router;
