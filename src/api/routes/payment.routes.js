const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');
const webhookController = require('../controllers/webhook.controller');

router.use(protect); // Ensure user is logged in

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
// 2. Webhook Route (PUBLIC - No Auth Middleware)
router.post('/webhook', webhookController.handleRazorpayWebhook);

module.exports = router;