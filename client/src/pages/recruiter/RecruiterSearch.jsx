import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bookmark, BadgeCheck, Eye, Users, GitPullRequest, MessageSquare } from 'lucide-react';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import PlacementBadge from '../../components/PlacementBadge';
import { PLACEMENT_STATUSES } from '../../constants/placementConstants';
import api from '../../api/axios';

const RecruiterSearch = () => {
  const [developers, setDevelopers] = useState([]);
  const [filters, setFilters] = useState({ minScore: '', skills: '', university: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState([]);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.minScore) params.set('minScore', filters.minScore);
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
      // Store in sessionStorage and navigate
      sessionStorage.setItem('compareResult', JSON.stringify(res.data.data));
      window.location.href = '/dashboard/recruiter/compare';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RecruiterLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={28} /> Search Talent
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find and filter developer candidates within your access scope.</p>
      </header>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input className="input-field" placeholder="University..." value={filters.university}
          onChange={e => setFilters(f => ({ ...f, university: e.target.value }))} style={{ flex: 2, minWidth: '180px' }} />
        <input className="input-field" placeholder="Department..." value={filters.department}
          onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} style={{ flex: 1, minWidth: '150px' }} />
        <input className="input-field" placeholder="Skills (comma separated)" value={filters.skills}
          onChange={e => setFilters(f => ({ ...f, skills: e.target.value }))} style={{ flex: 1, minWidth: '150px' }} />
        <input className="input-field" placeholder="Min Score" type="number" value={filters.minScore}
          onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))} style={{ width: '120px' }} />
        <button onClick={fetchDevelopers} className="btn btn-primary btn-sm"><Search size={16} /> Search</button>
      </div>

      {/* Compare Bar */}
      {comparison.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.75rem 1.5rem' }}
        >
          <span><Users size={16} style={{ marginRight: '0.5rem' }} />{comparison.length} selected for comparison</span>
          <button onClick={handleCompare} className="btn btn-secondary btn-sm">Compare Now</button>
        </motion.div>
      )}

      {/* Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '180px' }} />)
        ) : (
          developers.map(dev => (
            <motion.div
              key={dev._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card"
              style={{ padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="avatar-gradient" style={{ width: '44px', height: '44px', fontSize: '1.1rem', flexShrink: 0 }}>
                  {dev.name?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {dev.name} {dev.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {dev.university?.name || 'N/A'} • {dev.university?.department || 'N/A'}
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{dev.scores?.overall || 0}</div>
              </div>

              {/* Placement Status */}
              {dev.placementStatus && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <PlacementBadge status={dev.placementStatus} company={dev.placedCompany} size="sm" />
                </div>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {dev.preferredDomain && <span className="badge badge-primary">{dev.preferredDomain}</span>}
                {dev.experienceLevel && <span className="badge badge-purple">{dev.experienceLevel}</span>}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleBookmark(dev._id)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                  <Bookmark size={14} /> Save
                </button>
                <button onClick={() => toggleCompare(dev._id)}
                  className={`btn btn-sm ${comparison.includes(dev._id) ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                  {comparison.includes(dev._id) ? '✓ Selected' : 'Compare'}
                </button>
                {dev.username && (
                  <a href={`/u/${dev.username}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="View Profile">
                    <Eye size={14} />
                  </a>
                )}
                <button
                  onClick={() => {
                    window.location.href = `/dashboard/messages?chat=${dev._id}`;
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-purple)' }}
                  title="Send Message"
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  onClick={() => {
                    const role = prompt('Enter role/position for this candidate:');
                    if (role) {
                      api.post('/placement/pipeline', { studentId: dev._id, role })
                        .then(() => alert('Pipeline created!'))
                        .catch(err => alert(err.response?.data?.message || 'Failed'));
                    }
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-emerald)' }}
                  title="Start Pipeline"
                >
                  <GitPullRequest size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!loading && developers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No candidates found matching your filters or access scope.
        </div>
      )}
    </RecruiterLayout>
  );
};

export default RecruiterSearch;
