import { getSupabaseAuthErrorMessage } from '../utils/supabaseErrors';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

describe('Supabase Client & Auth Error Translation', () => {
  describe('getSupabaseAuthErrorMessage', () => {
    it('returns friendly rate limit message for status 429', () => {
      const msg = getSupabaseAuthErrorMessage({ status: 429, message: 'Too Many Requests' });
      expect(msg).toContain('Email sending rate limit reached on the default email service');
    });

    it('returns friendly rate limit message for over_email_send_rate_limit error message', () => {
      const msg = getSupabaseAuthErrorMessage({ message: 'over_email_send_rate_limit' });
      expect(msg).toContain('approx. 3-4 emails/hour');
    });

    it('returns unconfirmed email message', () => {
      const msg = getSupabaseAuthErrorMessage({ message: 'Email not confirmed' });
      expect(msg).toContain('Your email address is not yet confirmed');
    });

    it('returns invalid credentials message', () => {
      const msg = getSupabaseAuthErrorMessage({ message: 'Invalid login credentials' });
      expect(msg).toContain('Invalid email or password');
    });

    it('returns existing account message', () => {
      const msg = getSupabaseAuthErrorMessage({ message: 'User already registered' });
      expect(msg).toContain('An account with this email address already exists');
    });

    it('returns password policy message', () => {
      const msg = getSupabaseAuthErrorMessage({ message: 'Password should be at least 6 characters' });
      expect(msg).toContain('Password must be at least 6 characters long');
    });

    it('returns expired token message for expired verification link', () => {
      const msg = getSupabaseAuthErrorMessage({ message: 'Token has expired or is invalid' });
      expect(msg).toContain('The verification or recovery link has expired');
    });

    it('returns network error message for fetch failed', () => {
      const msg = getSupabaseAuthErrorMessage({ message: 'Failed to fetch' });
      expect(msg).toContain('Unable to connect to the authentication server');
    });

    it('returns recipient restriction message for email sending errors', () => {
      const msg = getSupabaseAuthErrorMessage({ message: 'Error sending confirmation email' });
      expect(msg).toContain('Unable to send confirmation email via the default email service');
    });

    it('returns fallback message when error is undefined or empty', () => {
      const msg = getSupabaseAuthErrorMessage(null, 'Custom fallback message');
      expect(msg).toBe('Custom fallback message');
    });
  });

  describe('isSupabaseConfigured', () => {
    it('returns a boolean value indicating configuration status', () => {
      const configured = isSupabaseConfigured();
      expect(typeof configured).toBe('boolean');
    });
  });

  describe('supabase client instance', () => {
    it('exports a valid Supabase client instance with auth methods', () => {
      expect(supabase).toBeDefined();
      expect(typeof supabase.auth.signUp).toBe('function');
      expect(typeof supabase.auth.signInWithPassword).toBe('function');
      expect(typeof supabase.auth.signOut).toBe('function');
      expect(typeof supabase.auth.resetPasswordForEmail).toBe('function');
      expect(typeof supabase.auth.updateUser).toBe('function');
      expect(typeof supabase.auth.onAuthStateChange).toBe('function');
    });
  });
});
