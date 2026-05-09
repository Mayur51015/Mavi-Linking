 const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env'),
});


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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
const compatibilityRoutes = require('./routes/compatibilityRoutes');
const { init } = require('./config/socket'); // socket.io
const http = require('http');


// ─── Initialize Express ─────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet()); // Security headers

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
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
    const server = http.createServer(app);
    init(server); // Initialize socket.io

    server.listen(PORT, () => {
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
