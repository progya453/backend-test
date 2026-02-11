require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const setupSockets = require('./src/sockets/socketServer');
const { redisClient } = require('./src/config/redis'); // Init Redis Connection

const { initRedis, getPubClient, getSubClient } = require("./src/config/redis");

const connectDB = require('./src/config/db'); // Database Connection

// Import Admin Routes
const adminRoutes = require('./src/api/admin/routes/admin.routes');

const PORT = process.env.PORT || 3000;

// 1. Connect to MongoDB
connectDB();

// 2. Register Admin Routes
// (We mount this here so you don't have to edit src/app.js again)
app.use('/api/v1/admin', adminRoutes);

// 3. Create HTTP Server
const server = http.createServer(app);

// 4. Attach Socket.IO (with Redis Adapter)
const io = setupSockets(server);

// 5. Make 'io' accessible in Controllers
// Allows calling req.app.get('io').emit(...) in your API
app.set('io', io);

// 6. Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (PID: ${process.pid})`);
});