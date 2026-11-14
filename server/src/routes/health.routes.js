const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const { optionalAuth } = require('../middleware/auth');

// 100% Public system health & diagnostics
router.get('/', healthController.getSystemHealth);
router.get('/ping', healthController.getPing);
router.get('/live', healthController.getPing);
router.get('/ready', healthController.getSystemHealth);
router.get('/status', healthController.getSystemHealth);

// Public health calculator (BMI, BMR, TDEE, macros, water intake)
router.get('/calculate', healthController.calculateHealthMetrics);
router.post('/calculate', healthController.calculateHealthMetrics);

// Public health overview (personalized when token provided, public demo otherwise)
router.get('/overview', optionalAuth, healthController.getUserHealthOverview);

module.exports = router;
