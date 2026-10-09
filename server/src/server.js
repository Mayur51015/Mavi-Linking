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
const activityEventRoutes = require('./routes/activityEventRoutes');const compatibilityRoutes = require('./routes/compatibilityRoutes');
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
const careerMatchRoutes = require('./routes/careerMatchRoutes');
const careerLabRoutes = require('./routes/careerLabRoutes');
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
  crossOriginResourcePolicy: { policy: 'cross-origin' },
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

// ─── Production CORS Configuration ──────────────────────────────────────────
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
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
  if (!origin) return true; // Allow direct server-to-server, health checks, postman, webhooks
  const cleanOrigin = origin.replace(/\/+$/, '');
  if (allowedOrigins.some((o) => o.replace(/\/+$/, '') === cleanOrigin)) return true;
  // Support explicit project-specific Vercel preview URLs
  if (/^https:\/\/(mavi-linking|edutalentx)(-[a-z0-9-]+)?-mayur-khandares-projects\.vercel\.app$/i.test(cleanOrigin)) return true;
  if (/^https:\/\/(mavi-linking|edutalentx)(-[a-z0-9-]+)?\.vercel\.app$/i.test(cleanOrigin)) return true;
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Authorization'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

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
    message: 'EduTalentX API is running',
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
app.use('/api/activity-events', activityEventRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/applications', placementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/opportunities', jobRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/department-admin', departmentAdminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/career-match', careerMatchRoutes);
app.use('/api/career-lab', careerLabRoutes);

