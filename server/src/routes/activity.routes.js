const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getLog, upsertLog } = require('../controllers/activity.controller');

router.get('/:date', requireAuth, getLog);
router.post('/', requireAuth, upsertLog);

module.exports = router;
