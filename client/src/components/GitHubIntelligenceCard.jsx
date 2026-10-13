import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  ArrowRight,
  Code2,
  FolderGit2,
  Check,
  Link as LinkIcon,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import api from '../api/axios';
import GitHubIntelligenceModal from './GitHubIntelligenceModal';
import { AuthContext } from '../context/AuthContext';

const GitHubIntelligenceCard = ({ externalScores = null }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchIntelligence = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/platforms/github/intelligence');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load GitHub intelligence summary:', err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  // Derive verified connection states
  const connectionState = data?.connectionState || (data?.linked ? 'connected' : 'not_connected');
  const isLinked = Boolean(data?.linked && (connectionState === 'connected' || connectionState === 'sync_failed'));
  const isRevoked = connectionState === 'revoked';
  const isPending = connectionState === 'pending';
  const isSyncFailed = connectionState === 'sync_failed';

  const username = isLinked ? (data?.username || null) : null;
  const intelligence = data?.intelligence || {};

  const repositoriesCount = typeof intelligence?.repositories?.length === 'number'
    ? intelligence.repositories.length
    : (typeof intelligence?.profile?.publicRepos === 'number' ? intelligence.profile.publicRepos : null);

  const languageDistribution = intelligence?.languages?.distribution || {};
  const languagesCount = intelligence?.languages?.totalDistinct !== undefined && intelligence?.languages?.totalDistinct !== null
    ? intelligence.languages.totalDistinct
    : Object.keys(languageDistribution).length;

  const commitsCount = (intelligence?.commits?.recentCount30Days !== undefined && intelligence?.commits?.recentCount30Days !== null)
    ? intelligence.commits.recentCount30Days
    : (intelligence?.commits?.available ? 0 : null);

  const devScore = (data?.totalScore !== undefined && data?.totalScore !== null)
    ? data.totalScore
    : (data?.scores?.development !== undefined && data?.scores?.development !== null && data?.scores?.development > 0
        ? data.scores.development
        : null);

  const scorePercent = devScore !== null ? Math.min(100, Math.max(0, Math.round((devScore / 1000) * 100))) : 0;

  const formatLastSynced = () => {
    if (!data?.lastSyncedAt) return null;
    const minutes = (data.freshnessMinutes !== undefined && data.freshnessMinutes !== null)
      ? data.freshnessMinutes
      : Math.floor((Date.now() - new Date(data.lastSyncedAt).getTime()) / 60000);
    if (minutes < 1) return 'Synced just now';
    if (minutes < 60) return `Synced ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Synced ${hours}h ago`;
    return `Synced ${new Date(data.lastSyncedAt).toLocaleDateString()}`;
  };

  const syncLabel = isLinked ? formatLastSynced() : null;

  return (
    <>
      <div
        className="erp-card animate-fade-in"
        style={{
          padding: '1.25rem 1.4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.85rem',
          height: '410px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Compact Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, color: 'var(--text-primary)' }}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                GitHub Intelligence
              </h3>
            </div>
            {isLinked && username && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  @{username}
                </span>
                {syncLabel && (
                  <span style={{ fontSize: '0.72rem', color: data?.isFresh !== false ? 'var(--text-muted)' : 'var(--accent-amber)' }}>
                    • {syncLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {isLinked && !isSyncFailed ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22C55E',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <Check size={11} strokeWidth={3} /> Connected
            </span>
          ) : isSyncFailed ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber, #F59E0B)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <AlertCircle size={11} /> Sync Failed
            </span>
          ) : isRevoked ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <AlertCircle size={11} /> Authorization Revoked
            </span>
          ) : isPending ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-amber, #F59E0B)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Pending
            </span>
          ) : (
            <span
              style={{
                background: 'rgba(107, 114, 128, 0.15)',
                color: 'var(--text-muted, #9CA3AF)',
                border: '1px solid var(--border-color)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Not Connected
            </span>
          )}
        </div>

        {/* Card Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.25rem 0' }}>
            <div style={{ height: '42px', background: 'var(--bg-tertiary)', borderRadius: '6px' }} />
            <div style={{ height: '24px', background: 'var(--bg-subtle)', borderRadius: '6px' }} />
          </div>
        ) : !isLinked ? (
          <div
            style={{
              flex: 1,
              padding: '1.25rem 1rem',
              borderRadius: '10px',
              background: 'var(--bg-subtle)',
              border: '1px dashed var(--border-color)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              minHeight: '160px',
            }}
          >
            {isRevoked ? (
              <>
                <AlertCircle size={28} color="#EF4444" style={{ opacity: 0.8 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                  GitHub access authorization has expired or been revoked. Reconnect your account to resume intelligence sync.
                </p>
                <button
                  onClick={() => navigate('/account-linking')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  aria-label="Reconnect GitHub Account"
                >
                  <RotateCcw size={13} style={{ color: 'var(--brand-blue)' }} /> Reconnect GitHub Account
                </button>
              </>
            ) : isPending ? (
              <>
                <AlertCircle size={28} color="var(--accent-amber, #F59E0B)" style={{ opacity: 0.8 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                  GitHub connection is pending verification. Complete verification to activate intelligence.
                </p>
                <button
                  onClick={() => navigate('/account-linking')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  aria-label="Verify GitHub Account"
                >
                  <LinkIcon size={13} style={{ color: 'var(--brand-blue)' }} /> Verify in Account Linking
                </button>
              </>
            ) : (
              <>
                <GitBranch size={28} style={{ opacity: 0.4, color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                  Link your GitHub account to track repositories, commit activity, and calculate your verified development score.
                </p>
                <button
                  onClick={() => navigate('/account-linking')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  aria-label="Connect GitHub Account"
                >
                  <LinkIcon size={13} style={{ color: 'var(--brand-blue)' }} /> Connect GitHub
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Compact 3-Column Statistics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.4rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Repos
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                  {repositoriesCount !== null ? repositoriesCount : '—'}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Languages
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                  {languagesCount !== null ? languagesCount : '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Commits
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                  {commitsCount !== null ? commitsCount : '—'}
                </div>
              </div>
            </div>

            {/* Development Score Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Development Score
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
                  {devScore !== null ? (
                    <>
                      {devScore} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ 1000</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Not available</span>
                  )}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '5px',
                  borderRadius: '3px',
                  background: 'var(--border-color)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${scorePercent}%`,
                    height: '100%',
                    borderRadius: '3px',
                    background: 'var(--brand-blue)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Compact Action Button */}
            <button
              onClick={() => setModalOpen(true)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-blue)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-subtle)';
              }}
            >
              <span>Full Intelligence Report</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Existing Detailed Modal */}
      <GitHubIntelligenceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        username={username}
        onSyncSuccess={fetchIntelligence}
      />
    </>
  );
};

export default GitHubIntelligenceCard;
