const { Server } = require('socket.io');

let io;

module.exports = {
  init: (httpServer) => {
    const allowedOrigins = [
      'http://localhost:5173',
      process.env.CLIENT_URL,
    ].filter(Boolean);

    io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('User connected to real-time feed:', socket.id);

      socket.on('joinRoom', (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room ${userId}`);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
