const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('../config/redis');
const jwt = require('jsonwebtoken');
const gameHandler = require('./handlers/game.handler');

// Helper to parse cookies from the handshake headers
const parseCookie = (str) => {
  if (!str) return {};
  return str.split(';').reduce((acc, item) => {
    const [key, val] = item.trim().split('=');
    acc[key] = val;
    return acc;
  }, {});
};

const setupSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:4200',
      methods: ["GET", "POST"],
      credentials: true // <--- ALLOW COOKIES
    },
    transports: ['websocket', 'polling']
  });

  io.adapter(createAdapter(pubClient, subClient));

  // --- UPDATED AUTH MIDDLEWARE ---
  io.use((socket, next) => {
    try {
      // 1. Parse Cookie String from Headers
      const cookieHeader = socket.handshake.headers.cookie;
      const cookies = parseCookie(cookieHeader);
      const token = cookies.jwt; // Match the name used in auth.controller.js

      if (!token) return next(new Error("Authentication error: No Token"));
      
      // 2. Verify Token
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error("Authentication error: Invalid Token"));
        socket.user = decoded;
        next();
      });
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });
  // -------------------------------

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.id}`);
    socket.join(`user:${socket.user.id}`);
    gameHandler(io, socket);
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};

module.exports = setupSockets;