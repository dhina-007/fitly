const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getLog, addWater, deleteEntry } = require('../controllers/water.controller');

router.get('/:date', requireAuth, getLog);
router.post('/', requireAuth, addWater);
router.delete('/:date/entries/:entryId', requireAuth, deleteEntry);

module.exports = router;
