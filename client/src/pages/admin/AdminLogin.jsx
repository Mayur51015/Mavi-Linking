import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Shield, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import GoogleSignInButton from '../../components/GoogleSignInButton';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('Access Denied. You must be an authorized Administrator to access this portal.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
      const isAuthorized = userRoles.some((r) => ['admin', 'institution_admin', 'super_admin'].includes(r)) || ['admin', 'institution_admin', 'super_admin'].includes(user.role);
      if (isAuthorized) {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, navigate]);

  const verifyAndRedirect = (userData) => {
    const userRoles = Array.isArray(userData.roles) && userData.roles.length > 0 ? userData.roles : [userData.role];
    const isAuthorized = userRoles.some((r) => ['admin', 'institution_admin', 'super_admin'].includes(r)) || ['admin', 'institution_admin', 'super_admin'].includes(userData.role);

    if (isAuthorized) {
      toast.success('Admin authentication verified.');
      navigate('/admin', { replace: true });
    } else {
      setError('Forbidden. Your account does not have Administrative privileges.');
      toast.error('Access Denied. Admin privileges required.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email, password);
      verifyAndRedirect(res.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Admin login failed. Check credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle(credential);
      verifyAndRedirect(res.user);
    } catch (err) {
      setError(getErrorMessage(err, 'Google verification failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary, #09090b)',
      padding: '1.5rem',
      position: 'relative',
    }}>
      <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <Shield size={32} style={{ color: 'var(--accent-purple, #8b5cf6)' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.5rem', color: 'white' }}>
            Administrative Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Secure sign-in for MAVI Linking Administrators & Verification Managers
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label" style={{ color: 'var(--text-secondary)' }}>Admin Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Lock size={16} />
            {submitting ? 'Verifying Authorization...' : 'Sign In to Admin Console'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google Authentication failed.')}
        />

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} /> Back to User Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
