import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Users, X } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';

const PlacementDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    title: '',
    description: '',
    date: '',
    eligibleDepartments: '',
    eligibleBatches: '',
    minScore: 0,
    status: 'Upcoming'
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchDrives();
  }, []);

  async function fetchDrives() {
    setLoading(true);
    try {
      const res = await api.get('/teacher/drives');
      setDrives(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        eligibleDepartments: formData.eligibleDepartments.split(',').map(s => s.trim()).filter(Boolean),
        eligibleBatches: formData.eligibleBatches.split(',').map(s => s.trim()).filter(Boolean),
      };
      await api.post('/teacher/drives', payload);
      setShowModal(false);
      fetchDrives();
    } catch (err) {
      console.error(err);
      alert('Failed to create drive');
    }
  };

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={28} /> Placement Drives
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage upcoming campus placement drives.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Create Drive
        </button>
      </header>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading drives...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {drives.map(drive => (
            <motion.div key={drive._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{drive.companyName}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{drive.title} • {new Date(drive.date).toLocaleDateString()}</div>
                </div>
                <span className={`badge ${drive.status === 'Upcoming' ? 'badge-primary' : 'badge-secondary'}`}>{drive.status}</span>
              </div>
              
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', flex: 1 }}>
                {drive.description}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Eligibility:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {drive.eligibleDepartments?.map((dept, i) => <span key={i} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>{dept}</span>)}
                  {drive.eligibleBatches?.map((b, i) => <span key={i} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>Batch {b}</span>)}
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>Min Score: {drive.minScore}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Users size={16} /> {drive.assignedStudents?.length || 0} Students Assigned
                </div>
              </div>
            </motion.div>
          ))}
          {drives.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No placement drives scheduled yet.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Create Placement Drive</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Company Name *</label>
                <input required className="input-field" style={{ width: '100%' }} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Drive Title *</label>
                <input required className="input-field" style={{ width: '100%' }} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., SDE Hiring 2025" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                <textarea className="input-field" style={{ width: '100%', minHeight: '80px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date *</label>
                  <input type="date" required className="input-field" style={{ width: '100%' }} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Status</label>
                  <select className="input-field" style={{ width: '100%' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Eligible Departments (comma separated)</label>
                <input className="input-field" style={{ width: '100%' }} value={formData.eligibleDepartments} onChange={e => setFormData({...formData, eligibleDepartments: e.target.value})} placeholder="Computer Science, IT" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Eligible Batches (comma separated)</label>
                  <input className="input-field" style={{ width: '100%' }} value={formData.eligibleBatches} onChange={e => setFormData({...formData, eligibleBatches: e.target.value})} placeholder="2025, 2026" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Min AI Score</label>
                  <input type="number" className="input-field" style={{ width: '100%' }} value={formData.minScore} onChange={e => setFormData({...formData, minScore: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Drive</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </UserLayout>
  );
};

export default PlacementDrives;
