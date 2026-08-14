const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (httpServer) => {
    const allowedOrigins = [
      'http://localhost:5173',
      process.env.CLIENT_URL,
    ].filter(Boolean);

    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const cleanOrigins = allowedOrigins.map(o => o.replace(/\/+$/, ''));
          const cleanOrigin = origin.replace(/\/+$/, '');
          if (cleanOrigins.includes(cleanOrigin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true
      }
    });

    // JWT Authentication middleware for Socket.IO connections
    io.use((socket, next) => {
      let token = socket.handshake.auth?.token;
      
      // Fallback 1: Authorization Header
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      // Fallback 2: Query String
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log('User connected to real-time feed:', socket.id);

      socket.on('joinRoom', (userId) => {
        if (socket.user && socket.user.id === userId) {
          socket.join(userId);
          console.log(`Socket ${socket.id} joined room ${userId}`);
        } else {
          console.warn(`Unauthorized room join attempt by socket ${socket.id} to room ${userId}`);
        }
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
  },
  /**
   * Close every connected socket and stop accepting new ones.
   *
   * Called from the shutdown path so clients get a clean disconnect on deploy
   * instead of an abrupt transport close — which, with the client configured
   * to reconnect, is the difference between a staggered reconnect and every
   * browser retrying at once against the replacement instance.
   *
   * Resolves when there is no server, so the caller doesn't have to check.
   */
  close: () =>
    new Promise((resolve) => {
      if (!io) return resolve();

      return io.close(() => {
        io = undefined;
        resolve();
      });
    }),
};
