import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Award, Briefcase, Code, CheckCircle, Search } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import api from '../../api/axios';

const StudentVerification = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifyingItem, setVerifyingItem] = useState(null);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/teacher/students?limit=100');
      setStudents(res.data.data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSelectStudent = async (studentId) => {
    setLoading(true);
    try {
      const res = await api.get(`/teacher/students/${studentId}`);
      setSelectedStudent(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (itemType, itemId) => {
    const key = `${itemType}-${itemId}`;
    setVerifyingItem(key);
    try {
      await api.put(`/teacher/verify/${selectedStudent.student._id}/${itemType}/${itemId}`);
      // Refresh selected student data
      handleSelectStudent(selectedStudent.student._id);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert('Verification failed.');
    } finally {
      setVerifyingItem(null);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TeacherLayout>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck className="text-gradient" size={32} /> Student Profile Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review and verify student certifications, projects, skills, and links to build a verified talent pool.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column: Student List */}
        <div className="glass-card-static" style={{ padding: '1.5rem', maxHeight: '600px', overflowY: 'auto' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search students..."
              className="input-field"
              style={{ paddingLeft: '2.25rem', marginBottom: 0 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {filteredStudents.map(s => (
              <div
                key={s._id}
                onClick={() => handleSelectStudent(s._id)}
                className={`glass-card ${selectedStudent?.student?._id === s._id ? 'border-glow' : ''}`}
                style={{
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  background: selectedStudent?.student?._id === s._id ? 'rgba(139, 92, 246, 0.05)' : '',
                }}
              >
                <div className="avatar-gradient" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                  {s.name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                    {s.name} {s.isVerified && <span title="Verified identity">✅</span>}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Batch: {s.university?.batch || '2025'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Student Details & Item Verification list */}
        <div style={{ minHeight: '400px' }}>
          {selectedStudent ? (
            <motion.div
              key={selectedStudent.student._id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card-static"
              style={{ padding: '2rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <div className="avatar-gradient" style={{ width: '56px', height: '56px', fontSize: '1.25rem' }}>
                  {selectedStudent.student.name?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'white' }}>
                    {selectedStudent.student.name} {selectedStudent.student.isVerified && <span style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>(Verified Developer)</span>}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {selectedStudent.student.university?.name} — {selectedStudent.student.university?.department}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Certificates Section */}
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    <Award size={18} style={{ color: 'var(--accent-amber)' }} /> Uploaded Certifications
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {selectedStudent.student.certificates?.map(cert => (
                      <div key={cert._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{cert.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Issuer: {cert.issuer}</div>
                        </div>
                        {cert.isVerified ? (
                          <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={14} /> Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerify('certificates', cert._id)}
                            disabled={verifyingItem === `certificates-${cert._id}`}
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            {verifyingItem === `certificates-${cert._id}` ? 'Verifying...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    ))}
                    {(!selectedStudent.student.certificates || selectedStudent.student.certificates.length === 0) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No certificates uploaded.</div>
                    )}
                  </div>
                </div>

                {/* manual skills list */}
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    <Code size={18} style={{ color: 'var(--accent-cyan)' }} /> Technical Skills
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedStudent.student.skillsList?.map(skill => (
                      <div key={skill._id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                      }}>
                        <span style={{ fontSize: '0.85rem' }}>{skill.name}</span>
                        {skill.isVerified ? (
                          <span style={{ color: 'var(--accent-emerald)', fontSize: '0.75rem' }}>✓</span>
                        ) : (
                          <button
                            onClick={() => handleVerify('skillsList', skill._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', fontSize: '0.7rem' }}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    ))}
                    {(!selectedStudent.student.skillsList || selectedStudent.student.skillsList.length === 0) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No manually entered skills.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card-static" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Select a student from the list to review and verify credentials.
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default StudentVerification;
