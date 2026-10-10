import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Crown, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import api from '../../api/axios';
import PasswordInput from '../../components/ui/PasswordInput';

const OwnerLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('Access Denied. Platform Owner master credentials required.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
      const isOwner = userRoles.includes('platform_owner') || userRoles.includes('owner') || userRoles.includes('super_admin') || user.adminId === 'ETX-OWNER-001';
      if (isOwner) {
        navigate('/owner', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/super-admin-login', {
        identifier,
        password,
      });
      const { user: userData, token, refreshToken } = res.data.data;
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      toast.success('Platform Owner authorization verified.');
      window.location.href = '/owner';
    } catch (err) {
      setError(getErrorMessage(err, 'Platform Owner authentication failed. Check credentials.'));
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
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Crown size={26} style={{ color: '#2563EB' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.35rem', color: '#111111' }}>
            Platform Owner Portal
          </h2>
          <p style={{ color: '#4B5563', fontSize: '0.875rem', margin: 0 }}>
            Master Platform Ownership & Global Licensing Console
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
            <label className="input-label" style={{ color: '#111111', fontWeight: 500 }}>Owner Email / Owner ID</label>
            <input
              type="text"
              className="input-field"
              placeholder="Mayur1718khandare@gmail.com or ETX-OWNER-001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ color: '#111111', fontWeight: 500 }}>Master Password</label>
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
            {submitting ? 'Verifying Authorization...' : 'Enter Platform Owner Console'}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
          <Link
            to="/login"
            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={14} /> Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;
