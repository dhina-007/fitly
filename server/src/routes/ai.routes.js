const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, aiController.chatWithRia);
router.get('/history', protect, aiController.getConversationHistory);
router.delete('/history', protect, aiController.clearConversationHistory);
router.post('/analyze-meal', protect, aiController.analyzeMealText);

module.exports = router;
