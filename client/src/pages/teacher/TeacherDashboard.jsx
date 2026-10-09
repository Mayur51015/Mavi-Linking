import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, BarChart3, Award, GraduationCap, Activity, AlertCircle } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import api from '../../api/axios';

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [mentoringAlerts, setMentoringAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, leaderboardRes, alertsRes] = await Promise.all([
          api.get('/teacher/stats'),
          api.get('/teacher/leaderboard?limit=5'),
          api.get('/teacher/mentoring-alerts'),
        ]);
        setStats(statsRes.data.data);
        setLeaderboard(leaderboardRes.data.data || []);
        setMentoringAlerts(alertsRes.data.data || []);
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const readinessColors = { excellent: '#10b981', good: '#3b82f6', developing: '#f59e0b', beginner: '#ef4444' };

  if (loading) {
    return (
      <TeacherLayout>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '300px' }} />)}
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <GraduationCap size={26} style={{ color: 'var(--brand-blue)' }} /> Department Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {stats?.scope?.college || 'Your College'} — {stats?.scope?.department || 'Your Department'}
        </p>
      </header>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Total Students</span>
            <span style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)' }}>
              <Users size={18} />
            </span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {stats?.totalStudents || 0}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>Enrolled in department</div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Average Score</span>
            <span style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {stats?.averageScore || 0}
            <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/ 1000</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>Across all verified skills</div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Active Profiles</span>
            <span style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)' }}>
              <Activity size={18} />
            </span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {stats?.activeProfiles || 0}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>Profiles updated this semester</div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Career Domains</span>
            <span style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)' }}>
              <Award size={18} />
            </span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {Object.keys(stats?.domainDistribution || {}).length}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>Specialization tracks</div>
        </div>
      </motion.div>

      {/* Distributions Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Career Domain Distribution */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--brand-blue)' }} /> Career Domain Distribution
          </h3>
          {stats?.domainDistribution && Object.keys(stats.domainDistribution).length > 0 ? (
            Object.entries(stats.domainDistribution).map(([domain, count]) => {
              const pct = stats.totalStudents ? Math.round((count / stats.totalStudents) * 100) : 0;
              return (
                <div key={domain} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{domain}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-blue)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No domain data available</div>
          )}
        </div>

        {/* Experience Level Distribution */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--brand-blue)' }} /> Experience Levels
          </h3>
          {stats?.levelDistribution && Object.keys(stats.levelDistribution).length > 0 ? (
            Object.entries(stats.levelDistribution).map(([level, count]) => {
              const pct = stats.totalStudents ? Math.round((count / stats.totalStudents) * 100) : 0;
              return (
                <div key={level} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{level}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-blue)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No level data available</div>
          )}
        </div>
      </div>

      {/* Top Students and Mentoring Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Top Performers */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} style={{ color: 'var(--brand-blue)' }} /> Top Performers
          </h3>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {leaderboard.map((s, i) => (
              <div
                key={s._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ width: '28px', fontSize: '0.85rem', fontWeight: 700, color: i < 3 ? 'var(--brand-blue)' : 'var(--text-muted)', textAlign: 'center' }}>
                  #{i + 1}
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    flexShrink: 0,
                  }}
                >
                  {s.name?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </div>
                  {s.preferredDomain && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.preferredDomain}</div>
                  )}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {s.scores?.overall || 0}
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No students found in your department.
              </div>
            )}
          </div>
        </div>

        {/* Mentoring Alerts */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--accent-red)' }} /> Mentoring Alerts
          </h3>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {mentoringAlerts.map((s) => (
              <div
                key={s._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    flexShrink: 0,
                  }}
                >
                  {s.name?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 500 }}>
                    {s.aiAnalysis?.hiringRecommendation || 'Requires Academic Guidance'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {s.scores?.overall || 0} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 1000</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Readiness: {s.placementReadinessScore || 0}%
                  </div>
                </div>
              </div>
            ))}
            {mentoringAlerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No active alerts. All students are meeting department benchmarks.
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
