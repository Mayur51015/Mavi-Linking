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
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Award size={26} style={{ color: 'var(--brand-blue)' }} /> Department Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Top performing students in your department ranked by overall verified score.
        </p>
      </header>

      <div style={{ display: 'grid', gap: '0.6rem' }}>
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius-sm)' }} />)
        ) : (
          leaderboard.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              <div style={{
                width: '32px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: i < 3 ? '1.1rem' : '0.85rem',
                color: i === 0 ? '#D97706' : i === 1 ? '#4B5563' : i === 2 ? '#B45309' : 'var(--text-muted)',
              }}>
                {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : `#${i + 1}`}
              </div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
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
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {s.name}
                  {s.isVerified && <BadgeCheck size={15} style={{ color: 'var(--brand-blue)' }} />}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {s.preferredDomain || 'General Software Engineering'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', display: 'none' }} className="hide-mobile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dev</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.scores?.development || 0}</div>
                </div>
                <div style={{ textAlign: 'center', display: 'none' }} className="hide-mobile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Problem Solving</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.scores?.problemSolving || 0}</div>
                </div>
                <div style={{ textAlign: 'center', display: 'none' }} className="hide-mobile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Knowledge</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{s.scores?.knowledge || 0}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {s.scores?.overall || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Overall Score</div>
                </div>
              </div>
            </motion.div>
          ))
        )}
        {!loading && leaderboard.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
            No ranked students found in your department.
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherLeaderboard;
