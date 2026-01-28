const { AppError } = require('../../utils/apiError');

exports.restrictToAdmin = (req, res, next) => {
  // 1. Check if user exists (set by auth.middleware)
  if (!req.user) {
    return next(new AppError('You must be logged in.', 401));
  }

  // 2. Check Role (We added this field in Step 1)
  // Note: We need to ensure we selected '+role' in the auth middleware query if it's hidden
  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admins only.', 403));
  }

  next();
};