// Direct Razorpay Standard Checkout API Aliases
const { createOrderDirect, verifyPaymentDirect } = require('./controllers/billingController');
app.post('/api/create-order', createOrderDirect);
app.post('/api/verify-payment', verifyPaymentDirect);
app.use('/api/career', careerRoutes);
app.use('/api/student', careerRoutes);
app.use('/api', publicRoutes);
app.use('/api', redirectRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
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
      const ownerEmail = (process.env.OWNER_EMAIL || 'mayur1718khandare@gmail.com').toLowerCase();
      const ownerPassword = process.env.OWNER_PASSWORD || 'Mayur@12';
      const ownerAdminId = 'ETX-OWNER-001';

      let ownerUser = await User.findOne({ email: ownerEmail });
      if (!ownerUser) {
        ownerUser = await User.create({
          name: 'Platform Owner',
          email: ownerEmail,
          password: ownerPassword,
          role: 'super_admin',
          roles: ['super_admin', 'admin', 'user', 'owner', 'platform_owner'],
          adminId: ownerAdminId,
          adminLoginId: ownerAdminId,
          designation: 'Platform Owner & Founder',
          etxId: 'ETX-OWNER01',
          status: 'active',
          accountStatus: 'ACTIVE',
          emailVerified: true,
        });
        console.log(`   👑 Dedicated Platform Owner Account Created: ${ownerEmail} (Admin ID: ${ownerAdminId})`);
      } else {
        ownerUser.role = 'super_admin';
        if (!ownerUser.roles.includes('super_admin')) ownerUser.roles.push('super_admin');
        if (!ownerUser.roles.includes('admin')) ownerUser.roles.push('admin');
        if (!ownerUser.roles.includes('owner')) ownerUser.roles.push('owner');
        if (!ownerUser.roles.includes('platform_owner')) ownerUser.roles.push('platform_owner');
        ownerUser.adminId = ownerAdminId;
        ownerUser.adminLoginId = ownerAdminId;
        ownerUser.designation = 'Platform Owner & Founder';
        ownerUser.accountStatus = 'ACTIVE';
        ownerUser.emailVerified = true;
        await ownerUser.save();
      }

      // Seed Dedicated Platform Super Admin Account if missing
      const superAdminEmail = (process.env.SEED_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'admin@edutalentx.com').toLowerCase().trim();
      const superAdminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'AdminPass@123';
      let superAdminUser = await User.findOne({ email: superAdminEmail });
      if (!superAdminUser) {
        await User.create({
          name: 'Platform Super Admin',
          email: superAdminEmail,
          password: superAdminPassword,
          role: 'super_admin',
          roles: ['super_admin', 'admin', 'user'],
          adminId: 'ETX-SUPER-001',
          adminLoginId: 'ETX-SUPER-001',
          designation: 'Platform Super Admin',
          etxId: 'ETX-SUPER-ADMIN-01',
          status: 'active',
          accountStatus: 'ACTIVE',
          emailVerified: true,
        });
        console.log(`   👑 Dedicated Platform Super Admin Created: ${superAdminEmail}`);
      }

      // In non-production mode, auto-seed verified demo student for dashboard testing
      if (process.env.NODE_ENV !== 'production') {
        const demoStudentEmail = 'student.cse01@demo.edutalentx.com';
        let demoStudent = await User.findOne({ email: demoStudentEmail });
        if (!demoStudent) {
          const Institution = require('./models/Institution');
          const zeal = await Institution.findOne({ code: 'ZEAL' });
          await User.create({
            name: 'Demo Student (CSE)',
            email: demoStudentEmail,
            password: 'DemoPass@123',
            role: 'user',
            roles: ['user'],
            status: 'active',
            accountStatus: 'ACTIVE',
            emailVerified: true,
            isVerified: true,
            prn: 'PRN-CSE-001',
            etxId: 'ETX-STU-CSE-01',
            prnVerificationStatus: 'approved',
            institutionId: zeal?._id || null,
            tenantId: zeal?.tenantId || 'INST-ZEAL-001',
            university: {
              name: zeal?.name || 'Zeal College of Engineering and Research',
              department: 'Computer Engineering',
              batch: '2026',
            },
          });
          console.log(`   🎓 Demo Student Account Created for QA: ${demoStudentEmail}`);
        }
      }

      // ETX ID backfill migration for existing accounts
      const usersNeedingMaviId = await User.find({
        $or: [{ etxId: { $exists: false } }, { etxId: null }, { etxId: '' }],
      });
      if (usersNeedingMaviId.length > 0) {
        let backfillCount = 0;
        for (const userDoc of usersNeedingMaviId) {
          // Pre-save hook will auto-generate unique ETX ID if missing
          await userDoc.save();
          backfillCount++;
        }
        console.log(`   ✅ ETX ID Migration: Backfilled ETX IDs for ${backfillCount} existing user account(s).`);
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
      try {
        const Institution = require('./models/Institution');
        const instCount = await Institution.countDocuments();
        if (instCount === 0) {
          await Institution.create([
            {
              name: 'Zeal College of Engineering and Research',
              tenantId: 'INST-ZEAL-001',
              institutionCode: 'ZEAL',
              code: 'ZEAL',
              domain: 'zeal.edu.in',
              officialDomain: 'zeal.edu.in',
              city: 'Pune',
              state: 'Maharashtra',
              country: 'India',
              status: 'active',
              plan: 'ENTERPRISE',
              contactEmail: 'admin@zeal.edu.in',
              primaryContact: {
                name: 'Zeal College Administration',
                email: 'admin@zeal.edu.in',
              },
            },
            {
              name: 'College of Engineering Pune (COEP Tech)',
              tenantId: 'INST-COEP-001',
              institutionCode: 'COEP',
              code: 'COEP',
              domain: 'coep.org.in',
              officialDomain: 'coep.org.in',
              city: 'Pune',
              state: 'Maharashtra',
              country: 'India',
              status: 'active',
              plan: 'ENTERPRISE',
              contactEmail: 'admin@coep.org.in',
              primaryContact: {
                name: 'COEP Administration',
                email: 'admin@coep.org.in',
              },
            },
            {
              name: 'MIT World Peace University',
              tenantId: 'INST-MIT-001',
              institutionCode: 'MITWPU',
              code: 'MITWPU',
              domain: 'mitwpu.edu.in',
              officialDomain: 'mitwpu.edu.in',
              city: 'Pune',
              state: 'Maharashtra',
              country: 'India',
              status: 'active',
              plan: 'PRO',
              contactEmail: 'admin@mitwpu.edu.in',
              primaryContact: {
                name: 'MIT-WPU Administration',
                email: 'admin@mitwpu.edu.in',
              },
            },
          ]);
          console.log('   🏫 Default customer institutions auto-seeded (Zeal, COEP, MIT-WPU).');
        }
      } catch (instSeedErr) {
        console.warn('   ⚠️  Customer institution auto-seeding skipped:', instSeedErr.message);
      }

      // ─── preferredDomain & preferredRole Normalization Migration ────────
      try {
        const { normalizeDomain } = require('./constants/domainOptions');
        const usersToNormalize = await User.find({
          preferredDomain: { $exists: true, $ne: '' },
        }).select('_id preferredDomain preferredRole');

        let normalizedCount = 0;
        for (const u of usersToNormalize) {
          const canonical = normalizeDomain(u.preferredDomain);
          if (canonical !== u.preferredDomain || (!u.preferredRole && u.preferredDomain)) {
            await User.updateOne(
              { _id: u._id },
              {
                $set: {
                  preferredDomain: canonical,
                  preferredRole: u.preferredRole || u.preferredDomain,
                },
              }
            );
            normalizedCount++;
          }
        }
        if (normalizedCount > 0) {
          console.log(`   ✅ Normalized ${normalizedCount} legacy preferredDomain value(s) to canonical domains.`);
        }
      } catch (domainMigrateErr) {
        console.warn('   ⚠️  preferredDomain migration skipped:', domainMigrateErr.message);
      }

      if (devMigrated.modifiedCount > 0 || profMigrated.modifiedCount > 0) {
        console.log(`   ✅ Role migration: ${devMigrated.modifiedCount} developer→user, ${profMigrated.modifiedCount} professor→teacher`);
      }
    } catch (migrationErr) {
      console.warn('   ⚠️  Role/ETX ID/Google ID migration skipped:', migrationErr.message);
    }

    const server = http.createServer(app);
    init(server); // Initialize socket.io

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use by another process. Please terminate the existing process or set a different PORT.`);
      } else {
        console.error('❌ Server startup error:', err.message);
      }
      process.exit(1);
    });

    // Listen on PORT without restricting to IPv4 '0.0.0.0' so dual-stack (IPv6 [::1] and IPv4 127.0.0.1) both work seamlessly
    server.listen(PORT, () => {
      console.log(`\n🚀 MaVi Linking API Server`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Port:        ${PORT}`);
      console.log(`   Health:      http://localhost:${PORT}/api/health\n`);

      // Verify SMTP transporter connectivity in the background on startup (non-blocking)
      try {
        const { verifySmtpConnection } = require('./utils/sendEmail');
        verifySmtpConnection()
          .then((res) => {
            if (res.success) {
              console.log(`   ✉️  SMTP:        Connected & verified ready (${res.status})`);
            } else {
              console.warn(`   ⚠️  SMTP:        Verification warning (${res.code || 'UNKNOWN'}: ${res.error})`);
            }
          })
          .catch((err) => {
            console.warn(`   ⚠️  SMTP:        Verification check skipped (${err.message})`);
          });
      } catch (smtpInitErr) {
        console.warn('   ⚠️  SMTP verification skipped:', smtpInitErr.message);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
