const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getProfile, updateProfile, deleteAccount } = require('../controllers/auth.controller');

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.delete('/account', requireAuth, deleteAccount);

module.exports = router;
