import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bookmark, BadgeCheck, Eye, Users, GitPullRequest, MessageSquare, BrainCircuit, FileText, X } from 'lucide-react';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import PlacementBadge from '../../components/PlacementBadge';
import ReportGenerator from '../../components/ReportGenerator';

import api from '../../api/axios';

const RecruiterSearch = () => {
  const [developers, setDevelopers] = useState([]);
  const [filters, setFilters] = useState({ minScore: '', minReadiness: '', skills: '', university: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState([]);
  const [insightModal, setInsightModal] = useState(null);
  const [reportCandidate, setReportCandidate] = useState(null);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.minScore) params.set('minScore', filters.minScore);
      if (filters.minReadiness) params.set('minReadiness', filters.minReadiness);
      if (filters.skills) params.set('skills', filters.skills);
      if (filters.university) params.set('university', filters.university);
      if (filters.department) params.set('department', filters.department);
      const res = await api.get(`/recruiter/search?${params}`);
      setDevelopers(res.data.data.developers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevelopers(); }, []);

  const handleBookmark = async (devId) => {
    try {
      await api.post('/recruiter/bookmarks', { developerId: devId });
      alert('Developer bookmarked!');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCompare = (devId) => {
    setComparison(prev =>
      prev.includes(devId) ? prev.filter(id => id !== devId) : [...prev, devId].slice(0, 4)
    );
  };

  const handleCompare = async () => {
    if (comparison.length < 2) return;
    try {
      const res = await api.post('/recruiter/compare', { developerIds: comparison });
      sessionStorage.setItem('compareResult', JSON.stringify(res.data.data));
      window.location.href = '/dashboard/recruiter/compare';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RecruiterLayout>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={22} style={{ color: 'var(--brand-blue)' }} /> Search Candidate Talent
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Find and filter verified developer candidates within your authorized scope.</p>
      </header>

      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input-field" placeholder="University..." value={filters.university}
          onChange={e => setFilters(f => ({ ...f, university: e.target.value }))} style={{ flex: '2 1 180px', minWidth: '160px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
        <input className="input-field" placeholder="Department..." value={filters.department}
          onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} style={{ flex: '1 1 140px', minWidth: '130px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
        <input className="input-field" placeholder="Skills (comma separated)" value={filters.skills}
          onChange={e => setFilters(f => ({ ...f, skills: e.target.value }))} style={{ flex: '1 1 160px', minWidth: '150px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
        <input className="input-field" placeholder="Min Score" type="number" value={filters.minScore}
          onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))} style={{ width: '110px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
        <input className="input-field" placeholder="Min Readiness %" type="number" value={filters.minReadiness}
          onChange={e => setFilters(f => ({ ...f, minReadiness: e.target.value }))} style={{ width: '135px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
        <button onClick={fetchDevelopers} className="btn btn-primary" disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Search size={15} /> {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {comparison.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', padding: '0.75rem 1.25rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} style={{ color: 'var(--brand-blue)' }} /> {comparison.length} selected for comparison
          </span>
          <button onClick={handleCompare} className="btn btn-secondary" style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}>Compare Now</button>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '8px' }} />)
        ) : (
          developers.map((dev, i) => (
            <motion.div
              key={dev._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.95rem', flexShrink: 0 }}>
                    {dev.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                      <span>{dev.name}</span>
                      {dev.isVerified && <BadgeCheck size={14} style={{ color: 'var(--brand-blue)' }} />}
                      {dev.etxId && <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dev.etxId}</span>}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dev.university?.name || 'N/A'} • {dev.university?.department || 'N/A'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dev.scores?.overall || 0}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Readiness: {dev.placementReadinessScore || 0}%</div>
                  </div>
                </div>

                {dev.placementStatus && <div style={{ marginBottom: '0.75rem' }}><PlacementBadge status={dev.placementStatus} company={dev.placedCompany} size="sm" /></div>}

                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {dev.preferredDomain && <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{dev.preferredDomain}</span>}
                  {dev.experienceLevel && <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>{dev.experienceLevel}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <button onClick={() => handleBookmark(dev._id)} className="btn btn-outline" style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}><Bookmark size={13} /> Save</button>
                <button onClick={() => toggleCompare(dev._id)} className={`btn ${comparison.includes(dev._id) ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}>
                  {comparison.includes(dev._id) ? '✓ Selected' : 'Compare'}
                </button>
                {dev.username && <a href={`/u/${dev.username}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.35rem 0.5rem' }} title="View Profile"><Eye size={13} /></a>}
                <button onClick={() => setReportCandidate(dev)} className="btn btn-outline" style={{ padding: '0.35rem 0.5rem' }} title="Recruiter AI Report">
                  <FileText size={13} />
                </button>
                <button onClick={() => setInsightModal(dev)} className="btn btn-outline" style={{ padding: '0.35rem 0.5rem' }} title="AI Insights"><BrainCircuit size={13} /></button>
                <button onClick={() => { window.location.href = `/dashboard/messages?chat=${dev._id}`; }} className="btn btn-outline" style={{ padding: '0.35rem 0.5rem' }} title="Send Message"><MessageSquare size={13} /></button>
                <button onClick={() => { const role = prompt('Enter role/position for this candidate:'); if (role) { api.post('/placement/pipeline', { studentId: dev._id, role }).then(() => alert('Pipeline created!')).catch(err => alert(err.response?.data?.message || 'Failed')); } }} className="btn btn-outline" style={{ padding: '0.35rem 0.5rem' }} title="Start Pipeline"><GitPullRequest size={13} /></button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!loading && developers.length === 0 && (
        <div style={{ background: '#FFFFFF', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          No candidates found matching your filters or access scope.
        </div>
      )}

      {insightModal && (
        <div className="modal-overlay" onClick={() => setInsightModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BrainCircuit size={20} style={{ color: 'var(--brand-blue)' }} /> Evaluation Insights: {insightModal.name}
              </h2>
              <button onClick={() => setInsightModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>Assessment Summary</h4>
              <p style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '0.875rem', borderRadius: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {insightModal.aiAnalysis?.hiringRecommendation || 'Not enough data to form an evaluation summary.'}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <h4 style={{ color: '#059669', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Key Strengths</h4>
                <ul style={{ listStyle: 'inside', color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                  {insightModal.aiAnalysis?.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  {!insightModal.aiAnalysis?.strengths?.length && <li>No specific strengths recorded.</li>}
                </ul>
              </div>
              <div>
                <h4 style={{ color: '#DC2626', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Areas for Growth</h4>
                <ul style={{ listStyle: 'inside', color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                  {insightModal.aiAnalysis?.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                  {!insightModal.aiAnalysis?.weaknesses?.length && <li>No specific growth areas recorded.</li>}
                </ul>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setInsightModal(null)} className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Close</button>
            </div>
          </motion.div>
        </div>
      )}

      {reportCandidate && (
        <div className="modal-overlay" onClick={() => setReportCandidate(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Candidate Dossier: {reportCandidate.name}</h2>
              <button onClick={() => setReportCandidate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
            </div>
            <ReportGenerator candidateId={reportCandidate._id || reportCandidate.id} candidate={reportCandidate} />
          </motion.div>
        </div>
      )}
    </RecruiterLayout>
  );
};

export default RecruiterSearch;
