import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Building2,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const formatRoleName = (role) => {
  if (!role) return 'Account';
  switch (role.toLowerCase()) {
    case 'department_admin':
      return 'Department Administrator';
    case 'institution_admin':
      return 'Institution Administrator';
    case 'teacher':
      return 'Faculty Teacher';
    case 'recruiter':
      return 'Corporate Recruiter';
    case 'user':
    case 'student':
      return 'Student';
    default:
      return role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
};

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setUser } = React.useContext(AuthContext) || {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided in the URL. Please check your invitation link.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/auth/verify-invitation/${token}`);
        if (res.data?.success) {
          setInviteInfo(res.data.data);
        } else {
          setError(res.data?.message || 'Invalid or expired invitation token.');
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'The invitation token is invalid or has expired. Please contact your administrator to resend your invitation.'
        );
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setError('');

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/activate-account', {
        token,
        password,
      });

      if (res.data?.success) {
        if (res.data.data?.token) {
          localStorage.setItem('token', res.data.data.token);
          if (res.data.data?.refreshToken) {
            localStorage.setItem('refreshToken', res.data.data.refreshToken);
          }
          if (setUser && res.data.data?.user) {
            setUser(res.data.data.user);
          }
        }
        setSuccess(true);
      } else {
        setError(res.data?.message || 'Failed to activate account.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to activate account. The invitation link may have expired or already been used.'
      );
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
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
          maxWidth: '460px',
          background: '#121318',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(147, 51, 234, 0.12)',
              border: '1px solid rgba(147, 51, 234, 0.25)',
              color: '#c084fc',
              marginBottom: '1rem',
            }}
          >
            <KeyRound size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
            MAVI Account Activation
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginTop: '0.4rem' }}>
            Set your private password to activate your account
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#c084fc', margin: '0 auto 0.75rem auto' }} />
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>Verifying invitation token...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && !success && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div
              style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                color: '#f87171',
                fontSize: '0.875rem',
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontWeight: '700', margin: 0, color: '#fca5a5' }}>Activation Link Invalid or Expired</p>
                <p style={{ margin: '0.3rem 0 0 0', lineHeight: '1.4', color: 'rgba(248, 113, 113, 0.9)' }}>{error}</p>
              </div>
            </div>
            <Link
              to="/login"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#27272a',
                color: '#ffffff',
                fontWeight: '600',
                borderRadius: '12px',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '0.875rem',
                display: 'block',
                boxSizing: 'border-box',
              }}
            >
              Return to Login Page
            </Link>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div style={{ textAlign: 'center', padding: '1rem 0', display: 'grid', gap: '1.25rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                margin: '0 auto',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
              Account Successfully Activated!
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa', lineHeight: '1.5', margin: 0 }}>
              Your private password has been set. You can now sign in with your email or assigned MAVI ID.
            </p>
            <button
              onClick={() => {
                const targetRole = inviteInfo?.role;
                if (targetRole === 'department_admin') navigate('/department-admin');
                else if (targetRole === 'institution_admin' || targetRole === 'admin') navigate('/admin');
                else if (targetRole === 'super_admin') navigate('/super-admin');
                else if (targetRole === 'teacher') navigate('/dashboard/teacher');
                else if (targetRole === 'recruiter') navigate('/dashboard/recruiter');
                else navigate('/dashboard');
              }}
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
              }}
            >
              Enter {formatRoleName(inviteInfo?.role)} Portal
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Activation Form */}
        {!loading && inviteInfo && !success && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            
            {/* User Details Badge Card */}
            <div
              style={{
                padding: '1.1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                display: 'grid',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a1a1aa' }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Invited Account</span>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    background: 'rgba(147, 51, 234, 0.15)',
                    color: '#c084fc',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  {formatRoleName(inviteInfo.role)}
                </span>
              </div>

              <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '1.1rem', marginTop: '0.2rem' }}>
                {inviteInfo.name}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={14} style={{ color: '#71717a' }} />
                {inviteInfo.email}
              </div>

              {inviteInfo.institutionName && (
                <div style={{ fontSize: '0.8rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <Building2 size={14} />
                  {inviteInfo.institutionName}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.1rem' }}>
              {passwordError && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  {passwordError}
                </div>
              )}

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#d4d4d8', marginBottom: '0.4rem' }}>
                  Create New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      padding: '0.7rem 2.5rem 0.7rem 2.4rem',
                      fontSize: '0.875rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#d4d4d8', marginBottom: '0.4rem' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    style={{
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      padding: '0.7rem 2.5rem 0.7rem 2.4rem',
                      fontSize: '0.875rem',
                      color: '#ffffff',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Encryption Notice */}
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(147, 51, 234, 0.05)',
                  border: '1px solid rgba(147, 51, 234, 0.15)',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  color: '#d8b4fe',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                }}
              >
                <ShieldCheck size={16} style={{ color: '#c084fc', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  No password was set by your administrator. Your password is private and end-to-end encrypted.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
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
                  marginTop: '0.5rem',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Activating Account...
                  </>
                ) : (
                  'Activate Account & Save Password'
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivateAccount;
