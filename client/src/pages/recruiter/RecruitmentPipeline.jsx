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
      'Applied': ['Under Review', 'Rejected'],
      'Under Review': ['Interview Scheduled', 'Rejected'],
      'Interview Scheduled': ['Offer Received', 'Under Review', 'Rejected'],
      'Offer Received': ['Offer Accepted', 'Rejected'],
      'Offer Accepted': ['Placed', 'Rejected'],
      'Rejected': ['Under Review'],
      'Placed': [],
    };
    return transitions[currentStatus] || [];
  };

  const statusColumnColors = {
    'Applied': 'var(--text-muted)',
    'Under Review': 'var(--accent-amber)',
    'Interview Scheduled': 'var(--accent-blue)',
    'Offer Received': 'var(--accent-purple)',
    'Offer Accepted': 'var(--accent-cyan)',
    'Placed': 'var(--accent-emerald)',
    'Rejected': 'var(--accent-red)',
  };

  return (
    <RecruiterLayout>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitPullRequest size={28} /> Recruitment Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage candidate hiring workflows from application to placement.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={18} /> New Pipeline
        </button>
      </header>

      {/* Stats Bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
        >
          {PIPELINE_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: `1px solid ${filterStatus === s ? statusColumnColors[s] : 'var(--border-color)'}`,
                background: filterStatus === s ? `${statusColumnColors[s]}15` : 'transparent',
                color: filterStatus === s ? statusColumnColors[s] : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: statusColumnColors[s],
              }} />
              {s}
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
              }}>
                {stats[s] || 0}
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Pipeline Cards */}
      {loading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px' }} />)}
        </div>
      ) : pipelines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          {filterStatus ? `No pipelines with status "${filterStatus}".` : 'No pipelines yet. Create one to start tracking candidates.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <AnimatePresence>
            {pipelines.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card"
                style={{ padding: '1.25rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Student Info */}
                  <div className="avatar-gradient" style={{ width: '44px', height: '44px', fontSize: '1.1rem', flexShrink: 0 }}>
                    {p.studentId?.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {p.studentId?.name || 'Unknown'}
                      {p.studentId?.placementStatus && (
                        <PlacementBadge status={p.studentId.placementStatus} size="sm" showIcon={false} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {p.role} • Score: {p.studentId?.scores?.overall || 0} • {p.studentId?.university?.name || 'N/A'}
                    </div>
                  </div>

                  {/* Current Status */}
                  <PlacementBadge status={p.status} size="md" />

                  {/* Status Transition */}
                  {getNextStatuses(p.status).length > 0 && (
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {getNextStatuses(p.status).map(ns => (
                        <button
                          key={ns}
                          onClick={() => handleStatusUpdate(p._id, ns)}
                          className="btn btn-outline btn-sm"
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.25rem 0.625rem',
                            borderColor: statusColumnColors[ns],
                            color: statusColumnColors[ns],
                          }}
                        >
                          <ArrowRight size={12} /> {ns}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View Profile */}
                  {p.studentId?.username && (
                    <a href={`/u/${p.studentId.username}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      <Eye size={14} />
                    </a>
                  )}
                </div>

                {/* Timeline Preview */}
                {p.timeline?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {p.timeline.map((t, idx) => (
                      <React.Fragment key={idx}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: statusColumnColors[t.status] ? `${statusColumnColors[t.status]}15` : 'rgba(255,255,255,0.05)',
                          color: statusColumnColors[t.status] || 'var(--text-muted)',
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
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {p.interviewDetails?.interviewDate && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> Interview: {new Date(p.interviewDetails.interviewDate).toLocaleDateString()}
                      {p.interviewDetails.interviewMode && ` (${p.interviewDetails.interviewMode})`}
                    </span>
                  )}
                  {p.offerDetails?.ctc && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
            style={{ maxWidth: '480px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Create Pipeline</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
            </div>

            <div className="input-group">
              <label className="input-label">Student ID</label>
              <input
                className="input-field"
                placeholder="Paste Student ObjectId..."
                value={newPipeline.studentId}
                onChange={e => setNewPipeline(p => ({ ...p, studentId: e.target.value }))}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Tip: Copy from the search results or bookmarks page
              </span>
            </div>

            <div className="input-group">
              <label className="input-label">Role / Position</label>
              <input
                className="input-field"
                placeholder="e.g., Frontend Developer"
                value={newPipeline.role}
                onChange={e => setNewPipeline(p => ({ ...p, role: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Message (Optional)</label>
              <textarea
                className="input-field"
                placeholder="Initial message to the candidate..."
                rows="3"
                value={newPipeline.recruiterMessage}
                onChange={e => setNewPipeline(p => ({ ...p, recruiterMessage: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button onClick={handleCreate} disabled={creating} className="btn btn-primary" style={{ width: '100%' }}>
              <Send size={16} /> {creating ? 'Creating...' : 'Create Pipeline'}
            </button>
          </motion.div>
        </div>
      )}
    </RecruiterLayout>
  );
};

export default RecruitmentPipelinePage;
