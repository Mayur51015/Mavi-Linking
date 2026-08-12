 const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiLimiter = require('./middleware/apiLimiter');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const platformRoutes = require('./routes/platformRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const projectRoutes = require('./routes/projectRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const aiRoutes = require('./routes/aiRoutes'); // new AI routes
const publicRoutes = require('./routes/publicRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const educationRoutes = require('./routes/educationRoutes');
const leetcodeRoutes = require('./routes/leetcodeRoutes');
const compatibilityRoutes = require('./routes/compatibilityRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const placementRoutes = require('./routes/placementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const jobRoutes = require('./routes/jobRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const { init } = require('./config/socket'); // socket.io
const http = require('http');


// ─── Initialize Express ─────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy hop (Render, etc.) so req.ip reflects the real
// client IP from X-Forwarded-For instead of the proxy's IP — required for
// express-rate-limit to key limits per actual client, not per proxy.
app.set('trust proxy', 1);

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet()); // Security headers

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL, // e.g. https://mavi-linking-mq7d.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting — 1000 requests per 15 minutes per IP
app.use('/api', apiLimiter);// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files ───────────────────────────────────────────────────────────
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MaVi Linking API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

const careerRoutes = require('./routes/careerRoutes');

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/career', careerRoutes);
app.use('/api', publicRoutes);
app.use('/api', redirectRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    // ─── One-time role migration (developer → user, professor → teacher) ─────
    try {
      const User = require('./models/User');
      const devMigrated = await User.updateMany(
        { role: 'developer' },
        { $set: { role: 'user' } }
      );
      const profMigrated = await User.updateMany(
        { role: 'professor' },
        { $set: { role: 'teacher' } }
      );
      if (devMigrated.modifiedCount > 0 || profMigrated.modifiedCount > 0) {
        console.log(`   ✅ Role migration: ${devMigrated.modifiedCount} developer→user, ${profMigrated.modifiedCount} professor→teacher`);
      }
    } catch (migrationErr) {
      console.warn('   ⚠️  Role migration skipped:', migrationErr.message);
    }

    const server = http.createServer(app);
    init(server); // Initialize socket.io

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 MaVi Linking API Server`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Port:        ${PORT}`);
      console.log(`   Health:      http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
