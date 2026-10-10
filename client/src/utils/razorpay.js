export const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve(window.Razorpay);
    return;
  }

  const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');

  if (existingScript) {
    existingScript.addEventListener('load', () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        reject(new Error('Razorpay SDK loaded but window.Razorpay is unavailable.'));
      }
    }, { once: true });

    existingScript.addEventListener('error', () => {
      reject(new Error('Failed to load Razorpay Checkout SDK.'));
    }, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
    } else {
      reject(new Error('Razorpay SDK failed to initialize.'));
    }
  };
  script.onerror = () => {
    reject(new Error('Failed to load Razorpay Checkout SDK.'));
  };

  document.body.appendChild(script);
});
