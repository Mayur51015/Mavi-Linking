import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, Edit, Save, Users, Building, AlertCircle, X } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import api from '../../api/axios';

const PlacementDrives = () => {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    companyId: '',
    description: '',
    eligibility: { minScore: 600, departments: '' },
    date: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driveRes, studentRes, companyRes] = await Promise.all([
        api.get('/teacher/drives'),
        api.get('/teacher/students?limit=100'),
        api.get('/teacher/companies').catch(() => ({ data: { data: [] } })),
      ]);
      setDrives(driveRes.data.data || []);
      setStudents(studentRes.data.data?.students || studentRes.data.data || []);
      setCompanies(companyRes.data.data || []);
    } catch (err) {
      console.error('Error fetching placement drive data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEligibilityChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      eligibility: { ...prev.eligibility, [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyId || formData.companyId === 'mock') {
      alert('Please select a valid partner company from the list.');
      return;
    }
    try {
      const payload = {
        ...formData,
        eligibility: {
          minScore: parseInt(formData.eligibility.minScore, 10) || 0,
          departments: formData.eligibility.departments
            ? formData.eligibility.departments.split(',').map(d => d.trim()).filter(Boolean)
            : [],
        },
      };
      await api.post('/teacher/drives', payload);
      setFormData({ title: '', companyId: '', description: '', eligibility: { minScore: 600, departments: '' }, date: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Placement drive creation error:', err);
      const safeErrorMsg = err.response?.data?.message || 'Failed to publish placement drive. Please check your inputs.';
      alert(safeErrorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this placement drive?')) return;
    try {
      await api.delete(`/teacher/drives/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) return;
    try {
      await api.post(`/teacher/drives/${showAssignModal._id}/assign`, { studentIds: selectedStudents });
      setShowAssignModal(null);
      setSelectedStudents([]);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign students.');
    }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  return (
    <TeacherLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar className="text-gradient" size={32} /> Campus Placement Drives
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Schedule company recruitment drives, configure minimum cutoff criteria, and assign eligible student batch list.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Schedule Drive'}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card animate-fade-in"
            style={{ marginBottom: '2.5rem' }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Schedule Recruitment Drive</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-title">Drive Title *</label>
                <input id="drive-title" type="text" className="input-field" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-company">Hosting Company *</label>
                <select id="drive-company" className="input-field" name="companyId" value={formData.companyId} onChange={handleChange} required>
                  <option value="">Select Hosting Company</option>
                  {companies.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.location ? `(${c.location})` : ''}
                    </option>
                  ))}
                  {companies.length === 0 && (
                    <option value="" disabled>No registered companies found</option>
                  )}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-date">Scheduled Date *</label>
                <input id="drive-date" type="date" className="input-field" name="date" value={formData.date} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-min-score">Cutoff Score *</label>
                <input id="drive-min-score" type="number" className="input-field" name="minScore" value={formData.eligibility.minScore} onChange={handleEligibilityChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-departments">Eligible Departments (comma separated) *</label>
                <input id="drive-departments" type="text" className="input-field" placeholder="CSE, IT" name="departments" value={formData.eligibility.departments} onChange={handleEligibilityChange} required />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-description">Drive Details & Guidelines *</label>
                <textarea id="drive-description" className="input-field" rows="3" name="description" value={formData.description} onChange={handleChange} required />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Save size={16} /> Publish Drive
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading drives...</div>
      ) : drives.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No placement drives scheduled yet. Click "Schedule Drive" to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {drives.map(drive => (
            <div key={drive._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '0.25rem' }}>{drive.title}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Building size={14} /> {drive.companyId?.name || 'Partner Company'}
                  </div>
                </div>
                <button onClick={() => handleDelete(drive._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', flex: 1, lineHeight: '1.4' }}>
                {drive.description}
              </p>

              <div style={{ display: 'grid', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Drive Date:</span>
                  <span>{new Date(drive.date).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cutoff Score:</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{drive.eligibility?.minScore}+</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Departments:</span>
                  <span>
                    {(Array.isArray(drive.eligibility?.departments) && drive.eligibility.departments.length > 0)
                      ? drive.eligibility.departments.join(', ')
                      : (Array.isArray(drive.eligibility?.department) && drive.eligibility.department.length > 0)
                        ? drive.eligibility.department.join(', ')
                        : 'All Departments'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Candidates:</span>
                  <span className="badge badge-primary">{drive.students?.length || 0}</span>
                </div>
                <button
                  onClick={() => setShowAssignModal(drive)}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                >
                  <Users size={12} /> Assign Candidates
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card-static" style={{ width: '480px', padding: '2rem', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Assign to: {showAssignModal.title}</h3>
              <button onClick={() => { setShowAssignModal(null); setSelectedStudents([]); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', display: 'grid', gap: '0.5rem' }}>
              {students.map(s => {
                const isSelected = selectedStudents.includes(s._id);
                return (
                  <div
                    key={s._id}
                    onClick={() => handleToggleStudent(s._id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-purple)' : 'var(--border-color)',
                      background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{s.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score: {s.scores?.overall || 0} | Status: {s.placementStatus || 'Available'}</div>
                    </div>
                    {isSelected && <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>✓</span>}
                  </div>
                );
              })}
            </div>

            <button onClick={handleAssign} className="btn btn-primary" style={{ width: '100%' }}>
              Confirm Assignments
            </button>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};

export default PlacementDrives;
