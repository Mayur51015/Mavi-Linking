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
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.875rem' }}>
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'Schedule Drive'}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Schedule Recruitment Drive
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-title">Drive Title *</label>
                <input id="drive-title" type="text" className="input-field" placeholder="e.g. Google Campus Hiring 2025" name="title" value={formData.title} onChange={handleChange} required />
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
                <input id="drive-min-score" type="number" className="input-field" placeholder="ETX Minimum (e.g. 600)" name="minScore" value={formData.eligibility.minScore} onChange={handleEligibilityChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-departments">Eligible Departments (comma separated) *</label>
                <input id="drive-departments" type="text" className="input-field" placeholder="CSE, IT, ECE" name="departments" value={formData.eligibility.departments} onChange={handleEligibilityChange} required />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label" htmlFor="drive-description">Drive Details & Guidelines *</label>
                <textarea id="drive-description" className="input-field" rows="3" placeholder="Outline job positions, rounds of selection, and eligibility notes..." name="description" value={formData.description} onChange={handleChange} required />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <Save size={15} /> Publish Drive
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : drives.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <Calendar size={42} style={{ margin: '0 auto 1rem auto', color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No placement drives scheduled yet. Click "Schedule Drive" to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {drives.map(drive => (
            <div
              key={drive._id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {drive.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                    <Building size={14} /> {drive.companyId?.name || 'Partner Company'}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(drive._id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                  title="Delete drive"
                  onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1, lineHeight: 1.5 }}>
                {drive.description}
              </p>

              <div style={{ display: 'grid', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: 'auto', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Drive Date:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{new Date(drive.date).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cutoff Score:</span>
                  <span style={{ fontWeight: 600, color: 'var(--brand-blue)' }}>{drive.eligibility?.minScore}+</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Departments:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {(Array.isArray(drive.eligibility?.departments) && drive.eligibility.departments.length > 0)
                      ? drive.eligibility.departments.join(', ')
                      : (Array.isArray(drive.eligibility?.department) && drive.eligibility.department.length > 0)
                        ? drive.eligibility.department.join(', ')
                        : 'All Departments'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Candidates:</span>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                    {drive.students?.length || 0}
                  </span>
                </div>
                <button
                  onClick={() => setShowAssignModal(drive)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', marginTop: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <Users size={14} /> Assign Candidates
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Students Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
          <div
            style={{
              width: '480px',
              maxWidth: '90vw',
              padding: '1.75rem',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Assign Candidates: {showAssignModal.title}
              </h3>
              <button
                onClick={() => { setShowAssignModal(null); setSelectedStudents([]); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.25rem', display: 'grid', gap: '0.4rem', paddingRight: '0.25rem' }}>
              {students.map(s => {
                const isSelected = selectedStudents.includes(s._id);
                return (
                  <div
                    key={s._id}
                    onClick={() => handleToggleStudent(s._id)}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--brand-blue)' : 'var(--border-color)',
                      background: isSelected ? 'var(--brand-blue-light)' : 'var(--bg-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Score: {s.scores?.overall || 0} | Status: {s.placementStatus || 'Available'}</div>
                    </div>
                    {isSelected && <span style={{ color: 'var(--brand-blue)', fontWeight: 700, fontSize: '1rem' }}>✓</span>}
                  </div>
                );
              })}
              {students.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No students available for assignment.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setShowAssignModal(null); setSelectedStudents([]); }} className="btn btn-outline" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleAssign} className="btn btn-primary" style={{ flex: 2 }}>
                Confirm Assignments ({selectedStudents.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};

export default PlacementDrives;
