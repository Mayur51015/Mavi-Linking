import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, BadgeCheck } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import api from '../../api/axios';

const TeacherLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/teacher/leaderboard?limit=50');
        setLeaderboard(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <TeacherLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={28} /> Department Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Top performers from your department, ranked by overall score.</p>
      </header>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {loading ? (
          [1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: '64px' }} />)
        ) : (
          leaderboard.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card"
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.875rem 1.5rem',
                borderLeft: i < 3 ? `3px solid ${i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32'}` : '3px solid transparent',
              }}
            >
              <div style={{ width: '40px', fontSize: i < 3 ? '1.5rem' : '1rem', textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>{s.name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {s.name}
                  {s.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {s.preferredDomain || 'No domain specified'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dev</div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{s.scores?.development || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PS</div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{s.scores?.problemSolving || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Know</div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{s.scores?.knowledge || 0}</div>
                </div>
                <div style={{
                  fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit',
                  background: i < 3 ? 'var(--gradient-primary)' : 'none',
                  WebkitBackgroundClip: i < 3 ? 'text' : 'unset',
                  WebkitTextFillColor: i < 3 ? 'transparent' : 'var(--text-primary)',
                }}>
                  {s.scores?.overall || 0}
                </div>
              </div>
            </motion.div>
          ))
        )}
        {!loading && leaderboard.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No ranked students found in your department.
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherLeaderboard;
