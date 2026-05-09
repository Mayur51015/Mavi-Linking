import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bookmark, Users, BadgeCheck, X, Eye } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';

const RecruiterDashboard = () => {
  const [tab, setTab] = useState('search');
  const [developers, setDevelopers] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [filters, setFilters] = useState({ minScore: '', skills: '', university: '' });
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState([]);
  const [compareResult, setCompareResult] = useState(null);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.minScore) params.set('minScore', filters.minScore);
      if (filters.skills) params.set('skills', filters.skills);
      if (filters.university) params.set('university', filters.university);
      const res = await api.get(`/recruiter/search?${params}`);
      setDevelopers(res.data.data.developers || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/recruiter/bookmarks');
      setBookmarks(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (tab === 'search') fetchDevelopers();
    if (tab === 'bookmarks') fetchBookmarks();
  }, [tab]);

  const handleBookmark = async (devId) => {
    try { await api.post('/recruiter/bookmarks', { developerId: devId }); fetchBookmarks(); }
    catch (err) { console.error(err); }
  };

  const handleRemoveBookmark = async (devId) => {
    try { await api.delete(`/recruiter/bookmarks/${devId}`); fetchBookmarks(); }
    catch (err) { console.error(err); }
  };

  const toggleCompare = (devId) => {
    setComparison(prev => prev.includes(devId) ? prev.filter(id => id !== devId) : [...prev, devId].slice(0, 4));
  };

  const handleCompare = async () => {
    if (comparison.length < 2) return;
    try {
      const res = await api.post('/recruiter/compare', { developerIds: comparison });
      setCompareResult(res.data.data);
      setTab('compare');
    } catch (err) { console.error(err); }
  };

  return (
    <DashboardLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Recruiter Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Search, compare, and bookmark developer talent.</p>
      </header>

      <div className="tabs">
        {[
          { key: 'search', label: 'Search', icon: <Search size={16} /> },
          { key: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={16} /> },
          { key: 'compare', label: 'Compare', icon: <Users size={16} /> },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input className="input-field" placeholder="University..." value={filters.university}
              onChange={e => setFilters(f => ({ ...f, university: e.target.value }))} style={{ flex: 2, minWidth: '180px' }} />
            <input className="input-field" placeholder="Skills (comma separated)" value={filters.skills}
              onChange={e => setFilters(f => ({ ...f, skills: e.target.value }))} style={{ flex: 1, minWidth: '150px' }} />
            <input className="input-field" placeholder="Min Score" type="number" value={filters.minScore}
              onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))} style={{ width: '120px' }} />
            <button onClick={fetchDevelopers} className="btn btn-primary btn-sm"><Search size={16} /> Search</button>
          </div>

          {comparison.length >= 2 && (
            <div className="glass-card-static" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.75rem 1.5rem' }}>
              <span>{comparison.length} selected</span>
              <button onClick={handleCompare} className="btn btn-secondary btn-sm">Compare Now</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {loading ? [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '160px' }} />) :
              developers.map(dev => (
                <div key={dev._id} className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="avatar-gradient" style={{ width: '44px', height: '44px', fontSize: '1.1rem', flexShrink: 0 }}>
                      {dev.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {dev.name} {dev.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{dev.username || 'N/A'}</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{dev.scores?.overall || 0}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleBookmark(dev._id)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                      <Bookmark size={14} /> Save
                    </button>
                    <button onClick={() => toggleCompare(dev._id)}
                      className={`btn btn-sm ${comparison.includes(dev._id) ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                      {comparison.includes(dev._id) ? '✓ Selected' : 'Compare'}
                    </button>
                    <a href={`/u/${dev.username || dev.platforms?.github?.username}`} target="_blank" className="btn btn-ghost btn-sm">
                      <Eye size={14} />
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {tab === 'bookmarks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No bookmarks yet.</div>
          ) : bookmarks.map(bm => (
            <div key={bm._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', marginBottom: '0.5rem' }}>
              <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>{bm.developerId?.name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{bm.developerId?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score: {bm.developerId?.scores?.overall || 0}</div>
              </div>
              <span className={`badge badge-${bm.status === 'hired' ? 'emerald' : 'primary'}`}>{bm.status}</span>
              <button onClick={() => handleRemoveBookmark(bm.developerId?._id)} className="btn btn-ghost btn-sm" style={{ color: '#fca5a5' }}><X size={16} /></button>
            </div>
          ))}
        </motion.div>
      )}

      {tab === 'compare' && compareResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareResult.length}, 1fr)`, gap: '1.5rem' }}>
            {compareResult.map(dev => (
              <div key={dev.id} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div className="avatar-gradient" style={{ width: '56px', height: '56px', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>{dev.name?.charAt(0)}</div>
                <div style={{ fontWeight: '600', marginBottom: '1rem' }}>{dev.name}</div>
                {['development', 'problemSolving', 'knowledge', 'overall'].map(key => (
                  <div key={key} style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{dev.scores?.[key] || 0}</span>
                    </div>
                    <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${((dev.scores?.[key] || 0) / 1000) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default RecruiterDashboard;
