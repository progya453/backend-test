const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register); // Calls exports.register
router.post('/login', authController.login);     // Calls exports.login
router.post('/logout', authController.logout);   // Calls exports.logout

module.exports = router;