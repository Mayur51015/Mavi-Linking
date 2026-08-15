import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Terminal, Shield, Lock, KeyRound, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import api from '../api/axios';

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
    setForgotError('');
    setForgotSuccessMsg('');
    setSendingForgot(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccessMsg(res.data?.message || 'Recovery instructions sent.');
      setForgotStep(2);
    } catch (err) {
      setForgotError(getErrorMessage(err, 'Failed to request recovery code.'));
    } finally {
      setSendingForgot(false);
    }
  };

  const handleExecuteReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setSendingForgot(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        password: forgotNewPassword,
      });
      toast.success(res.data?.message || 'Password reset successful!');
      setShowForgotModal(false);
      setPassword('');
    } catch (err) {
      setForgotError(getErrorMessage(err, 'Password reset failed.'));
    } finally {
      setSendingForgot(false);
    }
  };

  const handleNavigationByRole = (userObj) => {
    if (userObj?.mustChangePassword) {
      navigate('/change-password');
      return;
    }
    const userRole = userObj?.role;
    switch (userRole) {
      case 'department_admin':
        navigate('/department-admin');
        break;
      case 'recruiter':
        navigate('/dashboard/recruiter');
        break;
      case 'teacher':
      case 'professor':
        navigate('/dashboard/teacher');
        break;
      case 'institution_admin':
      case 'admin':
        navigate('/admin');
        break;
      case 'super_admin':
        navigate('/super-admin');
        break;
      case 'owner':
      case 'platform_owner':
        navigate('/owner');
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(identifier, password);
      toast.success('Welcome back! You are now signed in.');
      handleNavigationByRole(res?.user);
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_VERIFICATION_REQUIRED') {
        toast.info('Please verify your email address before accessing your account.');
        navigate('/verify-account');
        return;
      }
      if (err.response?.data?.code === 'ACCOUNT_PENDING_ADMIN_APPROVAL' || err.response?.data?.code === 'ACCOUNT_REJECTED') {
        toast.info(err.response?.data?.message || 'Your account is waiting for approval from your institution administrator.');
        navigate('/pending-approval');
        return;
      }
      setError(getErrorMessage(err, 'Sign in failed. Please verify your identity credentials and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#09090b' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link to="/" className="nav-brand">
            <Terminal size={32} className="text-gradient" />
            <span>MaVi Linking</span>
          </Link>
        </div>
        
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem', color: 'white' }}>Welcome Back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Sign in with your permanent MAVI ID, verified student PRN, or email address.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">MAVI ID / Student PRN / Email</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. MAVI-8F3K7Q2P, 124BT10461, or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required 
              disabled={submitting}
            />
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label className="input-label" style={{ margin: 0 }}>Password</label>
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
                style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              disabled={submitting}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }} disabled={submitting}>
            {submitting ? 'Authenticating Identity...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register" className="text-gradient" style={{ fontWeight: '600' }}>Sign up</Link>
        </p>
      </div>

      {/* Forgot Password / Account Recovery Modal */}
      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card-static animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} style={{ color: 'var(--accent-purple)' }} /> Account Recovery
              </h3>
              <button type="button" onClick={() => setShowForgotModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.825rem' }}>
                {forgotError}
              </div>
            )}

            {forgotSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.825rem' }}>
                {forgotSuccessMsg}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestRecovery}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                  Enter your previously verified account email address to receive password recovery instructions and a 6-digit OTP code.
                </p>

                <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', color: '#fde047', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.775rem', lineHeight: '1.4' }}>
                  <strong>Security Policy:</strong> Recovery proof must come from a verified channel (email/phone). MAVI ID or PRN alone cannot be used to reset an account.
                </div>

                <div className="input-group">
                  <label className="input-label">Verified Recovery Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="user@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={sendingForgot}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowForgotModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={sendingForgot}>
                    {sendingForgot ? 'Sending...' : 'Send Recovery OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExecuteReset}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                  Enter the 6-digit OTP sent to your verified recovery channel (<strong>{forgotEmail}</strong>) and your new password.
                </p>

                <div className="input-group">
                  <label className="input-label">6-Digit Recovery OTP</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 849201"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    required
                    disabled={sendingForgot}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Min 6 chars (A-Z, a-z, 0-9)"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    disabled={sendingForgot}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setForgotStep(1)} className="btn btn-outline" style={{ flex: 1 }}>Back</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={sendingForgot}>
                    {sendingForgot ? 'Resetting...' : 'Reset Password'}
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
