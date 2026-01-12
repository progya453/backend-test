const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const UserProfile = require('../../models/UserProfile.model');
const { AppError } = require('../../utils/apiError');

exports.protect = async (req, res, next) => {
  let token;

  console.log("recieved")
  console.log(req.url)
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
   
  }

  // 2. Fallback to Header (Optional, for mobile apps later)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }
  // 2. Verify Token
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET || 'dev-secret');

    // 3. Check if user still exists

    const currentUser = await UserProfile.findById(decoded.id).select('+profile.role');

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4. Grant Access
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('Invalid token. Please log in again!', 401));
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user role is in the allowed roles array
    if (!roles.includes(req.user.profile.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};