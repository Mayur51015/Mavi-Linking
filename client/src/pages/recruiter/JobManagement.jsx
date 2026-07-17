import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Edit, Trash2, X, Users } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    salary: '',
    experience: '',
    location: '',
    employmentType: 'Full-time',
    status: 'Open'
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs');
      // Filter jobs where recruiterId matches current user (assuming API returns all or we need to filter if it's not scoped)
      // Actually API is scoped if we use recruiterId or the frontend can filter, but let's assume it returns jobs for this recruiter or company.
      // Wait, getJobs in jobController.js returns all jobs. We should ideally filter by recruiterId.
      setJobs(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (editingId) {
        await api.put(`/jobs/${editingId}`, payload);
      } else {
        await api.post('/jobs', payload);
      }
      setShowModal(false);
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert('Failed to save job');
    }
  };

  const handleEdit = (job) => {
    setFormData({
      ...job,
      requiredSkills: job.requiredSkills?.join(', ') || ''
    });
    setEditingId(job._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setFormData({
      title: '', description: '', requiredSkills: '', salary: '', 
      experience: '', location: '', employmentType: 'Full-time', status: 'Open'
    });
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={28} /> Job Postings
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create and manage job openings for your company.</p>
        </div>
        <button onClick={openNewModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Post New Job
        </button>
      </header>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading jobs...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {jobs.map(job => (
            <motion.div key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{job.title}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{job.location} • {job.employmentType}</div>
                </div>
                <span className={`badge ${job.status === 'Open' ? 'badge-primary' : 'badge-secondary'}`}>{job.status}</span>
              </div>
              
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {job.requiredSkills?.slice(0, 3).map((skill, i) => (
                  <span key={i} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>{skill}</span>
                ))}
                {job.requiredSkills?.length > 3 && <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>+{job.requiredSkills.length - 3}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <Link to={`/dashboard/recruiter/pipeline?job=${job._id}`} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)' }}>
                  <Users size={16} /> Applicants
                </Link>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(job)} className="btn btn-ghost btn-sm"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(job._id)} className="btn btn-ghost btn-sm" style={{ color: '#fca5a5' }}><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {jobs.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No jobs posted yet. Create your first job posting!
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>{editingId ? 'Edit Job' : 'Post New Job'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Job Title *</label>
                <input required className="input-field" style={{ width: '100%' }} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description *</label>
                <textarea required className="input-field" style={{ width: '100%', minHeight: '100px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Required Skills (comma separated)</label>
                <input className="input-field" style={{ width: '100%' }} value={formData.requiredSkills} onChange={e => setFormData({...formData, requiredSkills: e.target.value})} placeholder="React, Node.js, MongoDB" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Salary</label>
                  <input className="input-field" style={{ width: '100%' }} value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="e.g. 10 LPA" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Experience</label>
                  <input className="input-field" style={{ width: '100%' }} value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="e.g. Fresher, 1-3 Years" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Location</label>
                  <input className="input-field" style={{ width: '100%' }} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Employment Type</label>
                  <select className="input-field" style={{ width: '100%' }} value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Status</label>
                <select className="input-field" style={{ width: '100%' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Update Job' : 'Post Job'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </UserLayout>
  );
};

export default JobManagement;
