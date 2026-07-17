import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save } from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';
import api from '../../api/axios';

const CompanyProfile = () => {
  const [profile, setProfile] = useState({
    companyName: '',
    description: '',
    website: '',
    industry: '',
    companySize: '',
    location: '',
    hrContact: { name: '', email: '', phone: '' }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recruiter/company');
      if (res.data.data) {
        setProfile({
          ...res.data.data,
          hrContact: res.data.data.hrContact || { name: '', email: '', phone: '' }
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/recruiter/company', profile);
      alert('Company profile saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save company profile.');
    }
    setSaving(false);
  };

  if (loading) return <UserLayout><div style={{ padding: '2rem' }}>Loading...</div></UserLayout>;

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={28} /> Company Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your company details and HR contact info.</p>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2rem', maxWidth: '800px' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Company Name</label>
            <input className="input-field" style={{ width: '100%' }} value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="input-field" style={{ width: '100%', minHeight: '100px', resize: 'vertical' }} value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Website</label>
              <input className="input-field" style={{ width: '100%' }} value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Location</label>
              <input className="input-field" style={{ width: '100%' }} value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Industry</label>
              <input className="input-field" style={{ width: '100%' }} value={profile.industry} onChange={e => setProfile({...profile, industry: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Company Size</label>
              <select className="input-field" style={{ width: '100%' }} value={profile.companySize} onChange={e => setProfile({...profile, companySize: e.target.value})}>
                <option value="">Select Size</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>

          <h3 style={{ marginTop: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>HR Contact</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name</label>
              <input className="input-field" style={{ width: '100%' }} value={profile.hrContact?.name} onChange={e => setProfile({...profile, hrContact: {...profile.hrContact, name: e.target.value}})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
              <input className="input-field" style={{ width: '100%' }} value={profile.hrContact?.email} onChange={e => setProfile({...profile, hrContact: {...profile.hrContact, email: e.target.value}})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Phone</label>
              <input className="input-field" style={{ width: '100%' }} value={profile.hrContact?.phone} onChange={e => setProfile({...profile, hrContact: {...profile.hrContact, phone: e.target.value}})} />
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </motion.div>
    </UserLayout>
  );
};

export default CompanyProfile;
