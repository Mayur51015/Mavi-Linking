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

  const tierMeta = {
    excellent: { label: 'Excellent (700+)', color: '#16A34A', bg: '#DCFCE7' },
    good: { label: 'Good (400-699)', color: '#2563EB', bg: '#EFF6FF' },
    developing: { label: 'Developing (200-399)', color: '#D97706', bg: '#FEF3C7' },
    beginner: { label: 'Beginner (0-199)', color: '#DC2626', bg: '#FEE2E2' },
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <TrendingUp size={26} style={{ color: 'var(--brand-blue)' }} /> Placement Readiness Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {readiness?.scope?.college} — {readiness?.scope?.department} • {readiness?.totalStudents || 0} students analyzed
        </p>
      </header>

      {readiness && readiness.totalStudents > 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* Readiness Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>Total Evaluated</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {readiness.totalStudents}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Department cohort</div>
            </div>

            {Object.entries(readiness.readiness || {}).map(([tier, data]) => {
              const meta = tierMeta[tier] || { label: tier, color: 'var(--text-primary)', bg: 'var(--bg-subtle)' };
              return (
                <div
                  key={tier}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.percentage}%</span>
                  </div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {data.count}
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', marginTop: '0.65rem', overflow: 'hidden' }}>
                    <div style={{ width: `${data.percentage}%`, height: '100%', background: meta.color, borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Average Scores */}
          {readiness.averages && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                Department Average Skill Performance
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {Object.entries(readiness.averages).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ 1000</span></span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(val / 1000) * 100}%`, height: '100%', background: 'var(--brand-blue)', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
          No students found in your department to analyze placement readiness.
        </div>
      )}
    </TeacherLayout>
  );
};

export default TeacherReadiness;
