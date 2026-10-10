import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Search, Plus, Edit2, Trash2, Calendar, User, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const TeacherAnnouncements = () => {
  const { user } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teacher/announcements?search=${search}&page=${page}&limit=5&departmentFilter=${departmentFilter}`);
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
  }, [page, search, departmentFilter]);

  const handleOpenCreate = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    const depts = user?.university?.department?.split(',').map(d => d.trim()).filter(Boolean) || [];
    setDepartment(depts[0] || 'All');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (ann) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setDepartment(ann.department || 'All');
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/teacher/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingAnn) {
        await api.put(`/teacher/announcements/${editingAnn._id}`, { title, content, department });
      } else {
        await api.post('/teacher/announcements', { title, content, department });
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TeacherLayout>
      <header style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Megaphone size={26} style={{ color: 'var(--brand-blue)' }} /> Department Announcements
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Publish academic notices, drive notifications, and updates to department students.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
          <Plus size={16} /> Create Announcement
        </button>
      </header>

      {/* Filter Row */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field"
            style={{
              paddingLeft: '2.5rem',
              marginBottom: 0,
              fontSize: '0.875rem',
            }}
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
          className="input-field"
          style={{
            marginBottom: 0,
            fontSize: '0.875rem',
            minWidth: '180px',
            width: 'auto',
          }}
        >
          <option value="">All Departments</option>
          {(user?.university?.department?.split(',') || []).map(d => d.trim()).filter(Boolean).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand-blue)' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {announcements.map((ann) => (
            <motion.div
              key={ann._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>{ann.title}</h3>
                  <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={13} /> {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={13} /> Posted by {ann.teacherId?.name || 'Faculty Member'}
                    </span>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{ann.department || 'All'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button className="btn btn-outline btn-sm" style={{ padding: '0.35rem 0.5rem' }} onClick={() => handleOpenEdit(ann)} title="Edit announcement">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-outline-danger btn-sm" style={{ padding: '0.35rem 0.5rem' }} onClick={() => handleDelete(ann._id)} title="Delete announcement">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', fontSize: '0.9rem', margin: 0 }}>{ann.content}</p>
            </motion.div>
          ))}

          {announcements.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No announcements match your search or department filter.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}>
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 120, padding: '1rem',
          }}>
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '560px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {editingAnn ? 'Edit Announcement' : 'Create New Announcement'}
              </h2>

              {error && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontSize: '0.85rem' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Target Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="input-field"
                  >
                    <option value="All">All Departments</option>
                    {(user?.university?.department?.split(',') || []).map(d => d.trim()).filter(Boolean).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Announcement Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Placement Drive Registration Deadline"
                    className="input-field"
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Announcement Content *</label>
                  <textarea
                    required
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide full description, guidelines, timings, and instructions..."
                    className="input-field"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </TeacherLayout>
  );
};

export default TeacherAnnouncements;
