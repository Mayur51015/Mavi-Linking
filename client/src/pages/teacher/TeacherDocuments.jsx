import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Search, Plus, Edit2, Trash2, Calendar, FileText, Loader2, AlertCircle, Upload, Eye, Download } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const TeacherDocuments = () => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/documents?search=${search}&page=${page}&limit=6`);
      setDocuments(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, search]);

  const handleOpenUpload = () => {
    setEditingDoc(null);
    setTitle('');
    setDescription('');
    const depts = user?.university?.department?.split(',').map(d => d.trim()).filter(Boolean) || [];
    setDepartment(depts[0] || 'All');
    setFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setDescription(doc.description || '');
    setDepartment(doc.department || 'All');
    setFile(null);
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Check size limit: 10MB
    if (selected.size > 10 * 1024 * 1024) {
      setError('File is too large. Max size is 10MB.');
      setFile(null);
      e.target.value = '';
      return;
    }

    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip', '.xls', '.xlsx', '.ppt', '.pptx'];
    const name = selected.name.toLowerCase();
    const matches = allowed.some(ext => name.endsWith(ext));
    if (!matches) {
      setError(`Invalid file type. Allowed files: ${allowed.join(', ')}`);
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selected);
    setError('');
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file. It may be missing from storage.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError('Document title is required.');
      return;
    }

    if (!editingDoc && !file) {
      setError('Please select a file to upload.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingDoc) {
        // Simple update: title, description, and department
        await api.put(`/documents/${editingDoc._id}`, { title, description, department });
      } else {
        // Upload file: requires FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('department', department);
        formData.append('file', file);

        await api.post('/documents', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      setModalOpen(false);
      fetchDocuments();
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.message || 'Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <TeacherLayout>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen size={28} className="text-gradient" /> College Document Repository
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Upload templates, sample resumes, syllabi, or official college guides for student access.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenUpload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Upload Document
        </button>
      </header>

      {/* Search Filter */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search documents by name or description..."
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
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-purple)' }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {documents.map((doc) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card-static"
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      width: '40px', height: '40px', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-purple)', flexShrink: 0
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'white', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {doc.title}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.fileName} ({formatBytes(doc.fileSize)})
                      </span>
                    </div>
                  </div>

                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.5rem'
                  }}>
                    {doc.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} /> {new Date(doc.createdAt).toLocaleDateString()}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '6px' }} onClick={() => handleDownload(doc._id, doc.fileName)} title="Download file">
                      <Download size={14} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '6px' }} onClick={() => handleOpenEdit(doc)} title="Edit details">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-outline-danger" style={{ padding: '0.4rem', borderRadius: '6px' }} onClick={() => handleDelete(doc._id)} title="Delete file">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {documents.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No shared documents found. Click 'Upload Document' to share materials.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
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
        </>
      )}

      {/* Upload/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-static"
              style={{ width: '100%', maxWidth: '500px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {editingDoc ? 'Edit Document Details' : 'Upload Resource Material'}
              </h2>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Target Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#09090b',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.95rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="All">All Departments</option>
                    {(user?.university?.department?.split(',') || []).map(d => d.trim()).filter(Boolean).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Document Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CSE Final Syllabus / Template Report"
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what resources or templates are included..."
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {!editingDoc && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Select File (Max 10MB)</label>
                    <div style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.01)',
                      position: 'relative',
                    }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        required
                        onChange={handleFileChange}
                        style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          opacity: 0, cursor: 'pointer'
                        }}
                      />
                      <Upload size={24} style={{ color: 'var(--accent-purple)', margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>
                        {file ? file.name : 'Drag & drop or click to choose file'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Supports PDF, Word, Excel, PPT, Zip, Images
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Uploading...' : (editingDoc ? 'Save Changes' : 'Upload Material')}
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

export default TeacherDocuments;
