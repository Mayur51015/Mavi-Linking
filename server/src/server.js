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
const ownerRoutes = require('./routes/ownerRoutes');
const redirectRoutes = require('./routes/redirectRoutes');

// Initialize background workers
require('./workers/worker');

const publicRoutes = require('./routes/publicRoutes');
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
const superAdminRoutes = require('./routes/superAdminRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const billingRoutes = require('./routes/billingRoutes');
const careerRoutes = require('./routes/careerRoutes');
const departmentAdminRoutes = require('./routes/departmentAdminRoutes');
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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      connectSrc: [
        "'self'", 
        "https://api.openai.com", 
        "https://api.groq.com", 
        "https://api.x.ai", 
        "https://generativelanguage.googleapis.com"
      ],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
})); // Security headers

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://mavi-linking-mq7d.vercel.app',
];

const envAllowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow direct server-to-server, health checks, postman, webhooks
  const cleanOrigin = origin.replace(/\/+$/, '');
  if (allowedOrigins.some((o) => o.replace(/\/+$/, '') === cleanOrigin)) return true;
  // Allow all vercel.app and onrender.com preview/production deployments
  if (/\.vercel\.app$/i.test(cleanOrigin) || /\.onrender\.com$/i.test(cleanOrigin)) return true;
  return false;
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting — 1000 requests per 15 minutes per IP
app.use('/api', apiLimiter);// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({
  limit: '5mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
app.use('/api/owner', ownerRoutes);
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
app.use('/api/department-admin', departmentAdminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/billing', billingRoutes);

// Direct Razorpay Standard Checkout API Aliases
const { createOrderDirect, verifyPaymentDirect } = require('./controllers/billingController');
app.post('/api/create-order', createOrderDirect);
app.post('/api/verify-payment', verifyPaymentDirect);
app.use('/api/career', careerRoutes);
app.use('/api/student', careerRoutes);
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

    // Validate payment provider credentials in production mode (fail fast with safe error)
    if (process.env.NODE_ENV === 'production') {
      const { getPaymentProvider } = require('./services/paymentProvider');
      getPaymentProvider().validateConfig();
    }

    // ─── One-time role migration & admin bootstrap ───────────────────────────
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

      // Dedicated Super Admin accounts
      const adminEmails = [
        'mayurek51015@gmail.com',
        process.env.SUPER_ADMIN_EMAIL,
      ].filter(Boolean);

      const adminResult = await User.updateMany(
        { email: { $in: adminEmails.map((e) => e.toLowerCase()) } },
        {
          $set: { role: 'super_admin' },
          $addToSet: { roles: { $each: ['super_admin', 'admin', 'user'] } },
        }
      );
      if (adminResult.modifiedCount > 0) {
        console.log(`   ✅ Promoted ${adminResult.modifiedCount} account(s) to Super Admin role.`);
      }

      // Seed Dedicated Platform Owner / Master Super Admin Account if missing
      const ownerEmail = (process.env.OWNER_EMAIL || 'owner@mavilinking.com').toLowerCase();
      const ownerPassword = process.env.OWNER_PASSWORD || 'MaviOwner@2026!';
      const ownerAdminId = 'MAVI-OWNER-001';

      let ownerUser = await User.findOne({ $or: [{ email: ownerEmail }, { maviId: 'MAVI-OWNER01' }] });
      if (!ownerUser) {
        ownerUser = await User.create({
          name: 'Platform Owner',
          email: ownerEmail,
          password: ownerPassword,
          role: 'super_admin',
          roles: ['super_admin', 'admin', 'user'],
          adminId: ownerAdminId,
          adminLoginId: ownerAdminId,
          designation: 'Platform Owner & Founder',
          maviId: 'MAVI-OWNER01',
          status: 'active',
          emailVerified: true,
        });
        console.log(`   👑 Dedicated Platform Owner Account Created: ${ownerEmail} (Admin ID: ${ownerAdminId})`);
      } else {
        ownerUser.role = 'super_admin';
        if (!ownerUser.roles.includes('super_admin')) ownerUser.roles.push('super_admin');
        if (!ownerUser.roles.includes('admin')) ownerUser.roles.push('admin');
        ownerUser.adminId = ownerAdminId;
        ownerUser.adminLoginId = ownerAdminId;
        ownerUser.designation = 'Platform Owner & Founder';
        await ownerUser.save();
      }

      // MAVI ID backfill migration for existing accounts
      const usersNeedingMaviId = await User.find({
        $or: [{ maviId: { $exists: false } }, { maviId: null }, { maviId: '' }],
      });
      if (usersNeedingMaviId.length > 0) {
        let backfillCount = 0;
        for (const userDoc of usersNeedingMaviId) {
          // Pre-save hook will auto-generate unique MAVI ID if missing
          await userDoc.save();
          backfillCount++;
        }
        console.log(`   ✅ MAVI ID Migration: Backfilled MAVI IDs for ${backfillCount} existing user account(s).`);
      }

      // Google ID migration: Unset googleId: null fields that break sparse indexing
      const googleIdCleanup = await User.updateMany(
        { googleId: null },
        { $unset: { googleId: 1 } }
      );
      if (googleIdCleanup.modifiedCount > 0) {
        console.log(`   ✅ Google ID Migration: Unset googleId: null for ${googleIdCleanup.modifiedCount} account(s).`);
      }
      try {
        await User.collection.dropIndex('googleId_1');
        console.log('   ✅ Dropped legacy googleId_1 index to rebuild as sparse index.');
      } catch (_) {}

      // Auto-seed default customer institutions if database is empty
      const Institution = require('./models/Institution');
      const instCount = await Institution.countDocuments();
      if (instCount === 0) {
        await Institution.create([
          {
            name: 'Zeal College of Engineering and Research',
            tenantId: 'INST-ZEAL-001',
            code: 'ZEAL',
            domain: 'zeal.edu.in',
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            status: 'ACTIVE',
            plan: 'ENTERPRISE',
            contactEmail: 'admin@zeal.edu.in',
          },
          {
            name: 'College of Engineering Pune (COEP Tech)',
            tenantId: 'INST-COEP-001',
            code: 'COEP',
            domain: 'coep.org.in',
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            status: 'ACTIVE',
            plan: 'ENTERPRISE',
            contactEmail: 'admin@coep.org.in',
          },
          {
            name: 'MIT World Peace University',
            tenantId: 'INST-MIT-001',
            code: 'MITWPU',
            domain: 'mitwpu.edu.in',
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            status: 'ACTIVE',
            plan: 'PRO',
            contactEmail: 'admin@mitwpu.edu.in',
          },
        ]);
        console.log('   🏫 Default customer institutions auto-seeded (Zeal, COEP, MIT-WPU).');
      }

      if (devMigrated.modifiedCount > 0 || profMigrated.modifiedCount > 0) {
        console.log(`   ✅ Role migration: ${devMigrated.modifiedCount} developer→user, ${profMigrated.modifiedCount} professor→teacher`);
      }
    } catch (migrationErr) {
      console.warn('   ⚠️  Role/MAVI ID/Google ID migration skipped:', migrationErr.message);
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
