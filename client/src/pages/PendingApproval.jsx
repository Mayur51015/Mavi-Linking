import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Terminal, CheckCircle2, Clock, XCircle, RefreshCw, Mail, LogOut, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

const PendingApproval = () => {
  const { user, refreshUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      const res = await api.get('/auth/me');
      const currentUser = res.data?.data?.user || res.data?.user;
      
      if (currentUser?.emailVerified && currentUser?.accountStatus === 'ACTIVE') {
        toast.success('🎉 Your account has been approved! Redirecting to dashboard...');
        navigate('/dashboard');
      } else {
        toast.info(`Status updated: ${currentUser?.accountStatus || 'PENDING_ADMIN_APPROVAL'}`);
      }
    } catch (err) {
      toast.error('Failed to refresh account status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRejected = user?.accountStatus === 'REJECTED';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#09090b' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', borderRadius: '16px', background: '#18181b', border: '1px solid #27272a' }}>
        
        {/* Header Branding */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <Terminal size={32} className="text-gradient" style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>MaVi Linking</span>
          </Link>
        </div>

        {/* Status Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {isRejected ? (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <XCircle size={36} color="#ef4444" />
            </div>
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', border: '2px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Clock size={36} color="#a855f7" className="animate-pulse" />
            </div>
          )}

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
            {isRejected ? 'Registration Decision Notice' : 'Your Account Is Waiting for Approval'}
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {isRejected
              ? 'Your student registration was reviewed by your institution administrator and was not approved at this time.'
              : 'Your email has been verified successfully. Your account is now waiting for institutional approval from your administrator.'}
          </p>
        </div>

        {/* Verification Status Badges */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} /> Email Verified
          </div>

          {isRejected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
              <XCircle size={14} /> Registration Rejected
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#fde047', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
              <Clock size={14} /> Admin Approval Pending
            </div>
          )}
        </div>

        {/* Student Details Card */}
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#71717a', display: 'block', fontSize: '0.75rem' }}>{user?.role === 'user' ? 'Student Name' : 'Account Name'}</span>
              <strong style={{ color: '#ffffff' }}>{user?.name || 'Student'}</strong>
            </div>
            <div>
              <span style={{ color: '#71717a', display: 'block', fontSize: '0.75rem' }}>Permanent MAVI ID</span>
              <strong style={{ color: '#c084fc' }}>{user?.maviId || 'MAVI-PENDING'}</strong>
            </div>
            <div>
              <span style={{ color: '#71717a', display: 'block', fontSize: '0.75rem' }}>PRN / ZPRN</span>
              <span style={{ color: '#e4e4e7' }}>{user?.prn || user?.institutionalIdentifier?.identifierValue || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: '#71717a', display: 'block', fontSize: '0.75rem' }}>Department</span>
              <span style={{ color: '#e4e4e7' }}>{user?.university?.department || 'Engineering'}</span>
            </div>
          </div>
        </div>

        {/* Rejection Details Box if REJECTED */}
        {isRejected && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#fca5a5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ef4444' }}>
              <ShieldAlert size={16} /> Administrator Feedback:
            </div>
            <p style={{ margin: 0, color: '#fee2e2' }}>
              {user?.rejectionReason || 'PRN/institutional identity could not be verified against institutional records.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleRefreshStatus}
            disabled={refreshing}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Checking Approval Status...' : 'Refresh Status'}
          </button>

          <a
            href={`mailto:support@mavilinking.com?subject=Account%20Approval%20Inquiry%20-${encodeURIComponent(user?.maviId || '')}`}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Mail size={16} /> Contact Institution Administrator
          </a>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '8px',
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default PendingApproval;
