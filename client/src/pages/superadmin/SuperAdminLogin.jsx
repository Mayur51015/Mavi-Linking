import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ShieldAlert, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import api from '../../api/axios';
import PasswordInput from '../../components/ui/PasswordInput';

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
      background: '#F8F9FA',
      padding: '1.5rem',
      position: 'relative',
    }}>
      <div style={{ maxWidth: '440px', width: '100%', padding: '2.25rem', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <ShieldAlert size={26} style={{ color: '#DC2626' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.35rem', color: '#111111' }}>
            Super Admin Portal
          </h2>
          <p style={{ color: '#4B5563', fontSize: '0.875rem', margin: 0 }}>
            Restricted Platform Governance Console — Authorized Personnel Only
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label" style={{ color: '#111111', fontWeight: 500 }}>Super Admin ID / Email</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. ETX-SA-001 or email@edutalentx.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ color: '#111111', fontWeight: 500 }}>Master Credentials</label>
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

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontWeight: '600',
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

        <div style={{ marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} /> Return to Public Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
