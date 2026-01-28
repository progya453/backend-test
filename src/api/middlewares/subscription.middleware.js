const UserProfile = require('../../models/UserProfile.model'); // Adjust path to your model
const AppError = require('../../utils/apiError'); // Your error handler (optional)

exports.restrictToPlan = (...allowedPlans) => {
  return async (req, res, next) => {
    try {
      // 1. Get the user (Assume 'protect' middleware already put user.id in req.user)
      const user = await UserProfile.findById(req.user.id).select('subscription');

      if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found' });
      }

      // 2. Check: Is the plan in the allowed list?
      const userPlan = user.subscription.plan; // 'free', 'pro', etc.
      if (!allowedPlans.includes(userPlan)) {
        return res.status(403).json({ 
          status: 'fail', 
          message: 'You do not have permission to perform this action. Please upgrade to Pro.' 
        });
      }

      // 3. Check: Is the subscription actually active? (Status check)
      if (user.subscription.status !== 'active') {
        return res.status(403).json({ 
          status: 'fail', 
          message: 'Your subscription is inactive or past due. Please renew.' 
        });
      }

      // 4. Check: Has it expired? (Date check)
      // Note: Always allow a small buffer or handle 'lifetime' plans if you have them
      if (user.subscription.end_date && user.subscription.end_date < Date.now()) {
        return res.status(403).json({ 
          status: 'fail', 
          message: 'Your subscription has expired.' 
        });
      }

      // 5. Access Granted
      next();
      
    } catch (err) {
      // Pass to global error handler or send 500
      res.status(500).json({ status: 'error', message: err.message });
    }
  };
};