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
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Talent Discovery Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Search, compare, and recruit top pre-assessed candidate talent.</p>
      </header>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="stats-grid"
        style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}
      >
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Available Candidates</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats?.totalCandidates || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Verified in pool</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Bookmarked Candidates</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)' }}>
              <Bookmark size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats?.bookmarkedCount || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Saved for evaluation</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Avg. Candidate Score</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{stats?.averageScore || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Across verified profiles</div>
        </div>
      </motion.div>

      {/* Pipeline Stats */}
      {pipelineStats && pipelineStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitPullRequest size={16} style={{ color: 'var(--brand-blue)' }} /> Recruitment Pipeline Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {['Applied', 'Under Review', 'Interview Scheduled', 'Offer Received', 'Offer Accepted', 'Placed', 'Rejected'].map(s => (
              <div key={s} style={{
                padding: '0.75rem',
                borderRadius: '6px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {pipelineStats[s] || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{s}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Access Scope Info */}
      {(stats?.allowedColleges?.length > 0 || stats?.allowedDepartments?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={16} style={{ color: 'var(--brand-blue)' }} /> Authorized Scope
          </h3>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {stats.allowedColleges?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Colleges</div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {stats.allowedColleges.map((c, i) => (
                    <span key={i} className="badge badge-primary">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {stats.allowedDepartments?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase' }}>Departments</div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {stats.allowedDepartments.map((d, i) => (
                    <span key={i} style={{ display: 'inline-flex', padding: '0.2rem 0.5rem', background: '#F3F4F6', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>{d}</span>
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} style={{ color: 'var(--brand-blue)' }} /> Highest Rated Profiles
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.topCandidates.map((c, i) => (
              <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 0.875rem', borderRadius: '6px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '24px', textAlign: 'center', fontWeight: '600', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  #{i + 1}
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8125rem' }}>
                  {c.name?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.university?.name} — {c.university?.department}</div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--brand-blue)' }}>{c.scores?.overall || 0}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </RecruiterLayout>
  );
};

export default RecruiterOverview;
