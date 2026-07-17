import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Trash2, Edit, Save, DollarSign, Users, Award, X } from 'lucide-react';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import api from '../../api/axios';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editJobId, setEditJobId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    department: '',
    graduationYear: '',
    experience: 'Fresher',
    package: '',
    status: 'open',
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs/recruiter');
      setJobs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editJobId) {
        await api.put(`/jobs/${editJobId}`, formData);
      } else {
        await api.post('/jobs', formData);
      }
      setFormData({
        title: '',
        description: '',
        skills: '',
        department: '',
        graduationYear: '',
        experience: 'Fresher',
        package: '',
        status: 'open',
      });
      setEditJobId(null);
      setShowForm(false);
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert('Failed to save job posting.');
    }
  };

  const handleEdit = (job) => {
    setFormData({
      title: job.title,
      description: job.description,
      skills: job.skills?.join(', ') || '',
      department: job.department?.join(', ') || '',
      graduationYear: job.graduationYear?.join(', ') || '',
      experience: job.experience || 'Fresher',
      package: job.package || '',
      status: job.status || 'open',
    });
    setEditJobId(job._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RecruiterLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase className="text-gradient" size={32} /> Job Openings Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Publish and track active campus hiring jobs, package allocations, and skill criteria.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditJobId(null);
              setFormData({ title: '', description: '', skills: '', department: '', graduationYear: '', experience: 'Fresher', package: '', status: 'open' });
            }
          }}
          className="btn btn-primary"
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Publish Job'}
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
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
              {editJobId ? 'Edit Job Posting' : 'Post New Campus Opening'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label">Job Title *</label>
                <input type="text" className="input-field" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label">Job Description *</label>
                <textarea className="input-field" rows="4" name="description" value={formData.description} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Required Skills (comma separated) *</label>
                <input type="text" className="input-field" placeholder="React, Node.js, MongoDB" name="skills" value={formData.skills} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Eligible Departments (comma separated) *</label>
                <input type="text" className="input-field" placeholder="CSE, ECE, IT" name="department" value={formData.department} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Eligible Batches / Graduation Years (comma separated)</label>
                <input type="text" className="input-field" placeholder="2025, 2026" name="graduationYear" value={formData.graduationYear} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Experience Requirement</label>
                <select className="input-field" name="experience" value={formData.experience} onChange={handleChange}>
                  <option value="Fresher">Fresher / Graduate</option>
                  <option value="1-2 Years">1-2 Years</option>
                  <option value="3+ Years">3+ Years</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Package (CTC) *</label>
                <input type="text" className="input-field" placeholder="e.g. 12 LPA" name="package" value={formData.package} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Posting Status</label>
                <select className="input-field" name="status" value={formData.status} onChange={handleChange}>
                  <option value="open">Open (Accepting Applicants)</option>
                  <option value="closed">Closed / Inactive</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Save size={16} /> Save Posting
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading job postings...</div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Briefcase size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No jobs published yet. Click "Publish Job" to invite campus candidates.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {jobs.map(job => (
            <div key={job._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '0.25rem' }}>{job.title}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(job)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(job._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <span className={`badge ${job.status === 'open' ? 'badge-primary' : 'badge-danger'}`} style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>
                {job.status === 'open' ? 'Active' : 'Closed'}
              </span>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', flex: 1, lineHeight: '1.4' }}>
                {job.description?.substring(0, 150)}{job.description?.length > 150 ? '...' : ''}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Package (CTC):</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{job.package}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Eligibility:</span>
                  <span style={{ color: 'white' }}>{job.department?.join(', ')}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                  {job.skills?.slice(0, 4).map((s, i) => (
                    <span key={i} className="badge badge-outline" style={{ fontSize: '0.65rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </RecruiterLayout>
  );
};

export default JobManagement;
