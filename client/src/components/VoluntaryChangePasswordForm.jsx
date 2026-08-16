import React, { useState, useContext } from 'react';
import { Lock, KeyRound, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import PasswordInput from './ui/PasswordInput';

const VoluntaryChangePasswordForm = ({ onSuccess }) => {
  const { changePassword } = useContext(AuthContext);
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordPolicy.test(newPassword)) {
      setError('New password must contain an uppercase letter, lowercase letter, and a number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccessMsg('Password updated successfully!');
      toast.success('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update password. Please check your current password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card-static" style={{ padding: '1.75rem', borderRadius: '14px', border: '1px solid var(--border-color)', maxWidth: '520px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
          <KeyRound size={22} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>Change Password</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Update your account security credentials</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', color: '#34d399', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.15rem' }}>
        <div className="input-group">
          <label className="input-label">Current Password *</label>
          <PasswordInput
            className="input-field"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={submitting}
            autoComplete="current-password"
          />
        </div>

        <div className="input-group">
          <label className="input-label">New Password *</label>
          <PasswordInput
            className="input-field"
            placeholder="Min 6 chars, uppercase, lowercase, number"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={submitting}
            autoComplete="new-password"
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Must contain min 6 characters with uppercase, lowercase & number
          </span>
        </div>

        <div className="input-group">
          <label className="input-label">Confirm New Password *</label>
          <PasswordInput
            className="input-field"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={submitting}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: '0.5rem', padding: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          disabled={submitting}
        >
          <Lock size={16} />
          {submitting ? 'Updating Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default VoluntaryChangePasswordForm;
