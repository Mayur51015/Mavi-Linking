import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Search, Calendar, User, Loader2 } from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import api from '../api/axios';

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deptFilter, setDeptFilter] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/announcements/my-college?search=${search}&page=${page}&limit=6&departmentFilter=${deptFilter}`);
      setAnnouncements(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, search, deptFilter]);

  return (
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Megaphone size={28} className="text-gradient" /> Campus Notices & Drives
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Stay updated with the latest announcements, schedules, and placement notifications from your college.</p>
      </header>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search notices by title or content..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.75rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          style={{
            padding: '0.625rem 1rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '0.9rem',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '180px',
          }}
        >
          <option value="" style={{ background: '#09090b' }}>All Departments</option>
          <option value="CSE" style={{ background: '#09090b' }}>Computer Science (CSE)</option>
          <option value="IT" style={{ background: '#09090b' }}>Information Technology (IT)</option>
          <option value="ECE" style={{ background: '#09090b' }}>Electronics (ECE)</option>
          <option value="EE" style={{ background: '#09090b' }}>Electrical (EE)</option>
          <option value="ME" style={{ background: '#09090b' }}>Mechanical (ME)</option>
          <option value="CE" style={{ background: '#09090b' }}>Civil (CE)</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-purple)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {announcements.map((ann) => (
            <motion.div
              key={ann._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-static"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>{ann.title}</h3>
                  <span className="badge badge-primary">{ann.department || 'All Departments'}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} /> {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={14} /> Posted by {ann.teacherId?.name || 'College Office'}
                  </span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.925rem', whiteSpace: 'pre-line' }}>
                {ann.content}
              </p>
            </motion.div>
          ))}

          {announcements.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No campus announcements posted at this time.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>
                Prev
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}>
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
};

export default StudentAnnouncements;
