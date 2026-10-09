import React, { useState, useEffect } from 'react';
import { Lock, Shield, User, GraduationCap, Calendar, Phone, Mail, FileText, CheckCircle, AlertTriangle, X, History, Save, Award } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorMessage';

const StudentProfileEditorModal = ({ studentId, onClose, onSaveSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('edit'); // 'edit' or 'history'
  const [studentData, setStudentData] = useState(null);

  // Form State for permitted editable fields
  const [form, setForm] = useState({
    name: '',
    avatar: '',
    phone: '',
    bio: '',
    prn: '',
    department: '',
    branch: '',
    year: '',
    division: '',
    semester: '',
    admissionYear: '',
    graduationYear: '',
    skills: '',
    github: '',
    linkedin: '',
    portfolio: '',
    preferredDomain: '',
  });

  const fetchStudentProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/students/${studentId}/profile`);
      const d = res.data.data;
      setStudentData(d);

      setForm({
        name: d.name || '',
        avatar: d.avatar || '',
        phone: d.phone || '',
        bio: d.bio || '',
        prn: d.prn || '',
        department: d.university?.department || '',
        branch: d.university?.branch || '',
        year: d.university?.year || '',
        division: d.university?.division || '',
        semester: d.university?.semester || '',
        admissionYear: d.university?.admissionYear || '',
        graduationYear: d.university?.graduationYear || '',
        skills: Array.isArray(d.skills) ? d.skills.map(s => s.name || s).join(', ') : '',
        github: d.github || '',
        linkedin: d.linkedin || '',
        portfolio: d.portfolio || '',
        preferredDomain: d.preferredDomain || '',
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load student profile for editing.'));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchStudentProfile();
    }
  }, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const skillsArray = form.skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        name: form.name,
        avatar: form.avatar,
        phone: form.phone,
        bio: form.bio,
        prn: form.prn,
        department: form.department,
        branch: form.branch,
        year: form.year,
        division: form.division,
        semester: form.semester,
        admissionYear: form.admissionYear,
        graduationYear: form.graduationYear,
        skills: skillsArray,
        github: form.github,
        linkedin: form.linkedin,
        portfolio: form.portfolio,
        preferredDomain: form.preferredDomain,
      };

      const res = await api.patch(`/admin/students/${studentId}/profile`, payload);
      toast.success(res.data.message || 'Student profile updated successfully!');
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update student profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (!studentId) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Student Profile Management
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
              {studentData?.name || 'Student Profile'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.15rem' }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('edit')}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8125rem', border: 'none', background: activeSubTab === 'edit' ? 'var(--brand-blue)' : 'transparent', color: activeSubTab === 'edit' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('history')}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8125rem', border: 'none', background: activeSubTab === 'history' ? 'var(--brand-blue)' : 'transparent', color: activeSubTab === 'history' ? '#FFFFFF' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <History size={13} /> Change History
              </button>
            </div>

            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading student profile data...
            </div>
          ) : activeSubTab === 'edit' ? (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
              
              {/* Protected Readonly Header Banner */}
              <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                    ETX ID <Lock size={12} color="#D97706" title="Protected Field" />
                  </label>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-blue)', fontSize: '0.9rem', marginTop: '0.15rem' }}>
                    {studentData?.etxId}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                    Institution <Lock size={12} color="#D97706" title="Protected Field" />
                  </label>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                    {studentData?.institution?.name || 'Academic Institution'} ({studentData?.institution?.tenantId || 'CAMPUS'})
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                    Registered Email <Lock size={12} color="#D97706" title="Protected Field" />
                  </label>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                    {studentData?.email}
                  </div>
                </div>
              </div>

              {/* Basic Info Section */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                  Basic Student Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Full Name *</label>
                    <input type="text" className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Phone Number</label>
                    <input type="text" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                  <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Student Bio</label>
                  <textarea className="input-field" rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Student summary, career goal..." style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical' }} />
                </div>
              </div>

              {/* PRN & Academic Information */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                  Institutional & Academic Information (Admin Controlled)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                      <span>PRN</span>
                      <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 500 }}>Audited Field</span>
                    </label>
                    <input type="text" className="input-field" style={{ fontFamily: 'monospace', fontWeight: 600, background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} value={form.prn} onChange={e => setForm({ ...form, prn: e.target.value })} placeholder="e.g. 124BT10461" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Department</label>
                    <input type="text" className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Computer Engineering" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Branch / Discipline</label>
                    <input type="text" className="input-field" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} placeholder="Computer Science" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Year of Study</label>
                    <input type="text" className="input-field" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Division / Class</label>
                    <input type="text" className="input-field" value={form.division} onChange={e => setForm({ ...form, division: e.target.value })} placeholder="A" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Semester</label>
                    <input type="text" className="input-field" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} placeholder="4" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Graduation Year</label>
                    <input type="text" className="input-field" value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: e.target.value })} placeholder="2028" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                </div>
              </div>

              {/* Skills & Platform Handles */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                  Technical Skills & Platform Links
                </h4>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Technical Skills (Comma Separated)</label>
                  <input type="text" className="input-field" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, Python, Data Structures..." style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>GitHub Username</label>
                    <input type="text" className="input-field" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="octocat" style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>LinkedIn URL</label>
                    <input type="text" className="input-field" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Portfolio URL</label>
                    <input type="text" className="input-field" value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} placeholder="https://..." style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '0.875rem' }} />
                  </div>
                </div>
              </div>

              {/* Form Footer Controls */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Student Profile'}
                </button>
              </div>
            </form>
          ) : (
            /* Change History / Audit Log View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* PRN History */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1.25rem' }}>
                <h4 style={{ color: '#D97706', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <History size={16} /> PRN Change History
                </h4>
                {(!studentData?.prnHistory || studentData.prnHistory.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No PRN changes recorded for this student.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {studentData.prnHistory.map((item, idx) => (
                      <div key={idx} style={{ padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '6px', borderLeft: '3px solid #D97706', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                            PRN Changed: <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{item.oldPRN || 'None'}</span> &rarr; <span style={{ color: '#D97706' }}>{item.newPRN}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Changed by: {item.changedByName || 'Institution Admin'}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(item.changedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Administrative Audit Logs */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1.25rem' }}>
                <h4 style={{ color: 'var(--brand-blue)', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={16} /> Profile Management Audit Trail
                </h4>
                {(!studentData?.auditHistory || studentData.auditHistory.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No administrative audit events logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {studentData.auditHistory.map((log) => (
                      <div key={log._id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '6px', borderLeft: '3px solid var(--brand-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {log.action}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Actor: {log.actorId?.name || 'Admin'} ({log.actorRole || 'institution_admin'}) | Fields: {log.changedFields?.join(', ') || 'profile'}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileEditorModal;
