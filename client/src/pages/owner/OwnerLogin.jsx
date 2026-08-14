import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Crown, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';
import api from '../../api/axios';

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
      const isOwner = userRoles.includes('platform_owner') || userRoles.includes('owner') || userRoles.includes('super_admin') || user.adminId === 'MAVI-OWNER-001';
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
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#09090b', padding: '1.5rem', position: 'relative',
    }}>
      <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(234, 179, 8, 0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
          }}>
            <Crown size={40} style={{ color: '#eab308' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.5rem', color: 'white' }}>
            Platform Owner Portal
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
            Master Platform Ownership & Global Licensing Console
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.12)', border: '1px solid #eab308', color: '#fde047',
            padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label" style={{ color: '#a1a1aa' }}>Owner Email / Owner ID</label>
            <input
              type="text"
              className="input-field"
              placeholder="owner@mavilinking.com or MAVI-OWNER-001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ color: '#a1a1aa' }}>Master Password</label>
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
              width: '100%', padding: '0.85rem', fontWeight: '700',
              background: 'linear-gradient(135deg, #eab308 0%, #ec4899 100%)',
              borderColor: '#eab308', color: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            <Lock size={16} />
            {submitting ? 'Verifying Authorization...' : 'Enter Platform Owner Console'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <Link
            to="/login"
            style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={14} /> Return to Public Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;
