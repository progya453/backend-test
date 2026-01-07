const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// ❌ OLD (Caused the crash):
// const { verifyToken } = require('../middlewares/auth.middleware');

// ✅ NEW (Matches your auth.middleware.js):
const { protect } = require('../middlewares/auth.middleware');

// GET /api/ai/profile
// Use 'protect' here instead of 'verifyToken'
router.get('/profile', protect, aiController.getCognitiveProfile);

module.exports = router;