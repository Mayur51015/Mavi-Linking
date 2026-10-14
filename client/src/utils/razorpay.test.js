import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadRazorpayCheckout } from './razorpay';

describe('loadRazorpayCheckout utility', () => {
  beforeEach(() => {
    delete window.Razorpay;
    document.querySelectorAll('script[src*="checkout.razorpay.com"]').forEach((s) => s.remove());
  });

  afterEach(() => {
    delete window.Razorpay;
    document.querySelectorAll('script[src*="checkout.razorpay.com"]').forEach((s) => s.remove());
  });

  it('resolves immediately if window.Razorpay is already present', async () => {
    const mockRazorpay = { open: vi.fn() };
    window.Razorpay = mockRazorpay;

    const result = await loadRazorpayCheckout();
    expect(result).toBe(mockRazorpay);
  });

  it('injects Razorpay script tag if not present and resolves when script loads', async () => {
    const mockRazorpay = { open: vi.fn() };

    const loadPromise = loadRazorpayCheckout();

    const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    expect(script).not.toBeNull();
    expect(script.async).toBe(true);

    // Simulate script loading
    window.Razorpay = mockRazorpay;
    script.onload();

    const result = await loadPromise;
    expect(result).toBe(mockRazorpay);
  });

  it('rejects if script loads but window.Razorpay is not defined', async () => {
    const loadPromise = loadRazorpayCheckout();

    const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    expect(script).not.toBeNull();

    // Trigger onload without setting window.Razorpay
    script.onload();

    await expect(loadPromise).rejects.toThrow('Razorpay SDK failed to initialize.');
  });

  it('rejects if script network error occurs', async () => {
    const loadPromise = loadRazorpayCheckout();

    const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    expect(script).not.toBeNull();

    script.onerror();

    await expect(loadPromise).rejects.toThrow('Failed to load Razorpay Checkout SDK.');
  });

  it('reuses existing script tag in DOM if already present', async () => {
    const existingScript = document.createElement('script');
    existingScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(existingScript);

    const mockRazorpay = { open: vi.fn() };
    const loadPromise = loadRazorpayCheckout();

    // Verify no second script was added
    expect(document.querySelectorAll('script[src*="checkout.razorpay.com"]').length).toBe(1);

    window.Razorpay = mockRazorpay;
    existingScript.dispatchEvent(new Event('load'));

    const result = await loadPromise;
    expect(result).toBe(mockRazorpay);
  });
});
