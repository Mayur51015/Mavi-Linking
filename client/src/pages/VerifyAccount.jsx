import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit3,
  ArrowLeft,
  ShieldCheck,
  ArrowRight,
  Send,
} from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';

/**
 * Mask email address for privacy (e.g. student@example.com -> s***t@example.com)
 */
const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

const VerifyAccount = () => {
  const { maviId: maviIdFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tokenFromUrl = searchParams.get('t') || searchParams.get('token') || searchParams.get('code');
  const maviIdFromUrl = (maviIdFromParams || searchParams.get('maviId') || '').toUpperCase().trim();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser, logout } = useContext(AuthContext) || {};

  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Resend state
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-verify token from URL on mount
  useEffect(() => {
    if (!tokenFromUrl) return;

    const executeTokenVerification = async () => {
      setVerifying(true);
      setVerificationError('');
      try {
        const res = await api.post('/auth/verify-email', { token: tokenFromUrl, maviId: maviIdFromUrl || undefined });
        if (res.data?.success) {
          setVerificationSuccess(true);
          if (res.data.data?.token) {
            localStorage.setItem('token', res.data.data.token);
            if (res.data.data?.refreshToken) {
              localStorage.setItem('refreshToken', res.data.data.refreshToken);
            }
            if (setUser && res.data.data?.user) {
              setUser(res.data.data.user);
            }
          }
          toast.success('Account successfully verified & activated!');
        } else {
          setVerificationError(res.data?.message || 'Verification link is invalid or expired.');
        }
      } catch (err) {
        setVerificationError(
          getErrorMessage(err, 'Verification link is invalid or expired. Please request a new verification email.')
        );
      } finally {
        setVerifying(false);
      }
    };

    executeTokenVerification();
  }, [tokenFromUrl, setUser, toast]);

  // Cooldown timer handler
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Resolve pending email address for verification display & resend handlers
  const emailFromLocation = location.state?.email;
  const emailFromQuery = searchParams.get('email');
  const savedPendingEmail = localStorage.getItem('pendingVerificationEmail') || '';
  const activeEmail = (user?.email || emailFromLocation || emailFromQuery || savedPendingEmail || '').trim();

  // Resend Verification Email
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    const emailOrId = activeEmail || user?.maviId || '';
    if (!emailOrId) {
      toast.error('Registered email address is missing. Please log in or re-register.');
      return;
    }

    setResending(true);
    try {
      const res = await api.post('/auth/resend-verification', {
        email: emailOrId,
        maviId: user?.maviId,
      });

      if (res.data?.success) {
        toast.success(res.data?.message || `A new verification link has been dispatched to ${emailOrId} and your Institution Administrator!`);
        setResendCooldown(60);
        setVerificationError('');
      } else {
        toast.error(res.data?.message || 'Failed to resend verification email.');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setResendCooldown(60);
      }
      toast.error(getErrorMessage(err, 'Failed to resend verification email. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  const displayEmail = activeEmail || 'your registered email';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#09090b',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Dynamic Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#121318',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '2.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Verification in progress via link */}
        {verifying && (
          <div style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                color: '#c084fc',
              }}
            >
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Verifying Your Account...</h2>
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginTop: '0.5rem' }}>
              Validating your cryptographic activation proof...
            </p>
          </div>
        )}

        {/* Success State */}
        {!verifying && verificationSuccess && (
          <div style={{ textAlign: 'center', padding: '1rem 0', display: 'grid', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#34d399',
              }}
            >
              <CheckCircle2 size={34} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                Email Verified Successfully!
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginTop: '0.5rem', lineHeight: '1.5' }}>
                Your email address has been verified. Your account is now waiting for approval from your institution administrator.
              </p>
            </div>

            <button
              onClick={() => navigate('/pending-approval')}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                fontWeight: '700',
                fontSize: '0.95rem',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              View Approval Status <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Normal Verification Required State or Verification Link Failed */}
        {!verifying && !verificationSuccess && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            
            {/* Header Icon & Title */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  borderRadius: '18px',
                  background: verificationError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                  border: `1px solid ${verificationError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
                  color: verificationError ? '#f87171' : '#c084fc',
                  marginBottom: '1rem',
                }}
              >
                {verificationError ? <AlertCircle size={30} /> : <Mail size={30} />}
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {verificationError ? 'Verification Link Invalid or Expired' : 'Verify Your Email to Continue'}
              </h1>
              
              <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginTop: '0.5rem', lineHeight: '1.5' }}>
                {verificationError
                  ? verificationError
                  : 'Your MAVI Linking account has been created successfully. Verify your email address to activate your account and access your dashboard.'}
              </p>
            </div>

            {/* Email Details & Institution Verifier Card */}
            <div
              style={{
                padding: '1.1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                display: 'grid',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                    Verification Dispatched To Student Email
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#c084fc', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                    {activeEmail || 'mayur2006khandare@gmail.com'}
                  </div>
                  {user?.maviId && (
                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.2rem' }}>
                      Permanent MAVI ID: <span style={{ color: '#e4e4e7', fontFamily: 'monospace', fontWeight: '700' }}>{user.maviId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Institution MAVI ID Verifier Notice */}
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '10px',
                  fontSize: '0.775rem',
                  color: '#e4e4e7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ShieldCheck size={16} style={{ color: '#c084fc', flexShrink: 0 }} />
                <span>
                  <strong>Institutional Verifier:</strong> MAVI ID & verification notice sent to <strong>Institution Administrator</strong> for identity verification.
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(147, 51, 234, 0.06)',
                border: '1px solid rgba(147, 51, 234, 0.18)',
                borderRadius: '12px',
                fontSize: '0.78rem',
                color: '#d8b4fe',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                lineHeight: '1.4',
              }}
            >
              <ShieldCheck size={16} style={{ color: '#c084fc', flexShrink: 0, marginTop: '2px' }} />
              <span>
                Account activation links expire in <strong>10 minutes</strong> for your security. Check your inbox and spam folder.
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  borderRadius: '12px',
                  opacity: resendCooldown > 0 ? 0.7 : 1,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {resending ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending Verification Email & Notifying Admin...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw size={16} />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Resend Verification & Notify Institution Admin
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (logout) logout();
                  navigate('/login');
                }}
                style={{
                  padding: '0.75rem',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  color: '#a1a1aa',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <ArrowLeft size={15} />
                Back to Login
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyAccount;
