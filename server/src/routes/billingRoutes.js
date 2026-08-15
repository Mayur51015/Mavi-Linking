const express = require('express');
const { protect } = require('../middleware/auth');
const { requireBillingAdmin, enforceInstitutionScope } = require('../middleware/rbacMiddleware');
const {
  getPublishedPlans,
  getInstitutionBilling,
  createCheckoutSession,
  verifyPayment,
  handleWebhook,
  getInvoices,
  getInvoiceById,
  cancelSubscription,
} = require('../controllers/billingController');

const router = express.Router();

// 1. Signature-Verified Public Webhook & Catalog Endpoints
router.get('/plans', getPublishedPlans);
router.post('/webhook/razorpay', handleWebhook);
router.post('/webhook', handleWebhook);

// 2. Protected Institution Billing Endpoints (JWT + Institution Billing Admin + ABAC Tenant Scope)
router.use(protect, requireBillingAdmin, enforceInstitutionScope);

router.get('/subscription', getInstitutionBilling);
router.post('/checkout', createCheckoutSession);
router.post('/verify-payment', verifyPayment);
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);
router.post('/cancel-subscription', cancelSubscription);

module.exports = router;
