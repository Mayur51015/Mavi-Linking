/**
 * Translates Supabase Auth errors into user-friendly messages,
 * specifically handling the default email service limitations and rate limits.
 *
 * @param {object|Error|string} error - The Supabase auth error
 * @param {string} [fallbackMessage] - Fallback message if unrecognized
 * @returns {string} User-facing error message
 */
export const getSupabaseAuthErrorMessage = (error, fallbackMessage = 'An unexpected error occurred. Please try again.') => {
  if (!error) return fallbackMessage;

  const rawMessage = typeof error === 'string' ? error : (error.message || error.error_description || '');
  const status = error.status || error.statusCode;

  const lower = rawMessage.toLowerCase();

  // 1. Rate Limiting (Supabase Default Email Service Limit)
  if (
    status === 429 ||
    lower.includes('rate limit') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('too many requests')
  ) {
    return 'Email sending rate limit reached on the default email service (approx. 3-4 emails/hour). Please wait before requesting another email.';
  }

  // 2. Unverified Email
  if (
    lower.includes('email not confirmed') ||
    lower.includes('email_not_confirmed') ||
    lower.includes('not verified')
  ) {
    return 'Your email address is not yet confirmed. Please check your inbox for the confirmation email from Supabase.';
  }

  // 3. Invalid Credentials
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid grant')
  ) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  // 4. User Already Exists
  if (
    lower.includes('user already registered') ||
    lower.includes('already exists')
  ) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  // 5. Password Policy
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  // 6. Expired / Invalid Callback Link or OTP
  if (
    lower.includes('token has expired') ||
    lower.includes('expired') ||
    lower.includes('invalid token') ||
    lower.includes('otp expired')
  ) {
    return 'The verification or recovery link has expired or has already been used. Please request a new link.';
  }

  // 7. Network / Connectivity Error
  if (
    lower.includes('fetch failed') ||
    lower.includes('network error') ||
    lower.includes('failed to fetch')
  ) {
    return 'Unable to connect to the authentication server. Please check your internet connection.';
  }

  // 8. Restricted Recipient / Default Email Service
  if (lower.includes('error sending confirmation email') || lower.includes('error sending email')) {
    return 'Unable to send confirmation email via the default email service. Ensure the email address is valid and not blocked.';
  }

  return rawMessage || fallbackMessage;
};

export default getSupabaseAuthErrorMessage;
