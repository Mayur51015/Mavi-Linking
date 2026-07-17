import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Bookmark, TrendingUp, Search, Building2, BarChart3, GitPullRequest } from 'lucide-react';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import PlacementBadge from '../../components/PlacementBadge';
import api from '../../api/axios';

const RecruiterOverview = () => {
  const [stats, setStats] = useState(null);
  const [pipelineStats, setPipelineStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, plStatsRes] = await Promise.all([
          api.get('/recruiter/stats'),
          api.get('/placement/stats').catch(() => ({ data: { data: null } })),
        ]);
        setStats(statsRes.data.data);
        setPipelineStats(plStatsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <RecruiterLayout>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '140px' }} />)}
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome to Talent Discovery</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Search, compare, and recruit top developer talent.</p>
      </header>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="stats-grid"
        style={{ marginBottom: '2rem' }}
      >
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Users size={28} style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats?.totalCandidates || 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Available Candidates</div>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Bookmark size={28} style={{ color: 'var(--accent-purple)', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats?.bookmarkedCount || 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Bookmarked</div>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <TrendingUp size={28} style={{ color: 'var(--accent-emerald)', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats?.averageScore || 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Avg. Candidate Score</div>
        </div>
      </motion.div>

      {/* Pipeline Stats */}
      {pipelineStats && pipelineStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card-static"
          style={{ padding: '1.5rem', marginBottom: '2rem' }}
        >
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitPullRequest size={20} style={{ color: 'var(--accent-emerald)' }} /> Pipeline Overview
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {['Applied', 'Under Review', 'Interview Scheduled', 'Offer Received', 'Offer Accepted', 'Placed', 'Rejected'].map(s => {
              const colors = {
                'Applied': 'var(--text-muted)',
                'Under Review': 'var(--accent-amber)',
                'Interview Scheduled': 'var(--accent-blue)',
                'Offer Received': 'var(--accent-purple)',
                'Offer Accepted': 'var(--accent-cyan)',
                'Placed': 'var(--accent-emerald)',
                'Rejected': 'var(--accent-red)',
              };
              return (
                <div key={s} style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  minWidth: '100px',
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit', color: colors[s] }}>
                    {pipelineStats[s] || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Access Scope Info */}
      {(stats?.allowedColleges?.length > 0 || stats?.allowedDepartments?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-static"
          style={{ padding: '1.5rem', marginBottom: '2rem' }}
        >
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} style={{ color: 'var(--accent-cyan)' }} /> Your Access Scope
          </h3>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {stats.allowedColleges?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Colleges</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {stats.allowedColleges.map((c, i) => (
                    <span key={i} className="badge badge-primary">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {stats.allowedDepartments?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Departments</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {stats.allowedDepartments.map((d, i) => (
                    <span key={i} className="badge badge-emerald">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Top Candidates */}
      {stats?.topCandidates?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-static"
          style={{ padding: '1.5rem' }}
        >
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} style={{ color: 'var(--accent-purple)' }} /> Top Candidates
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {stats.topCandidates.map((c, i) => (
              <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ width: '28px', textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div className="avatar-gradient" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{c.name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.university?.name} — {c.university?.department}</div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit' }}>{c.scores?.overall || 0}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </RecruiterLayout>
  );
};

export default RecruiterOverview;
