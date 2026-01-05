const Razorpay = require('razorpay');
const crypto = require('crypto');
const Plan = require('../../models/Plan.Model');
const UserProfile = require('../../models/UserProfile.model');
const AppError = require('../../utils/apiError'); // Assuming you have an error handler

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 1. Create Order
exports.createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    
    // Fetch plan from DB to ensure price integrity
    const plan = await Plan.findById(planId);
    if (!plan) return next(new AppError('Plan not found', 404));

    const options = {
      amount: plan.price * 100, // Razorpay works in subunits (paise)
      currency: plan.currency || "INR",
      receipt: `receipt_${Date.now()}_${req.user.id}`,
      notes: {
        plan_id: plan._id.toString(),
        user_id: req.user.id
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      status: 'success',
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID, // Send public key to frontend
        name: plan.name,
        description: plan.description
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Verify Payment & Update Subscription
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    // 1. Generate Signature locally
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // 2. Compare Signatures
    if (expectedSignature !== razorpay_signature) {
      return next(new AppError('Payment verification failed. Invalid signature.', 400));
    }

    // 3. Payment is Valid -> Update User Subscription
    const plan = await Plan.findById(planId);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);

    await UserProfile.findByIdAndUpdate(req.user.id, {
      $set: {
        'subscription.plan': 'pro', // or dynamic based on plan.slug
        'subscription.status': 'active',
        'subscription.start_date': startDate,
        'subscription.end_date': endDate,
        'subscription.provider_subscription_id': razorpay_payment_id,
        'wallet.last_transaction_date': startDate
      },
      $inc: { 'wallet.purchased_gems': 100 } // Bonus gems if applicable
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment verified and subscription updated'
    });

  } catch (error) {
    next(error);
  }
};