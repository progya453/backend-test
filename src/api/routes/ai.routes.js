



// const express = require('express');
// const router = express.Router();
// const aiController = require('../controllers/ai.controller');
// const { protect } = require('../middlewares/auth.middleware');

// // GET /api/v1/ai/profile (Persona)
// router.get('/profile', protect, aiController.getCognitiveProfile);

// // GET /api/v1/ai/mastery (New Mastery Score)
// router.get('/mastery', protect, aiController.getStudentMastery);

// module.exports = router;




const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/profile', protect, aiController.getCognitiveProfile);
router.get('/mastery', protect, aiController.getStudentMastery);
router.get('/exam-prediction', protect, aiController.getExamPrediction); // 👈 NEW

module.exports = router;