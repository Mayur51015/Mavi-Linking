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
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bookmark size={22} style={{ color: 'var(--brand-blue)' }} /> Bookmarked Candidates
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{bookmarks.length} candidate{bookmarks.length !== 1 ? 's' : ''} saved for recruitment evaluation.</p>
      </header>

      {loading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '8px' }} />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          No bookmarks saved yet. Navigate to <strong>Search Talent</strong> to discover and bookmark prospective candidates.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {bookmarks.map((bm, i) => (
            <motion.div
              key={bm._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', flexWrap: 'wrap' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0 }}>
                {bm.developerId?.name?.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {bm.developerId?.name}
                  {bm.developerId?.isVerified && <BadgeCheck size={14} style={{ color: 'var(--brand-blue)' }} />}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {bm.developerId?.university?.name || 'N/A'} • Score: <strong style={{ color: 'var(--text-primary)' }}>{bm.developerId?.scores?.overall || 0}</strong>
                </div>
              </div>

              {/* Status Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={bm.status || 'reviewing'}
                  onChange={e => handleUpdateStatus(bm.developerId?._id, e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.625rem',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="reviewing">Reviewing</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="contacted">Contacted</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>

                <span className={`badge badge-${bm.status === 'hired' ? 'emerald' : bm.status === 'shortlisted' ? 'primary' : bm.status === 'rejected' ? 'red' : 'amber'}`} style={{ fontSize: '0.75rem' }}>
                  {bm.status || 'reviewing'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {bm.developerId?._id && (
                  <button
                    onClick={() => setReportCandidate(bm.developerId)}
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.5rem' }}
                    title="Recruiter AI Report"
                  >
                    <FileText size={14} />
                  </button>
                )}

                {bm.developerId?.username && (
                  <a href={`/u/${bm.developerId.username}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.35rem 0.5rem' }} title="View Profile">
                    <Eye size={14} />
                  </a>
                )}

                <button onClick={() => handleRemoveBookmark(bm.developerId?._id)} className="btn btn-outline-danger" style={{ padding: '0.35rem 0.5rem' }} title="Remove Bookmark">
                  <X size={14} />
                </button>
              </div>
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
            style={{ maxWidth: '560px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Candidate Dossier: {reportCandidate.name}</h2>
              <button onClick={() => setReportCandidate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={20} />
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
