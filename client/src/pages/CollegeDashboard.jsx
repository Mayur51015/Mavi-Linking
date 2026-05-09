import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, BarChart3, GraduationCap, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
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

  const readinessColors = { excellent: '#10b981', good: '#3b82f6', developing: '#f59e0b', beginner: '#ef4444' };

  return (
    <DashboardLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={28} /> College Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitor students, track placement readiness, view leaderboards.</p>
      </header>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input className="input-field" placeholder="University name..." value={university}
          onChange={e => setUniversity(e.target.value)} style={{ flex: 1, minWidth: '180px' }} />
        <input className="input-field" placeholder="Department..." value={department}
          onChange={e => setDepartment(e.target.value)} style={{ flex: 1, minWidth: '150px' }} />
        <button onClick={handleSearch} className="btn btn-primary btn-sm"><Search size={16} /> Search</button>
      </div>

      <div className="tabs">
        {[
          { key: 'students', label: 'Students', icon: <Users size={16} /> },
          { key: 'readiness', label: 'Placement Readiness', icon: <TrendingUp size={16} /> },
          { key: 'leaderboard', label: 'Leaderboard', icon: <BarChart3 size={16} /> },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Students */}
      {tab === 'students' && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {students.map((s, i) => (
            <div key={s._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
              <div style={{ width: '32px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>#{i + 1}</div>
              <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0 }}>{s.name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{s.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.university?.department || 'N/A'} • Batch {s.university?.batch || 'N/A'}</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit' }}>{s.scores?.overall || 0}</div>
            </div>
          ))}
          {students.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No students found. Try adjusting filters.</div>
          )}
        </div>
      )}

      {/* Readiness */}
      {tab === 'readiness' && readiness && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{readiness.totalStudents}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Total Students</div>
            </div>
            {Object.entries(readiness.readiness || {}).map(([tier, data]) => (
              <div key={tier} className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: readinessColors[tier] }}>{data.count}</div>
                <div style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{tier} ({data.percentage}%)</div>
                <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                  <div className="progress-bar-fill" style={{ width: `${data.percentage}%`, background: readinessColors[tier] }} />
                </div>
              </div>
            ))}
          </div>

          {readiness.averages && (
            <div className="glass-card-static" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Average Scores</h3>
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
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {leaderboard.map((s, i) => (
            <div key={s._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.5rem' }}>
              <div style={{ width: '40px', fontSize: i < 3 ? '1.5rem' : '1rem', textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>{s.name?.charAt(0)}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: '600' }}>{s.name}</div></div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit' }}>{s.scores?.overall || 0}</div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CollegeDashboard;
