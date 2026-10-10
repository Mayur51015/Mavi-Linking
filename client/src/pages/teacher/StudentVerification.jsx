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
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={26} style={{ color: 'var(--brand-blue)' }} /> Student Profile Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Review and verify student certifications, projects, and skills to establish high-trust institutional credentials.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Student List */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            maxHeight: '680px',
            overflowY: 'auto',
          }}
        >
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={15} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search students..."
              className="input-field"
              style={{ paddingLeft: '2.25rem', marginBottom: 0, fontSize: '0.85rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {filteredStudents.map(s => {
              const isSelected = selectedStudent?.student?._id === s._id;
              return (
                <div
                  key={s._id}
                  onClick={() => handleSelectStudent(s._id)}
                  style={{
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--brand-blue)' : 'var(--border-color)',
                    background: isSelected ? 'var(--brand-blue-light)' : 'var(--bg-card)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--brand-blue)' : 'var(--bg-subtle)',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {s.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Batch {s.university?.batch || '2025'} {s.isVerified && '• Verified'}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No students match your query.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Student Details & Item Verification list */}
        <div style={{ minHeight: '400px' }}>
          {selectedStudent ? (
            <motion.div
              key={selectedStudent.student._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {selectedStudent.student.name?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedStudent.student.name}
                    {selectedStudent.student.isVerified && (
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        Verified
                      </span>
                    )}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                    {selectedStudent.student.university?.name || 'Institution'} — {selectedStudent.student.university?.department || 'Department'}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: 'grid', gap: '1.75rem' }}>
                {/* Certificates Section */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <Award size={16} style={{ color: 'var(--brand-blue)' }} /> Uploaded Certifications
                  </h4>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {selectedStudent.student.certificates?.map(cert => (
                      <div
                        key={cert._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{cert.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Issuer: {cert.issuer}</div>
                        </div>
                        {cert.isVerified ? (
                          <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={15} /> Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerify('certificates', cert._id)}
                            disabled={verifyingItem === `certificates-${cert._id}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                          >
                            {verifyingItem === `certificates-${cert._id}` ? 'Verifying...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    ))}
                    {(!selectedStudent.student.certificates || selectedStudent.student.certificates.length === 0) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        No certificates uploaded.
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Skills List */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <Code size={16} style={{ color: 'var(--brand-blue)' }} /> Technical Skills
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedStudent.student.skillsList?.map(skill => (
                      <div
                        key={skill._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{skill.name}</span>
                        {skill.isVerified ? (
                          <span style={{ color: 'var(--accent-emerald)', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
                        ) : (
                          <button
                            onClick={() => handleVerify('skillsList', skill._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, padding: 0 }}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    ))}
                    {(!selectedStudent.student.skillsList || selectedStudent.student.skillsList.length === 0) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', width: '100%', textAlign: 'center' }}>
                        No manually declared skills.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div
              style={{
                height: '100%',
                minHeight: '360px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
              }}
            >
              Select a student from the left panel to review and verify credentials.
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default StudentVerification;
