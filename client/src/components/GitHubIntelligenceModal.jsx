import { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  RotateCcw,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Code2,
  Layers,
  GitPullRequest,
  Users,
  Package,
  Calendar,
  Flame,
  X,
  Search,
  ChevronRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const GitHubIntelligenceModal = ({ isOpen, onClose, username }) => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'repos' | 'scoring'

  const fetchIntelligence = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/platforms/github/intelligence');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load GitHub intelligence:', err);
      toast.error('Failed to load GitHub Developer Intelligence.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/platforms/github/sync');
      if (res.data?.success) {
        toast.success(res.data.message || 'GitHub intelligence updated!');
        fetchIntelligence();
      }
    } catch (err) {
      console.error('Sync failed:', err);
      toast.error(err.response?.data?.message || 'Synchronization failed.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIntelligence();
    }
  }, [isOpen, fetchIntelligence]);

  if (!isOpen) return null;

  const intelligence = data?.intelligence || {};
  const profile = intelligence.profile || {};
  const repositories = intelligence.repositories || [];
  const languages = intelligence.languages || { distribution: {} };
  const pullRequests = intelligence.pullRequests || {};
  const openSource = intelligence.openSource || {};
  const releases = intelligence.releases || {};
  const contributions = intelligence.contributions || {};
  const breakdown = data?.breakdown || {};
  const totalScore = data?.totalScore || data?.scores?.development || 0;

  const filteredRepos = repositories.filter((r) =>
    r.name?.toLowerCase().includes(repoSearch.toLowerCase()) ||
    r.language?.toLowerCase().includes(repoSearch.toLowerCase()) ||
    r.description?.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f111a',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="GitHub avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <GitBranch size={22} color="var(--accent-purple)" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif', fontWeight: '700' }}>
                  {profile.name || data?.username || username || 'GitHub Developer Intelligence'}
                </h3>
                {data?.isVerified && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.7rem',
                      color: 'var(--accent-cyan)',
                      background: 'rgba(6, 182, 212, 0.12)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: '600',
                    }}
                  >
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem' }}>
                <a
                  href={profile.profileUrl || `https://github.com/${data?.username || username}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  @{profile.username || data?.username || username} <ExternalLink size={11} />
                </a>

                {data?.lastSyncedAt && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    • Synced {new Date(data.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
              }}
            >
              <RotateCcw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync GitHub'}
            </button>

            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '0 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.01)',
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.75rem 0.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid var(--accent-purple)' : '2px solid transparent',
              color: activeTab === 'overview' ? 'white' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <TrendingUp size={15} /> Overview & Analytics
          </button>

          <button
            onClick={() => setActiveTab('repos')}
            style={{
              padding: '0.75rem 0.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'repos' ? '2px solid var(--accent-purple)' : '2px solid transparent',
              color: activeTab === 'repos' ? 'white' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <GitBranch size={15} /> Repositories ({repositories.length})
          </button>

          <button
            onClick={() => setActiveTab('scoring')}
            style={{
              padding: '0.75rem 0.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'scoring' ? '2px solid var(--accent-purple)' : '2px solid transparent',
              color: activeTab === 'scoring' ? 'white' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Code2 size={15} /> Score Breakdown ({totalScore} / 1000)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <RotateCcw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-purple)' }} />
              <p>Analyzing GitHub developer data...</p>
            </div>
          ) : !data?.linked ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <AlertCircle size={36} color="var(--accent-amber)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>No GitHub Account Linked</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '360px', margin: '0 auto' }}>
                Link your GitHub account in Account Linking to generate Developer Intelligence and unlock Development Score breakdown.
              </p>
            </div>
          ) : activeTab === 'overview' ? (
            /* OVERVIEW TAB */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Quick Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Public Repos</div>
                  <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit', marginTop: '0.2rem' }}>
                    {profile.publicRepos || 0}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Recent Commits (30d)</div>
                  <div style={{ color: 'var(--accent-purple)', fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit', marginTop: '0.2rem' }}>
                    {intelligence.commits?.recentCount30Days || 0}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Merged PRs</div>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit', marginTop: '0.2rem' }}>
                    {pullRequests.merged || 0}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Open Source Repos</div>
                  <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit', marginTop: '0.2rem' }}>
                    {openSource.externalReposContributed || 0}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Active Streak</div>
                  <div style={{ color: '#f59e0b', fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Flame size={16} /> {contributions.dailyStreak || 0}d
                  </div>
                </div>
              </div>

              {/* Language Distribution Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Code2 size={16} color="var(--accent-purple)" /> Repository Language Distribution
                  </h4>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {languages.totalDistinct || 0} languages detected
                  </span>
                </div>

                {Object.keys(languages.distribution || {}).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>No public repository language data detected.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {Object.entries(languages.distribution).slice(0, 6).map(([lang, info]) => (
                      <div key={lang}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600', color: 'white' }}>{lang}</span>
                          <span>{info.count} repo{info.count === 1 ? '' : 's'} ({info.percentage}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${info.percentage}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Collaboration & Delivery Signals */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <GitPullRequest size={15} color="var(--accent-cyan)" /> Pull Requests & Collaboration
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>PRs Opened:</span> <strong style={{ color: 'white' }}>{pullRequests.opened || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>PRs Merged:</span> <strong style={{ color: 'white' }}>{pullRequests.merged || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Merge Rate:</span> <strong style={{ color: 'var(--accent-cyan)' }}>{pullRequests.mergeRate}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Code Reviews:</span> <strong style={{ color: 'white' }}>{intelligence.reviews?.submitted || 0}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={15} color="#10b981" /> Software Delivery & Open Source
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Published Releases:</span> <strong style={{ color: 'white' }}>{releases.count || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>External Repos Contributed:</span> <strong style={{ color: 'white' }}>{openSource.externalReposContributed || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>External PRs:</span> <strong style={{ color: 'white' }}>{openSource.externalPRs || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>External Issues:</span> <strong style={{ color: 'white' }}>{openSource.externalIssues || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'repos' ? (
            /* REPOSITORIES TAB */
            <div>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search repositories by name, language, or topic..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              {filteredRepos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No repositories matching "{repoSearch}".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {filteredRepos.map((repo) => (
                    <div
                      key={repo.name}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => (e.target.style.color = 'var(--accent-purple)')}
                            onMouseLeave={(e) => (e.target.style.color = 'white')}
                          >
                            {repo.name}
                          </a>
                          {repo.isFork && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                              Fork
                            </span>
                          )}
                        </div>

                        {repo.description && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 0.5rem 0', lineHeight: '1.3' }}>
                            {repo.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {repo.language && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
                              {repo.language}
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Star size={12} color="#fbbf24" /> {repo.stars}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <GitFork size={12} /> {repo.forks}
                          </span>
                          {repo.updatedAt && (
                            <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* SCORING BREAKDOWN TAB */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ color: 'var(--accent-purple)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                    Canonical Development Score
                  </div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: '800', fontFamily: 'Outfit', marginTop: '0.15rem' }}>
                    {totalScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>/ 1000</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Calculated deterministically from verified repository and activity signals.
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '0.9rem' }}>
                    {totalScore >= 750 ? 'Diamond Level' : totalScore >= 600 ? 'Platinum Level' : totalScore >= 450 ? 'Gold Level' : 'Active Builder'}
                  </div>
                </div>
              </div>

              {/* 7-Dimension Transparent Score Breakdown Table */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Info size={16} color="var(--accent-cyan)" /> How is my score calculated?
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { label: 'Development Activity (25%)', score: breakdown.activityScore || 0, max: 250, desc: 'Evaluates commits and active push events with diminishing returns' },
                    { label: 'Project Experience (25%)', score: breakdown.projectScore || 0, max: 250, desc: 'Evaluates public repositories, project portfolios, and live URLs' },
                    { label: 'Technical Breadth (15%)', score: breakdown.breadthScore || 0, max: 150, desc: 'Evaluates language diversity and tech stack coverage' },
                    { label: 'Collaboration (15%)', score: breakdown.collaborationScore || 0, max: 150, desc: 'Evaluates merged PRs, PR participation, and review participation' },
                    { label: 'Open Source (10%)', score: breakdown.openSourceScore || 0, max: 100, desc: 'Evaluates contributions to external repositories and organizations' },
                    { label: 'Software Delivery (5%)', score: breakdown.deliveryScore || 0, max: 50, desc: 'Evaluates published releases and live deployed applications' },
                    { label: 'Consistency (5%)', score: breakdown.consistencyScore || 0, max: 50, desc: 'Evaluates consecutive active learning and development streaks' },
                  ].map((dim) => (
                    <div key={dim.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'white', fontWeight: '600' }}>{dim.label}</span>
                        <span style={{ color: 'var(--accent-purple)', fontWeight: '700' }}>
                          {dim.score} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>/ {dim.max}</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                        <div
                          style={{
                            width: `${Math.min(100, (dim.score / dim.max) * 100)}%`,
                            height: '100%',
                            background: 'var(--accent-purple)',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dim.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubIntelligenceModal;
