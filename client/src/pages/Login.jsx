import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Terminal,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  X,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import api from '../api/axios';
import PasswordInput from '../components/ui/PasswordInput';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot / Reset Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [sendingForgot, setSendingForgot] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const handleRequestRecovery = async (e) => {
    e.preventDefault();
    setSendingForgot(true);
    setForgotError('');
    setForgotSuccessMsg('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccessMsg(res.data?.message || 'OTP sent successfully to your recovery email!');
      setForgotStep(2);
    } catch (err) {
      setForgotError(getErrorMessage(err, 'Failed to send recovery OTP. Please check your email.'));
    } finally {
      setSendingForgot(false);
    }
  };

  const handleExecuteReset = async (e) => {
    e.preventDefault();
    setSendingForgot(true);
    setForgotError('');
    setForgotSuccessMsg('');
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword,
      });
      toast.success(res.data?.message || 'Password reset successfully! You can now log in.');
      setShowForgotModal(false);
      setPassword(forgotNewPassword);
    } catch (err) {
      setForgotError(getErrorMessage(err, 'Failed to reset password. Verify your 6-digit OTP.'));
    } finally {
      setSendingForgot(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanId = (identifier || '').trim();
    if (!cleanId) {
      setError('Please enter your Email, MAVI ID, or PRN.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const data = await login(cleanId, password);
      toast.success('Successfully authenticated!');

      const role = data?.user?.role;
      const mustChangePassword = data?.user?.mustChangePassword;

      if (mustChangePassword) {
        navigate('/change-password');
        return;
      }

      if (role === 'department_admin') {
        navigate('/department-admin');
      } else if (role === 'institution_admin' || role === 'admin') {
        navigate('/admin');
      } else if (role === 'super_admin') {
        navigate('/super-admin');
      } else if (role === 'owner' || role === 'platform_owner') {
        navigate('/owner');
      } else if (role === 'recruiter') {
        navigate('/dashboard/recruiter');
      } else if (role === 'teacher' || role === 'professor') {
        navigate('/dashboard/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  const institutionalBenefits = [
    {
      title: 'Developer Intelligence',
      desc: 'Automated repository telemetry, code commit analysis, and verified skills validation.',
    },
    {
      title: 'Career Intelligence',
      desc: 'Real-time industry benchmark matching, skill gap simulation, and AI growth roadmaps.',
    },
    {
      title: 'Academia–Industry Collaboration',
      desc: 'Verified student talent pipeline, direct recruiter engagement, and placement analytics.',
    },
    {
      title: 'Enterprise Access Control',
      desc: 'Unified multi-tenant hierarchy for Institutions, Departments, Teachers, and Recruiters.',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-primary)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── Left Institutional Info Banner (Desktop Only) ── */}
      <div
        className="hide-mobile"
        style={{
          flex: '0 0 45%',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Header Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)',
              }}
            >
              <Terminal size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                MAVI <span style={{ color: 'var(--brand-blue)', fontWeight: 700 }}>Linking</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Enterprise ERP Platform
              </div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '4px',
                background: 'var(--brand-blue-light)',
                color: 'var(--brand-blue)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              <ShieldCheck size={14} /> Enterprise Academic Intelligence
            </div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                lineHeight: 1.25,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
                letterSpacing: '-0.02em',
              }}
            >
              Developer & Career Intelligence Platform
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '440px' }}>
              Centralized academic records, verified technical profiles, departmental analytics, and corporate recruitment pipelines.
            </p>
          </div>

          {/* Benefit List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {institutionalBenefits.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--brand-blue-light)',
                    color: 'var(--brand-blue)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.45 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Security Notice */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <strong>Security Notice:</strong> Authorized enterprise access only. Telemetry and authentication events are logged for compliance and institutional audit standards.
        </div>
      </div>

      {/* ── Right Login Form Area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2.5rem 1.5rem',
          background: 'var(--bg-primary)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-xl)',
            padding: '2.5rem 2.25rem',
          }}
        >
          {/* Mobile Header Branding */}
          <div className="show-mobile" style={{ display: 'none', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'var(--brand-blue)',
                color: '#ffffff',
                marginBottom: '0.5rem',
              }}
            >
              <Terminal size={22} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              MAVI <span style={{ color: 'var(--brand-blue)' }}>Linking</span>
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: '0 0 0.4rem 0',
              }}
            >
              Sign In
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Enter your credentials to access your ERP portal.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-red)',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Email Address, PRN, or MAVI ID
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. rollno@college.edu or MAVI-1024"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={submitting}
                autoComplete="username"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.4rem',
                }}
              >
                <label className="input-label" style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail('');
                    setForgotOtp('');
                    setForgotNewPassword('');
                    setForgotStep(1);
                    setForgotSuccessMsg('');
                    setForgotError('');
                    setShowForgotModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-blue)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                autoComplete="current-password"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.925rem',
                borderRadius: '6px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              disabled={submitting}
            >
              {submitting ? 'Verifying Credentials...' : 'Sign In'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            Don't have an institutional account?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--brand-blue)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* ── Forgot / Reset Password Modal ── */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--bg-card)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xl)',
              padding: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <KeyRound size={20} style={{ color: 'var(--brand-blue)' }} /> Account Recovery
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-red)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.825rem',
                }}
              >
                {forgotError}
              </div>
            )}

            {forgotSuccessMsg && (
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: 'var(--accent-emerald, #4ADE80)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.825rem',
                }}
              >
                {forgotSuccessMsg}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestRecovery}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  Enter your registered institutional email address to receive password recovery instructions and a 6-digit OTP code.
                </p>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Registered Institutional Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="user@institution.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={sendingForgot}
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={sendingForgot}
                  >
                    {sendingForgot ? 'Sending OTP...' : 'Send Recovery OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExecuteReset}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  Enter the 6-digit OTP sent to <strong style={{ color: 'var(--text-primary)' }}>{forgotEmail}</strong> and specify your new password.
                </p>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>6-Digit Recovery OTP</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 849201"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    required
                    disabled={sendingForgot}
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>New Password</label>
                  <PasswordInput
                    className="input-field"
                    placeholder="Min 6 characters"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    disabled={sendingForgot}
                    autoComplete="new-password"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={sendingForgot}
                  >
                    {sendingForgot ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
