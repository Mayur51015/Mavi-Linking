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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase className="text-gradient" size={32} /> Career Opportunities Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Publish and track active campus jobs, internships, work modes, and live candidate applicants.</p>
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
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
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
            className="glass-card animate-fade-in"
            style={{ marginBottom: '2.5rem' }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              {editJobId ? 'Edit Opportunity Posting' : 'Post New Campus Opportunity (Job / Internship)'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label">Opportunity Title *</label>
                <input type="text" className="input-field" placeholder="e.g. Frontend Developer Intern" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Opportunity Type *</label>
                <select className="input-field" name="type" value={formData.type} onChange={handleChange}>
                  <option value="Full-time">Full-time Job</option>
                  <option value="Internship">Internship</option>
                  <option value="Part-time">Part-time Job</option>
                  <option value="Apprenticeship">Apprenticeship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Work Mode *</label>
                <select className="input-field" name="workMode" value={formData.workMode} onChange={handleChange}>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Location</label>
                <input type="text" className="input-field" placeholder="e.g. Pune / Remote" name="location" value={formData.location} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Application Deadline</label>
                <input type="date" className="input-field" name="deadline" value={formData.deadline} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label">Role Description *</label>
                <textarea className="input-field" rows="3" placeholder="Describe the role and day-to-day impact..." name="description" value={formData.description} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="input-label">Key Responsibilities</label>
                <textarea className="input-field" rows="2" placeholder="List key responsibilities..." name="responsibilities" value={formData.responsibilities} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Required Skills (comma separated) *</label>
                <input type="text" className="input-field" placeholder="React, JavaScript, Node.js" name="skills" value={formData.skills} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Eligible Departments (comma separated)</label>
                <input type="text" className="input-field" placeholder="CSE, IT, ECE" name="department" value={formData.department} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Eligible Batches / Graduation Years</label>
                <input type="text" className="input-field" placeholder="2025, 2026" name="graduationYear" value={formData.graduationYear} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Experience Requirement</label>
                <select className="input-field" name="experience" value={formData.experience} onChange={handleChange}>
                  <option value="Fresher">Fresher / Graduate</option>
                  <option value="0-1 Years">0-1 Years</option>
                  <option value="1-2 Years">1-2 Years</option>
                  <option value="3+ Years">3+ Years</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Salary / CTC Package</label>
                <input type="text" className="input-field" placeholder="e.g. 10 LPA or ₹40,000/month" name="package" value={formData.package} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Stipend (for Internships)</label>
                <input type="text" className="input-field" placeholder="e.g. ₹15,000/month" name="stipend" value={formData.stipend} onChange={handleChange} />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Posting Status</label>
                <select className="input-field" name="status" value={formData.status} onChange={handleChange}>
                  <option value="open">Open (Accepting Applications)</option>
                  <option value="closed">Closed / Inactive</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Save size={16} /> Save & Publish
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading published opportunities...</div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Briefcase size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No opportunities published yet. Click "Post Opportunity" to publish a real role to student dashboards.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {jobs.map(job => (
            <div key={job._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: 600 }}>{job.title}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{job.type || 'Full-time'}</span>
                    <span>•</span>
                    <span>{job.workMode || 'On-site'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(job)} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(job._id)} title="Delete" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className={`badge ${job.status === 'open' ? 'badge-emerald' : 'badge-red'}`}>
                  {job.status === 'open' ? 'Accepting Applications' : 'Closed'}
                </span>
                {job.location && (
                  <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={11} /> {job.location}
                  </span>
                )}
                <button
                  onClick={() => navigate('/dashboard/recruiter/pipeline')}
                  className="badge badge-purple"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', border: 'none' }}
                  title="View candidates for this opportunity"
                >
                  <Users size={11} /> {job.applicantsCount || 0} Applicants
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', flex: 1, lineHeight: '1.4' }}>
                {job.description?.substring(0, 150)}{job.description?.length > 150 ? '...' : ''}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: 'auto', fontSize: '0.78rem' }}>
                {job.package && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Package / CTC:</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{job.package}</span>
                  </div>
                )}
                {job.stipend && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stipend:</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>{job.stipend}</span>
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
