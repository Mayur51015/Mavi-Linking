import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, Shield, Eye, EyeOff, Building2,
  Calendar, DollarSign, Award, ChevronRight,
  Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import PlacementBadge from '../components/PlacementBadge';
import { PLACEMENT_STATUSES } from '../constants/placementConstants';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const StudentAvailability = () => {
  const { refreshUser } = useContext(AuthContext);
  const [availability, setAvailability] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [avRes, plRes] = await Promise.all([
          api.get('/placement/availability'),
          api.get('/placement/student/pipelines'),
        ]);
        const data = avRes.data.data;
        setAvailability(data);
        setStatus(data.placementStatus || 'Available for Hiring');
        setSettings(data.availabilitySettings || {});
        setPipelines(plRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/placement/availability', {
        placementStatus: status,
        availabilitySettings: settings,
      });
      await refreshUser();
      alert('Availability settings saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const pipelineStatusColors = {
    'Applied': 'var(--text-muted)',
    'Under Review': 'var(--accent-amber)',
    'Interview Scheduled': 'var(--accent-blue)',
    'Offer Received': 'var(--accent-purple)',
    'Offer Accepted': 'var(--accent-cyan)',
    'Placed': 'var(--accent-emerald)',
    'Rejected': 'var(--accent-red)',
  };

  if (loading) {
    return (
      <UserLayout>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '140px' }} />)}
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={28} /> Availability & Placement
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your hiring availability, placement status, and view your recruitment pipeline.
        </p>
      </header>

      {/* Current Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-static"
        style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
      >
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} style={{ color: 'var(--accent-cyan)' }} /> Current Placement Status
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <PlacementBadge status={status} company={availability?.placedCompany} size="lg" />
          {availability?.placedCompany && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Building2 size={16} /> {availability.placedCompany}
              {availability.placedRole && <span>• {availability.placedRole}</span>}
            </div>
          )}
        </div>

        {/* Status Selector */}
        <div style={{ marginTop: '1.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            Update Your Status
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="input-field"
            style={{ maxWidth: '320px' }}
          >
            {PLACEMENT_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Availability Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-static"
        style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
      >
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} style={{ color: 'var(--accent-purple)' }} /> Availability Settings
        </h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {[
            { key: 'openToOpportunities', label: 'Open to Opportunities', icon: <Eye size={18} />, desc: 'Signal to recruiters you\'re actively looking' },
            { key: 'availableForInternship', label: 'Available for Internship', icon: <Clock size={18} />, desc: 'Show interest in internship positions' },
            { key: 'availableForFullTime', label: 'Available for Full-Time', icon: <Briefcase size={18} />, desc: 'Show interest in full-time positions' },
            { key: 'hideFromRecruiters', label: 'Hide from Recruiters', icon: <EyeOff size={18} />, desc: 'Your profile won\'t appear in recruiter search (admin access preserved)' },
            { key: 'publicProfile', label: 'Public Profile', icon: <Eye size={18} />, desc: 'Make your profile visible to everyone' },
            { key: 'notLookingForJobs', label: 'Not Looking for Jobs', icon: <XCircle size={18} />, desc: 'Indicate you\'re not currently seeking employment' },
          ].map(({ key, label, icon, desc }) => (
            <div
              key={key}
              onClick={() => toggleSetting(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1rem',
                borderRadius: '10px',
                background: settings[key] ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${settings[key] ? 'rgba(139, 92, 246, 0.2)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ color: settings[key] ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              <div style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: settings[key] ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)',
                position: 'relative',
                transition: 'background 0.3s',
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: settings[key] ? '23px' : '3px',
                  transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
          style={{ marginTop: '1.5rem' }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </motion.div>

      {/* Recruitment Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card-static"
        style={{ padding: '1.5rem' }}
      >
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={20} style={{ color: 'var(--accent-emerald)' }} /> Your Recruitment Pipeline
        </h3>

        {pipelines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No active recruitment pipelines yet. Recruiters will appear here when they initiate hiring.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {pipelines.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--gradient-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}>
                  {p.companyName?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{p.companyName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {p.role} • {p.recruiterId?.name || 'Recruiter'}
                  </div>
                </div>
                <PlacementBadge status={p.status} size="sm" />

                {/* Timeline indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {p.timeline?.slice(-3).map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: pipelineStatusColors[t.status] || 'var(--text-muted)',
                      }}
                      title={`${t.status} — ${new Date(t.updatedAt).toLocaleDateString()}`}
                    />
                  ))}
                </div>

                {p.interviewDetails?.interviewDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                    <Calendar size={12} />
                    {new Date(p.interviewDetails.interviewDate).toLocaleDateString()}
                  </div>
                )}

                {p.offerDetails?.ctc && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                    <DollarSign size={12} />
                    {p.offerDetails.ctc}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </UserLayout>
  );
};

export default StudentAvailability;
