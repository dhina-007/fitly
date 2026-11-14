const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const { requireAuth } = require('../middleware/auth');

// Public system health & diagnostics
router.get('/', healthController.getSystemHealth);
router.get('/ping', healthController.getPing);

// Public health calculator (BMI, BMR, TDEE, macros, water intake)
router.get('/calculate', healthController.calculateHealthMetrics);
router.post('/calculate', healthController.calculateHealthMetrics);

// Authenticated user's daily holistic health overview & health score
router.get('/overview', requireAuth, healthController.getUserHealthOverview);

module.exports = router;
