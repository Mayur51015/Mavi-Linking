import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Search, Calendar, FileText, Loader2, Download } from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import api from '../api/axios';

const StudentDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deptFilter, setDeptFilter] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/documents?search=${search}&page=${page}&limit=6&departmentFilter=${deptFilter}`);
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
  }, [page, search, deptFilter]);

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
      alert('Failed to download document. It may be missing from storage.');
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
    <UserLayout>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderOpen size={28} className="text-gradient" /> Learning Resources & Templates
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Access official guides, report templates, placement syllabi, and sample code shared by college faculties.</p>
      </header>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Posted {new Date(doc.createdAt).toLocaleDateString()}
                  </div>

                  <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }} onClick={() => handleDownload(doc._id, doc.fileName)}>
                    <Download size={14} /> Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {documents.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No shared documents found for your college/department.
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
    </UserLayout>
  );
};

export default StudentDocuments;
