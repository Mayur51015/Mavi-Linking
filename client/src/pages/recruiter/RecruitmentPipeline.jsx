import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitPullRequest, Plus, ChevronDown, Calendar,
  DollarSign, MessageSquare, X, Send, Eye,
  Users, Filter, ArrowRight,
} from 'lucide-react';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import PlacementBadge from '../../components/PlacementBadge';
import { PIPELINE_STATUSES } from '../../constants/placementConstants';
import api from '../../api/axios';

const RecruitmentPipelinePage = () => {
  const [pipelines, setPipelines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [newPipeline, setNewPipeline] = useState({ studentId: '', role: '', recruiterMessage: '' });
  const [creating, setCreating] = useState(false);

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const [plRes, stRes] = await Promise.all([
        api.get(`/placement/pipeline${params}`),
        api.get('/placement/stats'),
      ]);
      setPipelines(plRes.data.data || []);
      setStats(stRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPipelines(); }, [filterStatus]);

  const handleCreate = async () => {
    if (!newPipeline.studentId || !newPipeline.role) return;
    setCreating(true);
    try {
      await api.post('/placement/pipeline', newPipeline);
      setShowCreateModal(false);
      setNewPipeline({ studentId: '', role: '', recruiterMessage: '' });
      fetchPipelines();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create pipeline.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (pipelineId, newStatus) => {
    try {
      await api.put(`/placement/pipeline/${pipelineId}/status`, { status: newStatus });
      fetchPipelines();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  const handleInterviewUpdate = async (pipelineId, details) => {
    try {
      await api.put(`/placement/pipeline/${pipelineId}/interview`, details);
      fetchPipelines();
    } catch (err) {
      alert('Failed to update interview details.');
    }
  };

  const handleOfferUpdate = async (pipelineId, details) => {
    try {
      await api.put(`/placement/pipeline/${pipelineId}/offer`, details);
      fetchPipelines();
    } catch (err) {
      alert('Failed to update offer details.');
    }
  };

  // Valid next statuses for a given current status
  const getNextStatuses = (currentStatus) => {
    const transitions = {
      'Applied': ['Under Review', 'Shortlisted', 'Rejected'],
      'Under Review': ['Shortlisted', 'Interview Scheduled', 'Rejected'],
      'Shortlisted': ['Interview Scheduled', 'Technical Round', 'Rejected'],
      'Interview Scheduled': ['Technical Round', 'HR Round', 'Selected', 'Offer Sent', 'Offer Received', 'Rejected'],
      'Technical Round': ['HR Round', 'Selected', 'Rejected'],
      'HR Round': ['Selected', 'Offer Sent', 'Rejected'],
      'Selected': ['Offer Sent', 'Offer Received', 'Rejected'],
      'Offer Sent': ['Joined', 'Offer Accepted', 'Rejected'],
      'Offer Received': ['Offer Accepted', 'Rejected'],
      'Offer Accepted': ['Joined', 'Placed', 'Rejected'],
      'Placed': ['Joined'],
      'Joined': [],
      'Rejected': ['Applied', 'Under Review', 'Shortlisted'],
    };
    return transitions[currentStatus] || [];
  };

  const statusColumnColors = {
    'Applied': 'var(--text-muted)',
    'Under Review': 'var(--accent-amber)',
    'Shortlisted': 'var(--accent-blue)',
    'Interview Scheduled': 'var(--accent-blue)',
    'Technical Round': 'var(--accent-purple)',
    'HR Round': 'var(--accent-pink)',
    'Selected': 'var(--accent-cyan)',
    'Offer Sent': 'var(--accent-cyan)',
    'Offer Received': 'var(--accent-purple)',
    'Offer Accepted': 'var(--accent-cyan)',
    'Joined': 'var(--accent-emerald)',
    'Placed': 'var(--accent-emerald)',
    'Rejected': 'var(--accent-red)',
  };

  return (
    <RecruiterLayout>
      <header style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitPullRequest size={22} style={{ color: 'var(--brand-blue)' }} /> Recruitment Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage candidate hiring workflows, stage progressions, and interview schedules.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Plus size={16} /> New Pipeline
        </button>
      </header>

      {/* Stats Bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
        >
          {PIPELINE_STATUSES.map(s => {
            const isSelected = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(isSelected ? '' : s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? '600' : '500',
                  border: isSelected ? '1px solid var(--brand-blue)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : '#FFFFFF',
                  color: isSelected ? 'var(--brand-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{s}</span>
                <span style={{
                  background: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-subtle)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isSelected ? 'var(--brand-blue)' : 'var(--text-primary)',
                }}>
                  {stats[s] || 0}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Pipeline Cards */}
      {loading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '8px' }} />)}
        </div>
      ) : pipelines.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {filterStatus ? `No candidates found with stage "${filterStatus}".` : 'No active recruitment pipelines. Create one to begin tracking candidate stages.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <AnimatePresence>
            {pipelines.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ delay: i * 0.02 }}
                style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Student Info */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.95rem', flexShrink: 0 }}>
                    {p.studentId?.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {p.studentId?.name || 'Unknown'}
                      {p.studentId?.placementStatus && (
                        <PlacementBadge status={p.studentId.placementStatus} size="sm" showIcon={false} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.role} • Score: <strong style={{ color: 'var(--text-primary)' }}>{p.studentId?.scores?.overall || 0}</strong> • {p.studentId?.university?.name || 'N/A'}
                    </div>
                  </div>

                  {/* Current Status */}
                  <PlacementBadge status={p.status} size="md" />

                  {/* Status Transition */}
                  {getNextStatuses(p.status).length > 0 && (
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {getNextStatuses(p.status).map(ns => (
                        <button
                          key={ns}
                          onClick={() => handleStatusUpdate(p._id, ns)}
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <ArrowRight size={11} /> {ns}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View Profile */}
                  {p.studentId?.username && (
                    <a href={`/u/${p.studentId.username}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.35rem 0.5rem' }} title="View Profile">
                      <Eye size={13} />
                    </a>
                  )}

                  <button onClick={() => setShowDetailModal(p)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.35rem 0.625rem', color: 'var(--brand-blue)' }}>
                    Manage Details
                  </button>
                </div>

                {/* Timeline Preview */}
                {p.timeline?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {p.timeline.map((t, idx) => (
                      <React.Fragment key={idx}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          fontWeight: '500',
                        }}>
                          {t.status}
                        </span>
                        {idx < p.timeline.length - 1 && (
                          <ChevronDown size={10} style={{ color: 'var(--text-muted)', transform: 'rotate(-90deg)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Interview / Offer Quick Info */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.625rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '0.625rem' }}>
                  {p.interviewDetails?.interviewDate && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                      <Calendar size={12} /> Interview: {new Date(p.interviewDetails.interviewDate).toLocaleDateString()}
                      {p.interviewDetails.interviewMode && ` (${p.interviewDetails.interviewMode})`}
                    </span>
                  )}
                  {p.offerDetails?.ctc && (
                    <span style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                      <DollarSign size={12} /> CTC: {p.offerDetails.ctc}
                    </span>
                  )}
                  {p.recruiterMessage && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MessageSquare size={12} /> {p.recruiterMessage.substring(0, 50)}{p.recruiterMessage.length > 50 ? '...' : ''}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Pipeline Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Create Candidate Pipeline</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Student ID</label>
              <input
                className="input-field"
                placeholder="Paste Student ObjectId..."
                value={newPipeline.studentId}
                onChange={e => setNewPipeline(p => ({ ...p, studentId: e.target.value }))}
                style={{ fontSize: '0.875rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Tip: Copy from the candidate search results or bookmarks page
              </span>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Role / Position</label>
              <input
                className="input-field"
                placeholder="e.g., Frontend Developer"
                value={newPipeline.role}
                onChange={e => setNewPipeline(p => ({ ...p, role: e.target.value }))}
                style={{ fontSize: '0.875rem' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Message (Optional)</label>
              <textarea
                className="input-field"
                placeholder="Initial message to the candidate..."
                rows="3"
                value={newPipeline.recruiterMessage}
                onChange={e => setNewPipeline(p => ({ ...p, recruiterMessage: e.target.value }))}
                style={{ resize: 'vertical', fontSize: '0.875rem' }}
              />
            </div>

            <button onClick={handleCreate} disabled={creating} className="btn btn-primary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.625rem' }}>
              <Send size={15} /> {creating ? 'Creating...' : 'Create Pipeline'}
            </button>
          </motion.div>
        </div>
      )}

      {/* Edit Details Modal (Interview/Offer scheduling) */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manage Pipeline: {showDetailModal.studentId?.name}</h2>
              <button onClick={() => setShowDetailModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
            </div>

            {/* Stage Selector */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Current Pipeline Stage</label>
              <select
                className="input-field"
                value={showDetailModal.status}
                onChange={(e) => handleStatusUpdate(showDetailModal._id, e.target.value)}
                style={{ fontSize: '0.875rem' }}
              >
                {PIPELINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Interview details form */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.875rem' }}>Interview Scheduling</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Interview Date</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={showDetailModal.interviewDetails?.interviewDate ? new Date(showDetailModal.interviewDetails.interviewDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      setShowDetailModal(prev => ({
                        ...prev,
                        interviewDetails: { ...prev.interviewDetails, interviewDate: date }
                      }));
                    }}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Interview Mode</label>
                  <select
                    className="input-field"
                    value={showDetailModal.interviewDetails?.interviewMode || 'Online'}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setShowDetailModal(prev => ({
                        ...prev,
                        interviewDetails: { ...prev.interviewDetails, interviewMode: mode }
                      }));
                    }}
                    style={{ fontSize: '0.875rem' }}
                  >
                    <option value="Online">Online / video link</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Meeting Link / Location</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://meet.google.com/... or HQ Room 402"
                  value={showDetailModal.interviewDetails?.meetingLink || ''}
                  onChange={(e) => {
                    const link = e.target.value;
                    setShowDetailModal(prev => ({
                      ...prev,
                      interviewDetails: { ...prev.interviewDetails, meetingLink: link }
                    }));
                  }}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
              <button
                onClick={async () => {
                  try {
                    await handleInterviewUpdate(showDetailModal._id, showDetailModal.interviewDetails);
                    alert('Interview details saved!');
                  } catch (err) {
                    alert('Failed to save interview details.');
                  }
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.45rem 0.875rem' }}
              >
                Save Interview Schedule
              </button>
            </div>

            {/* Offer details form */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.875rem' }}>Offer & Compensation Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Package (CTC)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 14 LPA"
                    value={showDetailModal.offerDetails?.ctc || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShowDetailModal(prev => ({
                        ...prev,
                        offerDetails: { ...prev.offerDetails, ctc: val }
                      }));
                    }}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Joining Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={showDetailModal.offerDetails?.joiningDate ? new Date(showDetailModal.offerDetails.joiningDate).toISOString().slice(0, 10) : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      setShowDetailModal(prev => ({
                        ...prev,
                        offerDetails: { ...prev.offerDetails, joiningDate: date }
                      }));
                    }}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Offer / Joining Letter Link</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://drive.google.com/..."
                  value={showDetailModal.offerDetails?.offerLetterUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    setShowDetailModal(prev => ({
                      ...prev,
                      offerDetails: { ...prev.offerDetails, offerLetterUrl: url }
                    }));
                  }}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
              <button
                onClick={async () => {
                  try {
                    await handleOfferUpdate(showDetailModal._id, showDetailModal.offerDetails);
                    alert('Offer details saved!');
                  } catch (err) {
                    alert('Failed to save offer details.');
                  }
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.45rem 0.875rem' }}
              >
                Save Offer Details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </RecruiterLayout>
  );
};

export default RecruitmentPipelinePage;
