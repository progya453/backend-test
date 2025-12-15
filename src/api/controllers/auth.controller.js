const jwt = require('jsonwebtoken');
const UserProfile = require('../../models/UserProfile.model');
const { AppError } = require('../../utils/apiError');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '24h';
// 1. DEFINE COOKIE OPTIONS
const cookieOptions = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Hours
  httpOnly: true,                                      // JS cannot read it (Security)
  
  // 🛑 FORCE FALSE: Browsers DROP cookies if this is true on http://localhost
  secure: false,  
  
  // 🛑 USE LAX: 'Strict' sometimes blocks initial set on localhost
  sameSite: 'lax',
  
  // 🛑 REMOVE DOMAIN: Do not set a domain property for localhost
};
const createSendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id, email: user.profile.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  // 2. SEND COOKIE
  res.cookie('jwt', token, cookieOptions);

  // Sanitize user output
  if (user.profile) user.profile.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    // token, // <--- REMOVED: Do not send token in body anymore
    data: {
      user: {
        id: user._id,
        name: user._id,
        email: user.profile.email,
        stream: user.profile.stream
      }
    }
  });
};



exports.register = async (req, res, next) => {
  
  try {
    const { email, stream, district, userId, password } = req.body;

    if (!password) {
      throw new AppError('Password is required', 400);
    }

    const existing = await UserProfile.findOne({ "profile.email": email });
    if (existing) throw new AppError('Email already registered', 400);

    // ✅ SAVE PASSWORD INSIDE PROFILE
    const newUser = await UserProfile.create({
      _id: userId || `u_${Date.now()}`,
      profile: { 
        email, 
        stream, 
        district,
        password // <--- Nested here
      },
      gamification: { total_xp: 0, streak: 0 }
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
   console.log("Login attempt:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // ✅ SELECT NESTED PASSWORD
    // We use '+profile.password' to explicitly select the hidden field
    const user = await UserProfile.findOne({ "profile.email": email }).select('+profile.password');

    // ✅ CHECK NESTED PASSWORD
    if (!user || !(await user.correctPassword(password, user.profile.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};
