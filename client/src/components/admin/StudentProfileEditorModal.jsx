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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="glass-card-static" style={{ width: '100%', maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, background: '#121319', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Editing Student Profile
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'white', margin: '0.2rem 0 0 0' }}>
              {studentData?.name || 'Student Profile'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem' }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('edit')}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', border: 'none', background: activeSubTab === 'edit' ? 'var(--accent-purple)' : 'transparent', color: activeSubTab === 'edit' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('history')}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', border: 'none', background: activeSubTab === 'history' ? 'var(--accent-purple)' : 'transparent', color: activeSubTab === 'history' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <History size={13} /> Change History
              </button>
            </div>

            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="animate-pulse" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-primary)', margin: '0 auto 1rem' }} />
              Loading student profile data...
            </div>
          ) : activeSubTab === 'edit' ? (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
              
              {/* Protected Readonly Header Banner */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    MAVI ID <Lock size={12} color="#fbbf24" title="Protected Field" />
                  </label>
                  <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-purple)', fontSize: '0.95rem' }}>
                    {studentData?.maviId}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Institution <Lock size={12} color="#fbbf24" title="Protected Field" />
                  </label>
                  <div style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>
                    {studentData?.institution?.name || 'Zeal College'} ({studentData?.institution?.tenantId || 'ZCOER'})
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Registered Email <Lock size={12} color="#fbbf24" title="Protected Field" />
                  </label>
                  <div style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>
                    {studentData?.email}
                  </div>
                </div>
              </div>

              {/* Basic Info Section */}
              <div>
                <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                  Basic Student Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input type="text" className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <input type="text" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '0.75rem' }}>
                  <label className="input-label">Student Bio</label>
                  <textarea className="input-field" rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Student summary, career goal..." />
                </div>
              </div>

              {/* PRN & Academic Information */}
              <div>
                <h4 style={{ color: 'var(--accent-purple)', fontSize: '0.95rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                  Institutional & Academic Information (Admin Controlled)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>PRN (Permanent Reg. No.)</span>
                      <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Validated & Audited</span>
                    </label>
                    <input type="text" className="input-field" style={{ fontFamily: 'monospace', fontWeight: 'bold' }} value={form.prn} onChange={e => setForm({ ...form, prn: e.target.value })} placeholder="e.g. 124BT10461" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Department</label>
                    <input type="text" className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Computer Engineering" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Branch / Discipline</label>
                    <input type="text" className="input-field" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} placeholder="Computer Science" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '0.75rem' }}>
                  <div className="input-group">
                    <label className="input-label">Year of Study</label>
                    <input type="text" className="input-field" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Division / Class</label>
                    <input type="text" className="input-field" value={form.division} onChange={e => setForm({ ...form, division: e.target.value })} placeholder="A" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Semester</label>
                    <input type="text" className="input-field" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} placeholder="4" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Graduation Year</label>
                    <input type="text" className="input-field" value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: e.target.value })} placeholder="2028" />
                  </div>
                </div>
              </div>

              {/* Skills & Platform Handles */}
              <div>
                <h4 style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                  Technical Skills & Platform Links
                </h4>
                <div className="input-group">
                  <label className="input-label">Verified Technical Skills (Comma Separated)</label>
                  <input type="text" className="input-field" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, Python, Data Structures..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                  <div className="input-group">
                    <label className="input-label">GitHub Username</label>
                    <input type="text" className="input-field" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="octocat" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">LinkedIn URL</label>
                    <input type="text" className="input-field" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Portfolio URL</label>
                    <input type="text" className="input-field" value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </div>

              {/* Form Footer Controls */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.6rem 1.25rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Student Profile'}
                </button>
              </div>
            </form>
          ) : (
            /* Change History / Audit Log View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* PRN History */}
              <div className="glass-card-static" style={{ padding: '1.25rem' }}>
                <h4 style={{ color: '#fbbf24', fontSize: '0.95rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <History size={16} /> PRN Change History
                </h4>
                {(!studentData?.prnHistory || studentData.prnHistory.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No PRN changes recorded for this student.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {studentData.prnHistory.map((item, idx) => (
                      <div key={idx} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #fbbf24', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>
                            PRN Changed: <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{item.oldPRN || 'None'}</span> &rarr; <span style={{ color: '#fbbf24' }}>{item.newPRN}</span>
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
              <div className="glass-card-static" style={{ padding: '1.25rem' }}>
                <h4 style={{ color: 'var(--accent-purple)', fontSize: '0.95rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={16} /> Profile Management Audit Trail
                </h4>
                {(!studentData?.auditHistory || studentData.auditHistory.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No administrative audit events logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {studentData.auditHistory.map((log) => (
                      <div key={log._id} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>
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
