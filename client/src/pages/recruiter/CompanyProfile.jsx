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
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 style={{ color: 'var(--brand-blue)' }} size={24} /> Company Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your corporate identity, branding, and recruiter contacts visible to candidate pools.</p>
      </header>

      {message.text && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          borderRadius: '6px',
          border: '1px solid',
          borderColor: message.type === 'success' ? '#A7F3D0' : '#FECACA',
          background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: message.type === 'success' ? '#065F46' : '#991B1B',
          fontSize: '0.875rem',
        }}>
          {message.text}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.75rem' }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
            <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Company Name *</label>
            <input type="text" className="input-field" name="name" value={profile.name} onChange={handleChange} required />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Logo URL</label>
            <input type="url" className="input-field" placeholder="https://example.com/logo.png" name="logo" value={profile.logo} onChange={handleChange} />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Website URL</label>
            <input type="url" className="input-field" placeholder="https://example.com" name="website" value={profile.website} onChange={handleChange} />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Industry</label>
            <input type="text" className="input-field" placeholder="e.g. Information Technology" name="industry" value={profile.industry} onChange={handleChange} />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>HQ Location</label>
            <input type="text" className="input-field" placeholder="e.g. San Francisco, CA" name="location" value={profile.location} onChange={handleChange} />
          </div>

          <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
            <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>About Description</label>
            <textarea className="input-field" rows={4} placeholder="Describe your company culture, mission, and benefits..." name="description" value={profile.description} onChange={handleChange} />
          </div>

          {/* HR Contact Subform */}
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} style={{ color: 'var(--brand-blue)' }} /> Primary HR Contact
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>HR Representative Name</label>
                <input type="text" className="input-field" name="name" value={profile.hrContact.name} onChange={handleHrChange} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>HR Email</label>
                <input type="email" className="input-field" name="email" value={profile.hrContact.email} onChange={handleHrChange} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>HR Contact Phone</label>
                <input type="tel" className="input-field" name="phone" value={profile.hrContact.phone} onChange={handleHrChange} />
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </RecruiterLayout>
  );
};

export default CompanyProfile;
