import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import PasswordInput from '../components/ui/PasswordInput';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getSupabaseAuthErrorMessage } from '../utils/supabaseErrors';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!isSupabaseConfigured()) {
        if (mounted) {
          setError('Supabase is not configured on this environment.');
          setCheckingSession(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (mounted) setHasRecoverySession(true);
        }

        // Listen to auth state change (PASSWORD_RECOVERY event)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            if (mounted) setHasRecoverySession(true);
          }
        });

        // Also check URL hash for recovery tokens
        if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
          if (mounted) setHasRecoverySession(true);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error checking recovery session:', err);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      toast?.success?.('Password updated successfully! You can now log in.');

      // Sign out from recovery session and redirect to login after 3 seconds
      setTimeout(async () => {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore signOut error
        }
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(getSupabaseAuthErrorMessage(err, 'Failed to update password. Your recovery link may be expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg-primary, #0B0F17)',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem',
          borderRadius: '16px',
          background: 'var(--bg-card, #131B2E)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.5))',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BrandLogo
            variant="full"
            size={44}
            linkTo="/"
            showTagline={false}
            style={{ display: 'inline-flex', justifyContent: 'center' }}
          />
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--text-primary, #F3F4F6)',
              marginTop: '1.25rem',
              marginBottom: '0.35rem',
            }}
          >
            Create New Password
          </h1>
          <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.85rem' }}>
            Set a new secure password for your EduTalentX account
          </p>
        </div>

        {checkingSession ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: 'var(--brand-blue, #2563EB)', margin: '0 auto 1rem' }}
            />
            <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.9rem' }}>
              Verifying your recovery link...
            </p>
          </div>
        ) : success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '1rem 0' }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid var(--accent-emerald, #22c55e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={32} style={{ color: 'var(--accent-emerald, #22c55e)' }} />
            </div>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 600,
                color: 'var(--text-primary, #F3F4F6)',
                marginBottom: '0.5rem',
              }}
            >
              Password Reset Complete!
            </h2>
            <p
              style={{
                color: 'var(--text-secondary, #9CA3AF)',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              Your password has been safely updated. Redirecting you to the sign-in page...
            </p>
            <Link
              to="/login"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Sign In Now <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : !hasRecoverySession ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertCircle size={32} style={{ color: 'var(--accent-rose, #ef4444)' }} />
            </div>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary, #F3F4F6)',
                marginBottom: '0.5rem',
              }}
            >
              Recovery Link Expired or Invalid
            </h2>
            <p
              style={{
                color: 'var(--text-secondary, #9CA3AF)',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              The password reset link has expired, already been used, or was opened in a different browser.
              Please request a fresh reset link from the login page.
            </p>
            <Link
              to="/login"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Return to Login <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-rose, #ef4444)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #9CA3AF)',
                  marginBottom: '0.45rem',
                }}
              >
                New Password
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #9CA3AF)',
                  marginBottom: '0.45rem',
                }}
              >
                Confirm New Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                borderRadius: '10px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  Update Password <ShieldCheck size={18} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link
                to="/login"
                style={{
                  color: 'var(--text-muted, #6B7280)',
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                }}
              >
                Cancel and return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
