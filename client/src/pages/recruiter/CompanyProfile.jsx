import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Globe, MapPin, Mail, Phone, User, Save, Upload } from 'lucide-react';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import api from '../../api/axios';

const CompanyProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    logo: '',
    description: '',
    website: '',
    industry: '',
    location: '',
    hrContact: { name: '', email: '', phone: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const res = await api.get('/recruiter/company');
        if (res.data.success && res.data.data) {
          setProfile(prev => ({
            ...prev,
            ...res.data.data,
            hrContact: res.data.data.hrContact || { name: '', email: '', phone: '' },
          }));
        }
      } catch (err) {
        console.error('Failed to load company profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleHrChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      hrContact: { ...prev.hrContact, [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/recruiter/company', profile);
      setProfile(prev => ({
        ...prev,
        ...res.data.data,
      }));
      setMessage({ type: 'success', text: 'Company profile updated successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update company profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RecruiterLayout>
        <div className="skeleton" style={{ height: '300px' }} />
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 className="text-gradient" size={32} /> Company Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your corporate identity, logo, and recruiter contacts visible to candidate pools.</p>
      </header>

      {message.text && (
        <div className={`glass-card-static`} style={{
          padding: '1rem',
          marginBottom: '2rem',
          border: '1px solid',
          borderColor: message.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-red)',
          color: message.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-red)',
        }}>
          {message.text}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-static"
        style={{ padding: '2rem' }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Company Name *</label>
            <input type="text" className="input-field" name="name" value={profile.name} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label">Logo URL</label>
            <input type="url" className="input-field" placeholder="https://example.com/logo.png" name="logo" value={profile.logo} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label className="input-label">Website URL</label>
            <input type="url" className="input-field" placeholder="https://example.com" name="website" value={profile.website} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label className="input-label">Industry</label>
            <input type="text" className="input-field" placeholder="e.g. Information Technology" name="industry" value={profile.industry} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label className="input-label">HQ Location</label>
            <input type="text" className="input-field" placeholder="e.g. San Francisco, CA" name="location" value={profile.location} onChange={handleChange} />
          </div>

          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">About Description</label>
            <textarea className="input-field" rows="4" placeholder="Describe your company culture, mission, and benefits..." name="description" value={profile.description} onChange={handleChange} />
          </div>

          {/* HR Contact Subform */}
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Primary HR Contact
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">HR Representative Name</label>
                <input type="text" className="input-field" name="name" value={profile.hrContact.name} onChange={handleHrChange} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">HR Email</label>
                <input type="email" className="input-field" name="email" value={profile.hrContact.email} onChange={handleHrChange} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">HR Contact Phone</label>
                <input type="tel" className="input-field" name="phone" value={profile.hrContact.phone} onChange={handleHrChange} />
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </RecruiterLayout>
  );
};

export default CompanyProfile;
