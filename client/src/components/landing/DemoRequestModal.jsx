import React, { useState } from 'react';
import { CheckCircle2, X, Send } from 'lucide-react';

const DemoRequestModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institutionName: '',
    userRole: 'Institution Admin',
    estimatedStudents: '1,000 - 5,000',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      institutionName: '',
      userRole: 'Institution Admin',
      estimatedStudents: '1,000 - 5,000',
      message: '',
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 5, 10, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '2.25rem',
          borderRadius: '24px',
          border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.4))',
          boxShadow: 'var(--shadow-glow-strong)',
          position: 'relative',
          background: 'var(--bg-elevated)',
        }}
      >
        <button
          onClick={handleReset}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={22} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Institution Demo Requested!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Thank you, <strong>{formData.name}</strong>. Our enterprise SaaS team will contact you at{' '}
              <span style={{ color: 'var(--accent-purple)' }}>{formData.email}</span> within 24 hours to schedule a custom demo for{' '}
              <strong>{formData.institutionName || 'your institution'}</strong>.
            </p>
            <button onClick={handleReset} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Back to MAVI Linking
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>
                ENTERPRISE DEMO
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.25rem 0 0.5rem', color: 'var(--text-primary)' }}>
                Request an Institution Demo
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Discover how MAVI Linking connects your students, faculty, departments, and recruiters in one intelligent operating platform.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Dr. Rajesh Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="admin@institution.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Institution / College Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Zeal Institute of Technology"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Your Role
                  </label>
                  <select
                    className="input-field"
                    value={formData.userRole}
                    onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    <option value="Institution Admin">Institution Admin / Principal</option>
                    <option value="Department Head / HOD">Department Head / HOD</option>
                    <option value="Placement Officer (TPO)">Placement Officer (TPO)</option>
                    <option value="Faculty Member">Faculty Member</option>
                    <option value="Corporate Recruiter">Corporate Recruiter</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Estimated Student Strength
                  </label>
                  <select
                    className="input-field"
                    value={formData.estimatedStudents}
                    onChange={(e) => setFormData({ ...formData, estimatedStudents: e.target.value })}
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    <option value="Under 1,000">Under 1,000</option>
                    <option value="1,000 - 5,000">1,000 - 5,000</option>
                    <option value="5,000 - 15,000">5,000 - 15,000</option>
                    <option value="15,000+">15,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  Specific Requirements / Note
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Tell us about your institution's specific goals..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Submitting Request...' : 'Schedule Custom Demo'} <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default DemoRequestModal;
