import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Terminal, Shield, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AdminAcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const toast = useToast();
  const { setAuthState } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token link.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/verify-admin-invite/${token}`);
        setInviteData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/accept-admin-invite', {
        token,
        password,
      });

      const { user, token: jwtToken, refreshToken } = res.data.data;
      localStorage.setItem('token', jwtToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      setAuthState({
        token: jwtToken,
        user,
        loading: false,
      });

      toast.success('Admin account activated successfully!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'white', padding: '1.5rem' }}>
      <div className="glass-card-static animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" className="nav-brand">
            <Terminal size={32} className="text-gradient" />
            <span>MaVi Linking</span>
          </Link>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Shield style={{ color: 'var(--accent-purple)' }} size={24} />
          Institution Admin Invitation
        </h2>

        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Verifying invitation credentials...
          </div>
        )}

        {error && (
          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#fca5a5', marginTop: '1rem', textAlign: 'center' }}>
            <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
            <p>{error}</p>
            <Link to="/admin/login" className="btn btn-outline btn-sm" style={{ marginTop: '1rem' }}>
              Go to Admin Login
            </Link>
          </div>
        )}

        {!loading && !error && inviteData && (
          <div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', margin: '1.5rem 0' }}>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
                {inviteData.institution?.name || 'Authorized Institution'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Tenant ID: <span style={{ fontFamily: 'monospace', color: 'var(--accent-purple)' }}>{inviteData.institution?.tenantId}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '0.75rem 0' }} />
              <div style={{ fontSize: '0.85rem' }}>
                <div><strong>Admin Name:</strong> {inviteData.name}</div>
                <div><strong>Official Email:</strong> {inviteData.email}</div>
                <div><strong>Admin ID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--accent-emerald)' }}>{inviteData.adminId}</span></div>
                <div><strong>Designation:</strong> {inviteData.designation}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Create Permanent Password *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Confirm Permanent Password *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={submitting}
              >
                <Key size={16} />
                {submitting ? 'Activating Admin Account...' : 'Set Password & Activate Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAcceptInvite;
