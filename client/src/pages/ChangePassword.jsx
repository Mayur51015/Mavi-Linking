import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, ShieldAlert, KeyRound, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';
import PasswordInput from '../components/ui/PasswordInput';

const ChangePassword = () => {
  const { user, changePassword, logout } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      toast.success('Password updated successfully! Mandatory setup completed.');

      // Route based on role
      const userRole = user?.role;
      if (userRole === 'department_admin') {
        navigate('/department-admin');
      } else if (userRole === 'institution_admin' || userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'super_admin') {
        navigate('/super-admin');
      } else if (userRole === 'owner' || userRole === 'platform_owner') {
        navigate('/owner');
      } else if (userRole === 'recruiter') {
        navigate('/dashboard/recruiter');
      } else if (userRole === 'teacher' || userRole === 'professor') {
        navigate('/dashboard/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update password. Verify your current password.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#09090b' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', marginBottom: '1rem' }}>
            <KeyRound size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'white' }}>Establish New Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
            For security compliance, you must change your initial temporary password before accessing MAVI Linking portal services.
          </p>
        </div>

        {user?.mustChangePassword && (
          <div style={{ padding: '0.75rem', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid #eab308', borderRadius: '8px', color: '#fef08a', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: '#eab308', flexShrink: 0 }} />
            <span>Dashboard access is locked until a new password is established.</span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Current / Temporary Password</label>
            <PasswordInput
              className="input-field"
              placeholder="Enter current or temporary password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={submitting}
              autoComplete="current-password"
            />
          </div>

          <div className="input-group">
            <label className="input-label">New Password *</label>
            <PasswordInput
              className="input-field"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={submitting}
              autoComplete="new-password"
            />
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

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.85rem', background: '#ef4444', borderColor: '#ef4444' }} disabled={submitting}>
            {submitting ? 'Updating Password...' : 'Establish New Password'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
            Sign out of account
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
