const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/auth.middleware');
const { restrictToPlan } = require('../middlewares/subscription.middleware')


// All analytics routes are protected
router.use(protect);

router.get('/board-trend', analyticsController.getBoardTrend);
router.get('/topic-diagnostics', analyticsController.getTopicDiagnostics);
router.get('/cognitive-skills', analyticsController.getCognitiveSkills);
// router.get('/root-cause', restrictToPlan, analyticsController.getRootCause);
router.get('/root-cause', restrictToPlan('free', 'pro'), analyticsController.getRootCause);
router.get('/retention-health', analyticsController.getRetentionHealth);
router.get('/chapter-analysis', restrictToPlan('free', 'pro'), analyticsController.getChapterAnalysis);

module.exports = router;