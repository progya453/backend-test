const crypto = require('crypto');
const UserProfile = require('../../models/UserProfile.model');
const Plan = require('../../models/Plan.Model');

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    // 1. Get the signature from the header
    const razorpaySignature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!razorpaySignature) {
        return res.status(400).json({ status: 'failure', message: 'Missing signature' });
    }

    // 2. Verify the signature
    // Razorpay sends the body as JSON. We hash it to check authenticity.
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      console.error('⚠️ Invalid Webhook Signature');
      // Return 400 so Razorpay knows something is wrong, but don't leak info
      return res.status(400).json({ status: 'failure', message: 'Invalid signature' });
    }

    // 3. Process the Event
    const event = req.body.event;
    console.log(`🔔 Webhook received: ${event}`);

    // We only care about 'order.paid' (when money actually hits Razorpay)
    if (event === 'order.paid') {
      const payload = req.body.payload;
      const order = payload.order.entity;
      const payment = payload.payment.entity;

      // 4. Extract Data from Notes (Populated during Order Creation)
      // These were set in the "createOrder" step in payment.controller.js
      const { user_id, plan_id } = order.notes;

      if (!user_id || !plan_id) {
        console.error('❌ Missing user_id or plan_id in webhook notes');
        return res.status(200).json({ status: 'ok' }); // Ack to stop retries
      }

      console.log(`✅ Processing Upgrade for User: ${user_id} -> Plan: ${plan_id}`);

      // 5. Update Database (Idempotent: safe to run multiple times)
      await activateSubscription(user_id, plan_id, payment.id);
    }

    // 6. Always return 200 OK to Razorpay
    // If you return error, Razorpay will keep retrying sending this webhook.
    res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('💥 Webhook Error:', err);
    // Still return 200 to prevent Razorpay from spamming your server with retries
    res.status(200).json({ status: 'error_handled' });
  }
};

// --- Helper Function to Update User ---
async function activateSubscription(userId, planId, paymentId) {
  // Fetch plan details to calculate end date
  const plan = await Plan.findById(planId);
  if (!plan) throw new Error(`Plan not found: ${planId}`);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + plan.duration_days);

  // Update User Profile
  // We use findByIdAndUpdate to atomic set the values
  await UserProfile.findByIdAndUpdate(userId, {
    $set: {
      'subscription.plan': 'pro', // You might want to use plan.slug here
      'subscription.status': 'active',
      'subscription.billing_cycle': 'one_time', // or based on plan
      'subscription.start_date': startDate,
      'subscription.end_date': endDate,
      'subscription.provider_subscription_id': paymentId,
      'wallet.last_transaction_date': startDate
    },
    // Optional: Add bonus gems
    $inc: { 'wallet.purchased_gems': 100 } 
  });
  
  console.log(`🎉 Subscription activated for ${userId}`);
}