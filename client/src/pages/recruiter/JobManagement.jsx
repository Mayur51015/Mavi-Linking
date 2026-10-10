import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Trash2, Edit, Save, DollarSign, Users, Award, X, MapPin, Calendar, Globe, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import api from '../../api/axios';

const JobManagement = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editJobId, setEditJobId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Full-time',
    workMode: 'On-site',
    location: '',
    skills: '',
    department: '',
    graduationYear: '',
    experience: 'Fresher',
    package: '',
    stipend: '',
    responsibilities: '',
    eligibility: '',
    deadline: '',
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'Full-time',
      workMode: 'On-site',
      location: '',
      skills: '',
      department: '',
      graduationYear: '',
      experience: 'Fresher',
      package: '',
      stipend: '',
      responsibilities: '',
      eligibility: '',
      deadline: '',
      status: 'open',
    });
    setEditJobId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editJobId) {
        await api.put(`/jobs/${editJobId}`, formData);
      } else {
        await api.post('/jobs', formData);
      }
      resetForm();
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert('Failed to save opportunity posting.');
    }
  };

  const handleEdit = (job) => {
    setFormData({
      title: job.title || '',
      description: job.description || '',
      type: job.type || 'Full-time',
      workMode: job.workMode || 'On-site',
      location: job.location || '',
      skills: job.skills?.join(', ') || '',
      department: job.department?.join(', ') || '',
      graduationYear: job.graduationYear?.join(', ') || '',
      experience: job.experience || 'Fresher',
      package: job.package || '',
      stipend: job.stipend || '',
      responsibilities: job.responsibilities || '',
      eligibility: job.eligibility || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      status: job.status || 'open',
    });
    setEditJobId(job._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RecruiterLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase style={{ color: 'var(--brand-blue)' }} size={24} /> Career Opportunities Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Publish and track active campus jobs, internships, work modes, and live candidate applicants.</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="btn btn-primary"
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Post Opportunity'}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              {editJobId ? 'Edit Opportunity Posting' : 'Post New Campus Opportunity (Job / Internship)'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Opportunity Title *</label>
                <input type="text" className="input-field" placeholder="e.g. Frontend Developer Intern" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Opportunity Type *</label>
                <select className="input-field" name="type" value={formData.type} onChange={handleChange}>
                  <option value="Full-time">Full-time Job</option>
                  <option value="Internship">Internship</option>
                  <option value="Part-time">Part-time Job</option>
                  <option value="Apprenticeship">Apprenticeship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Work Mode *</label>
                <select className="input-field" name="workMode" value={formData.workMode} onChange={handleChange}>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Location</label>
                <input type="text" className="input-field" placeholder="e.g. Pune / Remote" name="location" value={formData.location} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Application Deadline</label>
                <input type="date" className="input-field" name="deadline" value={formData.deadline} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Role Description *</label>
                <textarea className="input-field" rows="3" placeholder="Describe the role and day-to-day impact..." name="description" value={formData.description} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Key Responsibilities</label>
                <textarea className="input-field" rows="2" placeholder="List key responsibilities..." name="responsibilities" value={formData.responsibilities} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Required Skills (comma separated) *</label>
                <input type="text" className="input-field" placeholder="React, JavaScript, Node.js" name="skills" value={formData.skills} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Eligible Departments (comma separated)</label>
                <input type="text" className="input-field" placeholder="CSE, IT, ECE" name="department" value={formData.department} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Eligible Batches / Graduation Years</label>
                <input type="text" className="input-field" placeholder="2025, 2026" name="graduationYear" value={formData.graduationYear} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Experience Requirement</label>
                <select className="input-field" name="experience" value={formData.experience} onChange={handleChange}>
                  <option value="Fresher">Fresher / Graduate</option>
                  <option value="0-1 Years">0-1 Years</option>
                  <option value="1-2 Years">1-2 Years</option>
                  <option value="3+ Years">3+ Years</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Salary / CTC Package</label>
                <input type="text" className="input-field" placeholder="e.g. 10 LPA or ₹40,000/month" name="package" value={formData.package} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Stipend (for Internships)</label>
                <input type="text" className="input-field" placeholder="e.g. ₹15,000/month" name="stipend" value={formData.stipend} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Posting Status</label>
                <select className="input-field" name="status" value={formData.status} onChange={handleChange}>
                  <option value="open">Open (Accepting Applications)</option>
                  <option value="closed">Closed / Inactive</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
                  <Save size={15} /> Save & Publish
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '0.875rem' }}>Loading published opportunities...</div>
      ) : jobs.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Briefcase size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No opportunities published yet. Click "Post Opportunity" to publish a real role to student dashboards.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '1.25rem' }}>
          {jobs.map(job => (
            <div key={job._id} style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span>{job.type || 'Full-time'}</span>
                    <span>•</span>
                    <span>{job.workMode || 'On-site'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <button onClick={() => handleEdit(job)} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                    <Edit size={15} />
                  </button>
                  <button onClick={() => handleDelete(job._id)} title="Delete" style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0.25rem' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                <span className={`badge ${job.status === 'open' ? 'badge-emerald' : 'badge-red'}`} style={{ fontSize: '0.75rem' }}>
                  {job.status === 'open' ? 'Accepting Applications' : 'Closed'}
                </span>
                {job.location && (
                  <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                    <MapPin size={11} /> {job.location}
                  </span>
                )}
                <button
                  onClick={() => navigate('/dashboard/recruiter/pipeline')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    background: 'rgba(37, 99, 235, 0.08)',
                    color: 'var(--brand-blue)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                  title="View candidates for this opportunity"
                >
                  <Users size={11} /> {job.applicantsCount || 0} Applicants
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1.25rem', flex: 1, lineHeight: '1.5' }}>
                {job.description?.substring(0, 140)}{job.description?.length > 140 ? '...' : ''}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: 'auto', fontSize: '0.75rem' }}>
                {job.package && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Package / CTC:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{job.package}</span>
                  </div>
                )}
                {job.stipend && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stipend:</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{job.stipend}</span>
                  </div>
                )}
                {job.deadline && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Deadline:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{new Date(job.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                  {job.skills?.slice(0, 4).map((s, i) => (
                    <span key={i} className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{s}</span>
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
