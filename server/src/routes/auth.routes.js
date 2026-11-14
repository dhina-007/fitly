const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  deleteAccount,
  register,
  login,
  exchangeToken,
} = require('../controllers/auth.controller');

// Public JWT Auth routes
router.post('/register', register);
router.post('/login', login);

// Authenticated session & profile routes
router.post('/token', requireAuth, exchangeToken);
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.delete('/account', requireAuth, deleteAccount);

module.exports = router;
