const express = require('express');
const router = express.Router();


const {storage} = require('../../../config/cloudinary')
const multer = require('multer')

const upload = multer({ storage: storage });

// Import Controllers (Relative Paths)
const authController = require('../../controllers/auth.controller');       // <--- Shared Auth
const cmsController = require('../controllers/cms.controller');            // <--- Admin CMS
const ingestionController = require('../controllers/ingestion.controller');// <--- Admin Ingestion

// Import Middlewares
const { protect } = require('../../middlewares/auth.middleware');          // <--- Shared Protect
const { restrictToAdmin } = require('../../middlewares/admin.middleware'); // <--- Admin Check

// 1. Admin Login 
// (Uses the same logic as students but checks role later, or you can build a specific admin login)
router.post('/login', authController.login);

// --- PROTECTED ZONE (Admins Only) ---
// router.use(protect);         // Must have valid Token/Cookie
// router.use(restrictToAdmin); // Must have role: 'admin'

// 2. Stream Management
router.route('/streams')
  .get(cmsController.getAllStreams)
  .post(cmsController.createStream);

// 3. Subject Management
router.route('/subjects')
  .post(upload.single('image'), cmsController.createSubject);

router.get('/subjects/:streamId', cmsController.getSubjectsByStream);

// 4. Content Ingestion (The Magic Button)
router.post('/chapters/publish', ingestionController.publishChapter);


router.patch('/subjects/:id/image', upload.single('image'), cmsController.updateSubjectImage);
router.patch('/chapters/:id/banner', upload.single('banner'), cmsController.updateChapterBanner);
router.patch('/topic/:id/image', upload.single('image'), cmsController.updateTopicBanner);



module.exports = router;