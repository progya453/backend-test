const express = require('express');
const router = express.Router();
const gameplayController = require('../controllers/gameplay.controller');
const { protect } = require('../middlewares/auth.middleware');

// 🔒 All Gameplay routes require the user to be logged in
router.use(protect);

// --- 1. DASHBOARD ---
// Fetches the list of subjects (e.g., Physics, Chemistry) for the main dashboard
router.get('/subjects', gameplayController.getSubjects);

// --- 2. PATH VIEW ---
// Fetches chapters for a specific subject (ordered for the Zig-Zag map)
// Usage: /api/v1/gameplay/chapters?subject=Physics
router.get('/chapters', gameplayController.getChapters);

// --- 3. GAME ARENA ---
// Fetches questions for a specific chapter
// Usage: /api/v1/gameplay/questions?chapterId=...

router.get('/insights', gameplayController.getInsights);
// --- 4. PROGRESS & SCORING ---
// Submits an answer to calculate XP, Streak, and Analytics
router.post('/submit', gameplayController.submitAnswer);

router.get('/topics', gameplayController.getTopics); // New Route
router.get('/questions', gameplayController.getQuestions);

router.post('/update-streak', gameplayController.triggerStreakUpdate)


router.get('/daily-plans', gameplayController.getPlans)


router.get('/formulas', gameplayController.getFormulas);


module.exports = router;