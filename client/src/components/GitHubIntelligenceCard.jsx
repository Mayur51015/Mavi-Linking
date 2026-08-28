import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  ArrowRight,
  Code2,
  FolderGit2,
  Activity as ActivityIcon,
  Check,
  Link as LinkIcon,
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

  const isLinked = Boolean(data?.linked && (data?.username || user?.githubUsername));
  const username = data?.username || user?.githubUsername || '';
  const intelligence = data?.intelligence || {};
  const repositoriesCount = intelligence?.repositories?.length ?? intelligence?.profile?.publicRepos ?? 0;
  const languageDistribution = intelligence?.languages?.distribution || {};
  const languagesCount = Object.keys(languageDistribution).length;

  let activityStatus = 'Active';
  if (intelligence?.commits?.recentCount30Days !== undefined && intelligence?.commits?.recentCount30Days !== null) {
    activityStatus = intelligence.commits.recentCount30Days > 0 
      ? `${intelligence.commits.recentCount30Days} commits`
      : 'Active';
  } else if (intelligence?.contributions?.level) {
    activityStatus = intelligence.contributions.level;
  }

  const devScore = data?.totalScore ?? data?.scores?.development ?? externalScores?.development ?? user?.scores?.development ?? 0;
  const scorePercent = Math.min(100, Math.max(0, Math.round((devScore / 1000) * 100)));

  const formatLastSynced = () => {
    if (!data?.lastSyncedAt) return null;
    const minutes = data.freshnessMinutes !== undefined ? data.freshnessMinutes : Math.floor((Date.now() - new Date(data.lastSyncedAt).getTime()) / 60000);
    if (minutes < 1) return 'Synced just now';
    if (minutes < 60) return `Synced ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Synced ${hours}h ago`;
    return `Synced ${new Date(data.lastSyncedAt).toLocaleDateString()}`;
  };

  const syncLabel = formatLastSynced();

  return (
    <>
      <div
        className="glass-card animate-fade-in"
        style={{
          padding: '1.15rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.85rem',
          border: '1px solid rgba(168, 85, 247, 0.16)',
          background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.9) 0%, rgba(39, 39, 42, 0.6) 100%)',
          borderRadius: '12px',
        }}
      >
        {/* Compact Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <GitBranch size={16} style={{ color: '#c084fc' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                GitHub Intelligence
              </h3>
            </div>
            {isLinked && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #a1a1aa)', fontWeight: 500 }}>
                  @{username}
                </span>
                {syncLabel && (
                  <span style={{ fontSize: '0.72rem', color: data?.isFresh !== false ? 'var(--text-muted, #71717a)' : 'var(--accent-amber, #f59e0b)' }}>
                    • {syncLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {isLinked ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.22)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <Check size={11} strokeWidth={3} /> Connected
            </span>
          ) : (
            <span
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
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
            <div style={{ height: '42px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
            <div style={{ height: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
          </div>
        ) : !isLinked ? (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(24, 24, 27, 0.5)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <p style={{ color: 'var(--text-muted, #a1a1aa)', fontSize: '0.78rem', margin: 0, lineHeight: 1.4 }}>
              Link GitHub to track repos, commits, and compute your development score.
            </p>
            <button
              onClick={() => navigate('/account-linking')}
              className="btn btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                padding: '0.3rem 0.65rem',
              }}
              aria-label="Link GitHub Account"
            >
              <LinkIcon size={12} /> Link GitHub Account
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Compact 3-Column Statistics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.4rem',
                padding: '0.45rem 0.5rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #a1a1aa)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Repos
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                  {repositoriesCount}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.06)', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #a1a1aa)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Languages
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                  {languagesCount}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #a1a1aa)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Activity
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', fontFamily: 'Outfit, sans-serif', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activityStatus}
                </div>
              </div>
            </div>

            {/* Development Score Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #a1a1aa)', fontWeight: 500 }}>
                  Development Score
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                  {devScore} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #a1a1aa)', fontWeight: 400 }}>/ 1000</span>
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${scorePercent}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Compact Action Button */}
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-outline"
              style={{
                width: '100%',
                padding: '0.4rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                borderColor: 'rgba(168, 85, 247, 0.35)',
                color: '#d8b4fe',
                background: 'rgba(168, 85, 247, 0.06)',
                marginTop: '0.15rem',
              }}
              aria-label="View GitHub Intelligence"
            >
              View GitHub Intelligence <ArrowRight size={13} />
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
