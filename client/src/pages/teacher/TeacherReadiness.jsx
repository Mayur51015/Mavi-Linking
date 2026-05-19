import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import api from '../../api/axios';

const TeacherReadiness = () => {
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        const res = await api.get('/teacher/readiness');
        setReadiness(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReadiness();
  }, []);

  const readinessColors = {
    excellent: '#10b981',
    good: '#3b82f6',
    developing: '#f59e0b',
    beginner: '#ef4444',
  };

  const readinessLabels = {
    excellent: '🟢 Excellent (700+)',
    good: '🔵 Good (400-699)',
    developing: '🟡 Developing (200-399)',
    beginner: '🔴 Beginner (0-199)',
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '160px' }} />)}
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={28} /> Placement Readiness
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {readiness?.scope?.college} — {readiness?.scope?.department} • {readiness?.totalStudents || 0} students analyzed
        </p>
      </header>

      {readiness && readiness.totalStudents > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Readiness Overview */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{readiness.totalStudents}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Total Students</div>
            </div>
            {Object.entries(readiness.readiness || {}).map(([tier, data]) => (
              <div key={tier} className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: readinessColors[tier] }}>{data.count}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{readinessLabels[tier]}</div>
                <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                  <div className="progress-bar-fill" style={{ width: `${data.percentage}%`, background: readinessColors[tier] }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{data.percentage}%</div>
              </div>
            ))}
          </div>

          {/* Average Scores */}
          {readiness.averages && (
            <div className="glass-card-static" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Department Average Scores</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {Object.entries(readiness.averages).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{val}/1000</span>
                    </div>
                    <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${(val / 1000) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No students found in your department to analyze placement readiness.
        </div>
      )}
    </TeacherLayout>
  );
};

export default TeacherReadiness;
