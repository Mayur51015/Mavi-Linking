import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, X, Eye, BadgeCheck, FileText } from 'lucide-react';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import ReportGenerator from '../../components/ReportGenerator';
import api from '../../api/axios';

const RecruiterBookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportCandidate, setReportCandidate] = useState(null);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recruiter/bookmarks');
      setBookmarks(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookmarks(); }, []);

  const handleRemoveBookmark = async (devId) => {
    try {
      await api.delete(`/recruiter/bookmarks/${devId}`);
      fetchBookmarks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (devId, status) => {
    try {
      await api.put(`/recruiter/bookmarks/${devId}`, { status });
      fetchBookmarks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RecruiterLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bookmark size={28} /> Bookmarked Candidates
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{bookmarks.length} candidate{bookmarks.length !== 1 ? 's' : ''} saved.</p>
      </header>

      {loading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No bookmarks yet. Go to <strong>Search Talent</strong> to find and save candidates.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {bookmarks.map((bm, i) => (
            <motion.div
              key={bm._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}
            >
              <div className="avatar-gradient" style={{ width: '40px', height: '40px', fontSize: '1rem', flexShrink: 0 }}>
                {bm.developerId?.name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {bm.developerId?.name}
                  {bm.developerId?.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {bm.developerId?.university?.name || 'N/A'} • Score: {bm.developerId?.scores?.overall || 0}
                </div>
              </div>

              {/* Status Selector */}
              <select
                value={bm.status || 'reviewing'}
                onChange={e => handleUpdateStatus(bm.developerId?._id, e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8rem',
                }}
              >
                <option value="reviewing">Reviewing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="contacted">Contacted</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>

              <span className={`badge badge-${bm.status === 'hired' ? 'emerald' : bm.status === 'shortlisted' ? 'primary' : bm.status === 'rejected' ? 'pink' : 'amber'}`}>
                {bm.status || 'reviewing'}
              </span>

              {bm.developerId?._id && (
                <button
                  onClick={() => setReportCandidate(bm.developerId)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-blue)' }}
                  title="Recruiter AI Report"
                >
                  <FileText size={16} />
                </button>
              )}

              {bm.developerId?.username && (
                <a href={`/u/${bm.developerId.username}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="View Profile">
                  <Eye size={16} />
                </a>
              )}

              <button onClick={() => handleRemoveBookmark(bm.developerId?._id)} className="btn btn-ghost btn-sm" style={{ color: '#fca5a5' }} title="Remove Bookmark">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {reportCandidate && (
        <div className="modal-overlay" onClick={() => setReportCandidate(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '560px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.35rem' }}>Recruiter AI Report: {reportCandidate.name}</h2>
              <button onClick={() => setReportCandidate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <ReportGenerator candidateId={reportCandidate._id} candidate={reportCandidate} />
          </motion.div>
        </div>
      )}
    </RecruiterLayout>
  );
};

export default RecruiterBookmarks;
