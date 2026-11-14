const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  getFeedPosts,
  createFeedPost,
  deleteFeedPost,
  toggleSubscribeFeed,
  toggleLikeFeedPost,
  toggleJoinFeedPost,
  getCommunities,
  createCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
} = require('../controllers/community.controller');

// Feed Routes: Read/Join/Like for all users; Create/Delete strictly Admin ONLY
router.get('/feed', requireAuth, getFeedPosts);
router.post('/feed', requireAuth, requireAdmin, createFeedPost);
router.delete('/feed/:id', requireAuth, requireAdmin, deleteFeedPost);
router.post('/feed/subscribe', requireAuth, toggleSubscribeFeed);
router.post('/feed/:id/like', requireAuth, toggleLikeFeedPost);
router.post('/feed/:id/join', requireAuth, toggleJoinFeedPost);

// Community Routes: Read/Join/Leave for all users; Create/Delete strictly Admin ONLY
router.get('/communities', requireAuth, getCommunities);
router.post('/communities', requireAuth, requireAdmin, createCommunity);
router.delete('/communities/:id', requireAuth, requireAdmin, deleteCommunity);
router.post('/communities/:id/join', requireAuth, joinCommunity);
router.post('/communities/:id/leave', requireAuth, leaveCommunity);

module.exports = router;
