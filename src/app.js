const express = require('express');
const cors = require('cors'); // <--- Import CORS
const cookieParser = require('cookie-parser'); // <--- Import Cookie Parser

const app = express();

// 1. CORS CONFIGURATION (Crucial for 401 Fix)
app.use(cors({
  origin: 'http://localhost:4200', // Must match your Angular URL exactly
  credentials: true,               // Allow Cookies to travel
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
}));

// 2. PARSERS
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser()); // <--- Must be here to read the JWT

// 3. ROUTES
const authRoutes = require('./api/routes/auth.routes');
const gameplayRoutes = require('./api/routes/gameplay.routes'); // <--- Gameplay Routes
const adminRoutes = require('./api/admin/routes/admin.routes');
const analyticsRoutes = require('./api/routes/analytics.routes');
const userProfileRoutes = require('./api/routes/userprofile.routes')
const PlanRoutes = require('./api/routes/plan.routes')


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/gameplay', gameplayRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reports', analyticsRoutes);
app.use('/api/v1/profile', userProfileRoutes)
app.use('/api/v1/plans', PlanRoutes)

// 4. ERROR HANDLER
const { globalErrorHandler } = require('./api/controllers/error.controller');
app.use(globalErrorHandler);

module.exports = app;