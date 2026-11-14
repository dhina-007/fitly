const express = require('express');
const router = express.Router();
const fastingController = require('../controllers/fasting.controller');
const { protect } = require('../middleware/auth');

router.get('/status', protect, fastingController.getFastingStatus);
router.post('/start', protect, fastingController.startFast);
router.post('/end', protect, fastingController.endFast);

module.exports = router;
