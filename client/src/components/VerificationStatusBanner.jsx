import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, Clock, Lock, RefreshCw, ShieldAlert, Sparkles, Building2, UserCheck } from 'lucide-react';

const VerificationStatusBanner = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  if (!user) return null;

  const isPending = user.accountStatus === 'PENDING_ADMIN_APPROVAL' || user.accountStatus === 'PENDING_VERIFICATION';
  const isRejected = user.accountStatus === 'REJECTED';
  const isActive = user.accountStatus === 'ACTIVE';

  if (!isPending && !isRejected) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      if (toast?.success) toast.success('Account status updated!');
    } catch (err) {
      if (toast?.error) toast.error('Failed to refresh status.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Banner Container */}
      <div
        style={{
          background: isRejected ? 'rgba(239, 68, 68, 0.08)' : 'rgba(234, 179, 8, 0.08)',
          border: `1px solid ${isRejected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: '1', minWidth: '280px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRejected ? '#f87171' : '#facc15',
                flexShrink: 0,
              }}
            >
              {isRejected ? <ShieldAlert size={24} /> : <Clock size={24} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {isRejected ? '🔴 Account Verification Rejected' : '🟡 Account Verification Pending'}
                </h3>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: isRejected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                    color: isRejected ? 'var(--accent-red)' : 'var(--accent-amber)',
                  }}
                >
                  {isRejected ? 'Rejected' : 'Pending Admin Verification'}
                </span>
              </div>

              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {isRejected
                  ? (user.rejectionReason || 'Your institutional account verification was not approved by your administrator. Please contact your institution administrator.')
                  : 'Your account has been created successfully! Your institutional information is currently being reviewed by your administrator. Some features will become available after your account is approved.'}
              </p>

              {/* Institutional Specs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>MAVI ID: </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-purple)' }}>{user.maviId || 'N/A'}</span>
                </div>
                {user.prn && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>PRN: </span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{user.prn}</span>
                  </div>
                )}
                {user.university?.name && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Institution: </span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.university.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Status
          </button>
        </div>

        {/* 4-Step Verification Tracker */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: `1px solid ${isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)'}` }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Verification Progress
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {/* Step 1: Account Created */}
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '10px',
                padding: '0.65rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Account Created</div>
                <div style={{ fontSize: '0.68rem', color: '#4ade80' }}>Completed</div>
              </div>
            </div>

            {/* Step 2: Email Verified */}
            <div
              style={{
                background: user.emailVerified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                border: `1px solid ${user.emailVerified ? 'rgba(34, 197, 94, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
                borderRadius: '10px',
                padding: '0.65rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {user.emailVerified ? <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} /> : <Clock size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Email Verified</div>
                <div style={{ fontSize: '0.68rem', color: user.emailVerified ? '#4ade80' : 'var(--accent-amber)' }}>
                  {user.emailVerified ? 'Verified' : 'Pending'}
                </div>
              </div>
            </div>

            {/* Step 3: Admin Verification */}
            <div
              style={{
                background: isRejected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                border: `1px solid ${isRejected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
                borderRadius: '10px',
                padding: '0.65rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {isRejected ? <ShieldAlert size={16} style={{ color: 'var(--accent-red)', flexShrink: 0 }} /> : <Clock size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>Admin Verification</div>
                <div style={{ fontSize: '0.68rem', color: isRejected ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                  {isRejected ? 'Rejected' : 'In Review'}
                </div>
              </div>
            </div>

            {/* Step 4: Full Access */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '0.65rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: 0.75,
              }}
            >
              <Lock size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Full Access</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Locked</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationStatusBanner;
