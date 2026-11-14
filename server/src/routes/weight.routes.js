const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getLogs, addLog, deleteLog } = require('../controllers/weight.controller');

router.get('/', requireAuth, getLogs);
router.post('/', requireAuth, addLog);
router.delete('/:id', requireAuth, deleteLog);

module.exports = router;
