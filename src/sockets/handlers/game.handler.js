const cacheService = require('../../services/cache.service');

module.exports = (io, socket) => {
  const userId = socket.user.id;

  // Event: User starts a chapter
  socket.on('join_chapter', async ({ chapterId }) => {
    socket.join(`chapter:${chapterId}`);
    // Notify others (e.g., "5 people are playing Physics Ch1 right now")
    const count = await cacheService.increment(`active:chapter:${chapterId}`);
    io.to(`chapter:${chapterId}`).emit('active_users', { count });
  });

  // Event: User leaves a chapter
  socket.on('leave_chapter', async ({ chapterId }) => {
    socket.leave(`chapter:${chapterId}`);
    const count = await cacheService.increment(`active:chapter:${chapterId}`, -1);
    io.to(`chapter:${chapterId}`).emit('active_users', { count });
  });

  // Event: Live XP Update (Visual only, secured via API)
  socket.on('xp_earned', ({ amount }) => {
    // Send a "Toast" notification back to the user immediately
    io.to(`user:${userId}`).emit('notification', {
      type: 'XP_GAIN',
      message: `+${amount} XP! Keep it up!`,
      totalXp: '...' // Logic to fetch new total
    });
  });
};