import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ShieldAlert, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import api from '../../api/axios';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('Access Denied. Platform Super Admin credentials required.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
      const isSuperAdmin = userRoles.includes('super_admin') || user.role === 'super_admin' || user.role === 'admin';
      if (isSuperAdmin) {
        navigate('/super-admin', { replace: true });
      }
    }
  }, [user, navigate]);

  const verifyAndRedirect = (userData) => {
    const userRoles = Array.isArray(userData.roles) && userData.roles.length > 0 ? userData.roles : [userData.role];
    const isSuperAdmin = userRoles.includes('super_admin') || userData.role === 'super_admin';

    if (isSuperAdmin) {
      toast.success('Super Admin authorization verified.');
      navigate('/super-admin', { replace: true });
    } else {
      setError('Forbidden. Platform Super Admin credentials required. Operational admins cannot access Super Admin governance.');
      toast.error('Access Denied. Super Admin required.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/super-admin-login', {
        identifier: email,
        password,
      });
      const { user: userData, token, refreshToken } = res.data.data;
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      verifyAndRedirect(userData);
    } catch (err) {
      setError(getErrorMessage(err, 'Super Admin authentication failed. Check credentials.'));
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
      background: '#09090b',
      padding: '1.5rem',
      position: 'relative',
    }}>
      <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <ShieldAlert size={36} style={{ color: '#ef4444' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.5rem', color: 'white' }}>
            Super Admin Portal
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
            Restricted Platform Governance Console — Authorized Personnel Only
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label" style={{ color: '#a1a1aa' }}>Super Admin ID / Email</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. MAVI-SA-001 or email@mavilinking.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ color: '#a1a1aa' }}>Master Credentials</label>
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
              fontWeight: '700',
              background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
              borderColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Lock size={16} />
            {submitting ? 'Verifying Super Admin Authorization...' : 'Enter Super Admin Console'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} /> Return to Public Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
