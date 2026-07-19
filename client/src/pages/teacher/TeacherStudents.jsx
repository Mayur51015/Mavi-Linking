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
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={28} /> My Students
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {scope.college || 'Your College'} — {scope.department || 'Your Department'} • {pagination.total || 0} students
        </p>
      </header>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          className="input-field"
          placeholder="Filter by batch (e.g., 2025)..."
          value={batch}
          onChange={e => setBatch(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <button onClick={fetchStudents} className="btn btn-primary btn-sm">
          <Search size={16} /> Search
        </button>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="avatar-gradient" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
                {selectedStudent.student?.name?.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedStudent.student?.name}
                  {selectedStudent.student?.isVerified && <BadgeCheck size={18} style={{ color: 'var(--accent-cyan)' }} />}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {selectedStudent.student?.university?.department} • Batch {selectedStudent.student?.university?.batch || 'N/A'}
                </p>
              </div>
            </div>

            {/* Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {['overall', 'development', 'problemSolving', 'knowledge'].map(key => (
                <div key={key} className="glass-card-static" style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: '0.25rem' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>
                    {selectedStudent.student?.scores?.[key] || 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Platforms */}
            {selectedStudent.student?.platforms && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Linked Platforms</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(selectedStudent.student.platforms).map(([platform, data]) => 
                    data?.username ? (
                      <span key={platform} className="badge badge-primary">{platform}: {data.username}</span>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* AI Insight */}
            {selectedStudent.insight && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>AI Insights</h4>
                <div className="glass-card-static" style={{ padding: '1rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {selectedStudent.insight.summary || 'No insights generated yet.'}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                window.location.href = `/dashboard/messages?chat=${selectedStudent.student?._id}`;
              }}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '0.75rem' }}
            >
              Message Student
            </button>
            <button onClick={() => setSelectedStudent(null)} className="btn btn-outline" style={{ width: '100%' }}>
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Students List */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {loading ? (
          [1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '72px' }} />)
        ) : (
          students.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}
            >
              <div style={{ width: '32px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>#{i + 1}</div>
              <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0 }}>
                {s.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {s.name}
                  {s.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {s.preferredDomain || 'No domain'} • {s.experienceLevel || 'No level'} • Batch {s.university?.batch || 'N/A'}
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit' }}>{s.scores?.overall || 0}</div>
              <button onClick={() => viewStudentDetail(s._id)} className="btn btn-ghost btn-sm">
                <Eye size={16} /> View
              </button>
            </motion.div>
          ))
        )}
        {!loading && students.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No students found in your department. Make sure your college and department are set correctly in your profile.
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudents;
