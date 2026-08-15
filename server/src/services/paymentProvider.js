const crypto = require('crypto');

/**
 * Abstract Payment Provider Interface
 */
class PaymentProvider {
  async createOrder(params) {
    throw new Error('createOrder() must be implemented by payment provider');
  }

  async createSubscription(params) {
    throw new Error('createSubscription() must be implemented by payment provider');
  }

  verifyWebhookSignature(rawBody, signature, secret) {
    throw new Error('verifyWebhookSignature() must be implemented by payment provider');
  }

  verifyPaymentSignature(params, secret) {
    throw new Error('verifyPaymentSignature() must be implemented by payment provider');
  }
}

/**
 * Razorpay Payment Provider Implementation
 */
class RazorpayProvider extends PaymentProvider {
  constructor() {
    super();
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  /**
   * Validate required environment variables at runtime/startup
   */
  validateConfig() {
    if (process.env.NODE_ENV === 'production') {
      if (!this.keyId || !this.keySecret || !this.webhookSecret) {
        throw new Error('CRITICAL PRODUCTION CONFIGURATION ERROR: Razorpay API environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET) are missing.');
      }
    }
  }

  /**
   * Create Razorpay Checkout Order
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (!this.keyId || !this.keySecret) {
      // Dev / Test Mock fallback order generator when credentials not present
      const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
      return {
        id: mockOrderId,
        entity: 'order',
        amount: Math.round(amount * 100), // convert to paise
        amount_paid: 0,
        amount_due: Math.round(amount * 100),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: 'created',
        notes,
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    try {
      const Razorpay = require('razorpay');
      const instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });

      const orderOptions = {
        amount: Math.round(amount * 100), // convert to paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes,
      };

      const order = await instance.orders.create(orderOptions);
      return order;
    } catch (error) {
      console.error('[RAZORPAY ORDER ERROR]', error.message);
      throw new Error(`Razorpay Order Creation Failed: ${error.message}`);
    }
  }

  /**
   * Verify Client Payment Checkout Signature (HMAC SHA-256)
   * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret)
   */
  verifyPaymentSignature({ orderId, paymentId, signature }, secretOverride) {
    const secret = secretOverride || this.keySecret;
    if (!secret) return true; // Dev mode bypass if secret omitted

    if (!orderId || !paymentId || !signature) return false;

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Verify Razorpay Webhook Signature (HMAC SHA-256 on RAW Request Body)
   * Formula: HMAC_SHA256(raw_http_body, webhook_secret)
   */
  verifyWebhookSignature(rawBody, signature, secretOverride) {
    const secret = secretOverride || this.webhookSecret;
    if (!secret) {
      console.warn('[WEBHOOK WARN] RAZORPAY_WEBHOOK_SECRET is not configured.');
      return false;
    }

    if (!signature || !rawBody) return false;

    let payloadString = '';
    if (Buffer.isBuffer(rawBody)) {
      payloadString = rawBody.toString('utf8');
    } else if (typeof rawBody === 'string') {
      payloadString = rawBody;
    } else {
      // Reconstruct string representation if raw buffer missing
      payloadString = JSON.stringify(rawBody);
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (e) {
      return false;
    }
  }
}

// Provider Singleton Factory
const getPaymentProvider = (providerName = 'razorpay') => {
  switch (providerName.toLowerCase()) {
    case 'razorpay':
      return new RazorpayProvider();
    default:
      return new RazorpayProvider();
  }
};

module.exports = {
  PaymentProvider,
  RazorpayProvider,
  getPaymentProvider,
};
