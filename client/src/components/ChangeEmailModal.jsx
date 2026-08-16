import React, { useState, useEffect, useContext } from 'react';
import { Mail, Lock, KeyRound, ShieldCheck, AlertCircle, RefreshCw, CheckCircle, X } from 'lucide-react';
import api from '../api/axios';
import PasswordInput from './ui/PasswordInput';
import { AuthContext } from '../context/AuthContext';

/**
 * ChangeEmailModal — Secure 2-Step Email Address Change Component
 * Step 1: Verify Current Password & Enter New Email
 * Step 2: Verify 6-Digit OTP sent to New Email
 */
const ChangeEmailModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, refreshUser, setUser } = useContext(AuthContext);

  const [step, setStep] = useState(1); // 1 = Request, 2 = Verify OTP
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Resend Cooldown Timer (60s)
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setNewEmail('');
    setCurrentPassword('');
    setOtp('');
    setLoading(false);
    setError(null);
    setStatusMessage('');
    onClose();
  };

  // Step 1: Submit Request (Password Verification & Send OTP)
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage('');

    if (!newEmail || !currentPassword) {
      setError('Please provide both your new email address and current password.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/email-change/request', {
        newEmail: newEmail.trim(),
        currentPassword,
      });

      if (res.data?.success) {
        setStatusMessage(res.data.message || `Verification code sent to ${newEmail}`);
        setStep(2);
        setResendCooldown(60);
      }
    } catch (err) {
      console.error('Email change request error:', err);
      setError(err.response?.data?.message || 'Failed to initiate email change request.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit OTP
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/email-change/verify', {
        otp: otp.trim(),
        newEmail: newEmail.trim(),
      });

      if (res.data?.success) {
        setStatusMessage('🎉 Your email address has been successfully updated!');
        if (res.data.data?.token) {
          localStorage.setItem('token', res.data.data.token);
        }
        if (res.data.data?.user) {
          setUser(res.data.data.user);
        } else {
          await refreshUser();
        }

        setTimeout(() => {
          if (onSuccess) onSuccess(res.data.data?.user?.email || newEmail);
          handleReset();
        }, 1200);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/email-change/resend', {
        newEmail: newEmail.trim(),
      });

      if (res.data?.success) {
        setStatusMessage(`A new 6-digit code was sent to ${newEmail}`);
        setResendCooldown(60);
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2rem',
          border: '1px solid var(--accent-purple, #8b5cf6)',
          position: 'relative',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        <button
          onClick={handleReset}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #a1a1aa)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid #8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              color: '#c084fc',
            }}
          >
            <Mail size={24} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
            {step === 1 ? 'Change Registered Email' : 'Verify New Email Address'}
          </h2>
          <p style={{ color: 'var(--text-muted, #a1a1aa)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            {step === 1
              ? 'Your email address is used for authentication and security notifications.'
              : `Enter the 6-digit code sent to ${newEmail}`}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.85rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {statusMessage && (
          <div
            style={{
              padding: '0.85rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* STEP 1: REQUEST FORM */}
        {step === 1 && (
          <form onSubmit={handleRequestSubmit}>
            <div style={{ display: 'grid', gap: '1.1rem', marginBottom: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Current Registered Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={user?.email || ''}
                  disabled
                  style={{ background: 'rgba(255,255,255,0.03)', opacity: 0.7 }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  New Email Address *
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="student.new@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Current Password *
                </label>
                <PasswordInput
                  className="input-field"
                  placeholder="Enter current password for verification"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={handleReset} className="btn btn-outline" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Verifying Password...' : 'Send Verification Code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY OTP FORM */}
        {step === 2 && (
          <form onSubmit={handleVerifySubmit}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <label className="input-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
                6-Digit Verification Code *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="482913"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1.75rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#c084fc',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline" style={{ flex: 1 }}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying OTP...' : 'Verify & Update Email'}
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || resendCooldown > 0}
                className="btn btn-link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-purple, #8b5cf6)',
                  fontSize: '0.8rem',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <RefreshCw size={14} />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Verification Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangeEmailModal;
