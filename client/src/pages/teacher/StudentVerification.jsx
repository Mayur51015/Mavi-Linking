import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';

const StudentVerification = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const res = await api.get('/teacher/students');
      // In a real scenario, you might want an endpoint that only fetches unverified students,
      // but for now we filter locally.
      const unverified = (res.data.data.students || []).filter(s => !s.isVerified);
      setStudents(unverified);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleVerify = async (studentId) => {
    try {
      await api.put(`/teacher/students/${studentId}/verify`);
      setStudents(students.filter(s => s._id !== studentId));
      alert('Student verified successfully!');
    } catch (err) {
      console.error(err);
      alert('Verification failed');
    }
  };

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={28} /> Student Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review and approve student profiles and achievements.</p>
      </header>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading unverified students...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {students.map(student => (
            <motion.div key={student._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="avatar-gradient" style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}>
                {student.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{student.name}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {student.university?.department || 'Unknown Dept'} • Batch {student.university?.batch || 'Unknown Batch'}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>AI Score</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit' }}>{student.scores?.overall || 0}</div>
                </div>
                <button onClick={() => handleVerify(student._id)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} /> Verify
                </button>
              </div>
            </motion.div>
          ))}
          {students.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }} className="glass-card-static">
              <ShieldCheck size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>All student profiles are verified!</p>
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
};

export default StudentVerification;
