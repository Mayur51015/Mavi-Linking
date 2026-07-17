import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, BarChart3, Award, GraduationCap, Activity } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import api from '../../api/axios';

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, leaderboardRes] = await Promise.all([
          api.get('/teacher/stats'),
          api.get('/teacher/leaderboard?limit=5'),
        ]);
        setStats(statsRes.data.data);
        setLeaderboard(leaderboardRes.data.data || []);
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
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={28} /> Department Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {stats?.scope?.college || 'Your College'} — {stats?.scope?.department || 'Your Department'}
        </p>
      </header>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="stats-grid"
        style={{ marginBottom: '2rem' }}
      >
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Users size={28} style={{ color: 'var(--accent-purple)', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats?.totalStudents || 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Students</div>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <TrendingUp size={28} style={{ color: 'var(--accent-emerald)', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats?.averageScore || 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Average Score</div>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Activity size={28} style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{stats?.activeProfiles || 0}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Profiles</div>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Award size={28} style={{ color: 'var(--accent-amber)', marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>
            {Object.keys(stats?.domainDistribution || {}).length}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Career Domains</div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Domain Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card-static"
          style={{ padding: '1.5rem' }}
        >
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} style={{ color: 'var(--accent-purple)' }} /> Career Domain Distribution
          </h3>
          {stats?.domainDistribution && Object.entries(stats.domainDistribution).map(([domain, count]) => {
            const pct = stats.totalStudents ? Math.round((count / stats.totalStudents) * 100) : 0;
            const colors = {
              'Web Development': 'var(--accent-blue)',
              'AI/ML': 'var(--accent-purple)',
              'Competitive Programming': 'var(--accent-amber)',
              'Cybersecurity': 'var(--accent-red)',
              'App Development': 'var(--accent-cyan)',
              'Unspecified': 'var(--text-muted)',
            };
            return (
              <div key={domain} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{domain}</span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: colors[domain] || 'var(--gradient-primary)' }} />
                </div>
              </div>
            );
          })}
          {(!stats?.domainDistribution || Object.keys(stats.domainDistribution).length === 0) && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No domain data available</div>
          )}
        </motion.div>

        {/* Experience Level Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card-static"
          style={{ padding: '1.5rem' }}
        >
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-emerald)' }} /> Experience Levels
          </h3>
          {stats?.levelDistribution && Object.entries(stats.levelDistribution).map(([level, count]) => {
            const pct = stats.totalStudents ? Math.round((count / stats.totalStudents) * 100) : 0;
            const colors = { 'Beginner': 'var(--accent-red)', 'Intermediate': 'var(--accent-amber)', 'Advanced': 'var(--accent-emerald)', 'Unspecified': 'var(--text-muted)' };
            return (
              <div key={level} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{level}</span>
                  <span>{count} ({pct}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: colors[level] || 'var(--gradient-primary)' }} />
                </div>
              </div>
            );
          })}
          {(!stats?.levelDistribution || Object.keys(stats.levelDistribution).length === 0) && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No level data available</div>
          )}
        </motion.div>
      </div>

      {/* Top Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card-static"
        style={{ padding: '1.5rem' }}
      >
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} style={{ color: 'var(--accent-amber)' }} /> Top Performers
        </h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {leaderboard.map((s, i) => (
            <div key={s._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem' }}>
              <div style={{ width: '40px', fontSize: i < 3 ? '1.5rem' : '1rem', textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>{s.name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{s.name}</div>
                {s.preferredDomain && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.preferredDomain}</div>
                )}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit' }}>{s.scores?.overall || 0}</div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No students found in your department.</div>
          )}
        </div>
      </motion.div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
