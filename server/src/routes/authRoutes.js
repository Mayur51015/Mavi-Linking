const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter, loginLimiter } = require('../middleware/authLimiter');const {
  register,
  login,
  getMe,
  updateProfile,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleLogin,
  githubLogin,
  logout,
} = require('../controllers/authController');
const {
  upload,
  uploadProfileDocument,
  deleteProfileDocument,
  getProfileDocument,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getCertificateFile,
  createPortfolioDoc,
  updatePortfolioDoc,
  deletePortfolioDoc,
  getPortfolioDocFile,
} = require('../controllers/userDocumentController');

const router = express.Router();

// ─── Validation Rules ───────────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  body('role')
    .optional()
    .isIn(['user', 'recruiter', 'teacher'])
    .withMessage('Role must be user, recruiter, or teacher'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
];

// ─── Public Routes ──────────────────────────────────────────────────────────

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', loginLimiter, loginValidation, validate, login);
router.post('/refresh', authLimiter, refreshToken);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/google', authLimiter, googleLogin);
router.post('/github', authLimiter, githubLogin);
// ─── Protected Routes ───────────────────────────────────────────────────────

router.get('/me', protect, getMe);
router.put('/me', protect, updateProfileValidation, validate, updateProfile);
router.post('/logout', protect, logout);

// Profile Document upload/download/preview routes
router.post('/document/:type', protect, upload.single('file'), uploadProfileDocument);
router.delete('/document/:type', protect, deleteProfileDocument);
router.get('/document/:type', protect, getProfileDocument);

// Certificates CRUD routes
router.post('/certificate', protect, upload.single('file'), createCertificate);
router.put('/certificate/:id', protect, upload.single('file'), updateCertificate);
router.delete('/certificate/:id', protect, deleteCertificate);
router.get('/certificate/:id/file', protect, getCertificateFile);

// Portfolio Documents (dynamic) CRUD routes
router.post('/portfolio-doc', protect, upload.single('file'), createPortfolioDoc);
router.put('/portfolio-doc/:id', protect, upload.single('file'), updatePortfolioDoc);
router.delete('/portfolio-doc/:id', protect, deletePortfolioDoc);
router.get('/portfolio-doc/:id/file', protect, getPortfolioDocFile);

module.exports = router;
