const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {getUserProfileInfo} = require('../controllers/user.controller')
const {getUserGems} = require('../controllers/user.controller')
const {getUserStats} = require('../controllers/user.controller')


router.use(protect)

router.get('/user-profile', getUserProfileInfo)
router.get('/user-gems', getUserGems)
router.get('/user-stats', getUserStats)

module.exports = router