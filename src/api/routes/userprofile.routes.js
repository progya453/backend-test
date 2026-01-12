const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {getUserProfileInfo, submitFeedback} = require('../controllers/user.controller')
const {getUserGems} = require('../controllers/user.controller')
const {getUserStats} = require('../controllers/user.controller')
const {updateProfile} = require('../controllers/user.controller')
const {storage} = require('../../config/cloudinary')
const multer = require('multer')

const upload = multer({ storage: storage });

router.use(protect)

router.get('/user-profile', getUserProfileInfo)
router.get('/user-gems', getUserGems)
router.get('/user-stats', getUserStats)
router.patch('/profile-update', upload.single('image'), updateProfile);
router.post('/feedback', submitFeedback);

module.exports = router