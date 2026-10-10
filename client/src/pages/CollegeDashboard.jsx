import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, BarChart3, GraduationCap, TrendingUp, Loader2 } from 'lucide-react';
import InstitutionAdminLayout from '../layouts/InstitutionAdminLayout';
import api from '../api/axios';

const CollegeDashboard = () => {
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [students, setStudents] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tab, setTab] = useState('students');
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (university) params.set('university', university);
      if (department) params.set('department', department);
      const res = await api.get(`/education/students?${params}`);
      setStudents(res.data.data.students || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchReadiness = async () => {
    try {
      const params = new URLSearchParams();
      if (university) params.set('university', university);
      if (department) params.set('department', department);
      const res = await api.get(`/education/readiness?${params}`);
      setReadiness(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchLeaderboard = async () => {
    try {
      const params = new URLSearchParams();
      if (university) params.set('university', university);
      if (department) params.set('department', department);
      const res = await api.get(`/education/leaderboard?${params}`);
      setLeaderboard(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (tab === 'students') fetchStudents();
    if (tab === 'readiness') fetchReadiness();
    if (tab === 'leaderboard') fetchLeaderboard();
  }, [tab]);

  const handleSearch = () => {
    if (tab === 'students') fetchStudents();
    if (tab === 'readiness') fetchReadiness();
    if (tab === 'leaderboard') fetchLeaderboard();
  };

  const readinessColors = { excellent: '#059669', good: '#2563EB', developing: '#D97706', beginner: '#DC2626' };

  return (
    <InstitutionAdminLayout>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={24} style={{ color: 'var(--brand-blue)' }} /> College & Campus Oversight
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Monitor enrolled student cohorts, evaluate placement readiness distributions, and inspect department leaderboards.</p>
      </header>

      {/* Filters */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input-field" placeholder="University / Campus name..." value={university}
          onChange={e => setUniversity(e.target.value)} style={{ flex: '1 1 180px', minWidth: '160px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
        <input className="input-field" placeholder="Department..." value={department}
          onChange={e => setDepartment(e.target.value)} style={{ flex: '1 1 150px', minWidth: '140px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
        <button onClick={handleSearch} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Search size={15} /> Search
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'students', label: 'Students Roster', icon: <Users size={15} /> },
          { key: 'readiness', label: 'Placement Readiness', icon: <TrendingUp size={15} /> },
          { key: 'leaderboard', label: 'Department Leaderboard', icon: <BarChart3 size={15} /> },
        ].map(t => {
          const isSelected = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.45rem 0.875rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 600 : 500,
                border: isSelected ? '1px solid var(--brand-blue)' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                color: isSelected ? 'var(--brand-blue)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Students */}
      {tab === 'students' && (
        <div style={{ display: 'grid', gap: '0.625rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--brand-blue)', margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.875rem' }}>Loading student records...</div>
            </div>
          ) : (
            students.map((s, i) => (
              <div key={s._id} style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem' }}>
                <div style={{ width: '28px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8125rem' }}>#{i + 1}</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
                  {s.name?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.university?.department || 'N/A'} • Batch {s.university?.batch || 'N/A'}</div>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--brand-blue)' }}>{s.scores?.overall || 0} pts</div>
              </div>
            ))
          )}
          {students.length === 0 && !loading && (
            <div style={{ background: '#FFFFFF', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No students found for this query. Try adjusting your university or department filter.
            </div>
          )}
        </div>
      )}

      {/* Readiness */}
      {tab === 'readiness' && readiness && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{readiness.totalStudents}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>Total Enrolled Students</div>
            </div>
            {Object.entries(readiness.readiness || {}).map(([tier, data]) => (
              <div key={tier} style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: readinessColors[tier] || 'var(--text-primary)' }}>{data.count}</div>
                <div style={{ color: 'var(--text-secondary)', textTransform: 'capitalize', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{tier} ({data.percentage}%)</div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.625rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: `${data.percentage}%`, height: '100%', background: readinessColors[tier] || 'var(--brand-blue)', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>

          {readiness.averages && (
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Cohort Average Scores</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {Object.entries(readiness.averages).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}/1000</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{ width: `${(val / 1000) * 100}%`, height: '100%', background: 'var(--brand-blue)', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {leaderboard.map((s, i) => (
            <div key={s._id} style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem' }}>
              <div style={{ width: '32px', textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                #{i + 1}
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
                {s.name?.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.university?.department || 'N/A'}</div>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--brand-blue)' }}>{s.scores?.overall || 0} pts</div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div style={{ background: '#FFFFFF', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No leaderboard data available for the current selection.
            </div>
          )}
        </div>
      )}
    </InstitutionAdminLayout>
  );
};

export default CollegeDashboard;
