import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Eye, BadgeCheck } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import api from '../../api/axios';

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [scope, setScope] = useState({});
  const [batch, setBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (batch) params.set('batch', batch);
      const res = await api.get(`/teacher/students?${params}`);
      setStudents(res.data.data.students || []);
      setPagination(res.data.data.pagination || {});
      setScope(res.data.data.scope || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const viewStudentDetail = async (studentId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/teacher/students/${studentId}`);
      setSelectedStudent(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={26} style={{ color: 'var(--brand-blue)' }} /> Department Students
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {scope.college || 'Your College'} — {scope.department || 'Your Department'} • {pagination.total || students.length || 0} students enrolled
        </p>
      </header>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          className="input-field"
          placeholder="Filter by graduation batch (e.g. 2025)..."
          value={batch}
          onChange={e => setBatch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchStudents()}
          style={{ flex: 1, minWidth: '220px', maxWidth: '360px', marginBottom: 0 }}
        />
        <button onClick={fetchStudents} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
          <Search size={15} /> Search
        </button>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)} style={{ background: 'rgba(0,0,0,0.4)', zIndex: 120 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '580px',
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.35rem',
                  color: 'var(--text-primary)',
                  flexShrink: 0,
                }}
              >
                {selectedStudent.student?.name?.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  {selectedStudent.student?.name}
                  {selectedStudent.student?.isVerified && <BadgeCheck size={18} style={{ color: 'var(--brand-blue)' }} />}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem', margin: 0 }}>
                  {selectedStudent.student?.university?.department || scope.department} • Batch {selectedStudent.student?.university?.batch || 'N/A'}
                </p>
              </div>
            </div>

            {/* Scores Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {['overall', 'development', 'problemSolving', 'knowledge'].map(key => (
                <div
                  key={key}
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: '0.25rem', fontWeight: 500 }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedStudent.student?.scores?.[key] || 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Platforms */}
            {selectedStudent.student?.platforms && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Linked Accounts</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(selectedStudent.student.platforms).map(([platform, data]) =>
                    data?.username ? (
                      <span
                        key={platform}
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          padding: '0.25rem 0.6rem',
                          fontWeight: 500,
                        }}
                      >
                        {platform}: {data.username}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {selectedStudent.insight && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>AI Performance Summary</h4>
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {selectedStudent.insight.summary || 'No insights generated yet.'}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  window.location.href = `/dashboard/messages?chat=${selectedStudent.student?._id}`;
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Message Student
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn btn-outline"
                style={{ width: '100px' }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Students List */}
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        {loading ? (
          [1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius-sm)' }} />)
        ) : (
          students.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.9rem 1.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              <div style={{ width: '28px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>
                #{i + 1}
              </div>
              <div
                style={{
                  width: '34px',
                  height: '34px',
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
                  {s.preferredDomain || 'No domain declared'} • {s.experienceLevel || 'Beginner'} • Batch {s.university?.batch || 'N/A'}
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', marginRight: '0.5rem' }}>
                {s.scores?.overall || 0}
                <div style={{ fontSize: '0.68rem', fontWeight: 400, color: 'var(--text-muted)' }}>points</div>
              </div>
              <button
                onClick={() => viewStudentDetail(s._id)}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                <Eye size={14} /> View
              </button>
            </motion.div>
          ))
        )}
        {!loading && students.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
            No students found matching your department filter.
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudents;
