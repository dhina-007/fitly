const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getLogs, addLog } = require('../controllers/sleep.controller');

router.get('/', requireAuth, getLogs);
router.post('/', requireAuth, addLog);

module.exports = router;
