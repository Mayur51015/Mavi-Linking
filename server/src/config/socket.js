const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (httpServer) => {
    const defaultAllowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://mavi-linking-mq7d.vercel.app',
      'https://mavi-linking-mq7d-hcv3uvrk7-mayur-khandares-projects.vercel.app',
    ];

    const envAllowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGINS,
    ]
      .filter(Boolean)
      .flatMap((val) => val.split(','))
      .map((o) => o.trim())
      .filter(Boolean);

    const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

    const isOriginAllowed = (origin) => {
      if (!origin) return true;
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.some((o) => o.replace(/\/+$/, '') === cleanOrigin)) return true;
      if (/^https:\/\/mavi-linking(-[a-z0-9-]+)?-mayur-khandares-projects\.vercel\.app$/i.test(cleanOrigin)) return true;
      if (/^https:\/\/mavi-linking(-[a-z0-9-]+)?\.vercel\.app$/i.test(cleanOrigin)) return true;
      return false;
    };

    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (isOriginAllowed(origin)) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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
