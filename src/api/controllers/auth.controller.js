const jwt = require('jsonwebtoken');
const UserProfile = require('../../models/UserProfile.model');
const { AppError } = require('../../utils/apiError');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '24h';

const cookieOptions = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  secure: false,
  sameSite: 'lax',
};

const createSendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id, email: user.profile.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  res.cookie('jwt', token, cookieOptions);

  if (user.profile) user.profile.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      user: {
        _id: user._id,
        name: user.profile.name,
        email: user.profile.email,
        stream: user.profile.stream,
        avatar: user.profile.avatar,
        subscription: user.subscription || 'free'
      }
    }
  });
};


// -------- REGISTER ----------
exports.register = async (req, res, next) => {
  try {
    const { name, fullName, email, stream, district, userId, password } = req.body;

    if (!password) throw new AppError('Password is required', 400);
    if (!name && !fullName) throw new AppError('Name is required', 400);

    const existing = await UserProfile.findOne({ "profile.email": email });
    if (existing) throw new AppError('Email already registered', 400);

    const newUser = await UserProfile.create({
      _id: userId || `u_${Date.now()}`,
      profile: {
        name: name || fullName,
        email,
        stream,
        district,
        password
      },
      gamification: { total_xp: 0, streak: 0 },
      subscription: "free"
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};


// -------- LOGIN ----------
exports.login = async (req, res, next) => {
  console.log("Login attempt:", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError('Please provide email and password', 400));

    const user = await UserProfile
      .findOne({ "profile.email": email })
      .select('+profile.password');

    if (!user || !(await user.correctPassword(password, user.profile.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};


// -------- LOGOUT ----------
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};
