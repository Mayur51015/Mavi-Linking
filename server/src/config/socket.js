const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createOriginChecker } = require('./allowedOrigins');

let io;

module.exports = {
  init: (httpServer) => {
    // Shared with the Express CORS middleware in server.js. This file used to
    // keep its own list, missing 127.0.0.1:5173 and the deployed Vercel origin,
    // so in production the handshake was rejected while every REST call from
    // the same page succeeded.
    io = new Server(httpServer, {
      cors: {
        origin: createOriginChecker(),
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
  }
};
