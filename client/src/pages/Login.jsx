import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Terminal, Shield, Lock, KeyRound, X } from 'lucide-react';
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

  return (
    <div className="auth-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#09090b' }}>
      <div className="glass-card-static auth-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: 'var(--accent-purple)', marginBottom: '1rem' }}>
            <Terminal size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: 'white' }}>Identity Verification</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Sign in to access your MAVI Linking portal
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1.25rem' }}>
            <label className="input-label">Email Address or MAVI ID</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. user@institution.edu or MAVI-1A2B3C"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={submitting}
              autoComplete="username"
            />
          </div>

          <div className="input-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
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
            <PasswordInput
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              autoComplete="current-password"
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
                  <PasswordInput
                    className="input-field"
                    placeholder="Min 6 chars (A-Z, a-z, 0-9)"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    required
                    disabled={sendingForgot}
                    autoComplete="new-password"
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
