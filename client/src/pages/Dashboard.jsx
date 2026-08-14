import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import {
  Globe, GitBranch, Code2, CheckCircle, FileText,
  Briefcase, Calendar, BarChart3, AlertCircle, Upload, QrCode,
  Eye, Download, Plus, Edit2, Trash2, Search, X
} from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import DNACard from '../components/DNACard';
import SkillRadar from '../components/SkillRadar';
import ActivityFeed from '../components/ActivityFeed';
import GrowthChart from '../components/GrowthChart';
import LeaderboardWidget from '../components/LeaderboardWidget';
import ReportGenerator from '../components/ReportGenerator';
import LeetCodeSection from '../components/leetcode/LeetCodeSection';
import Messages from '../pages/Messages';
import TimelineWidget from '../components/TimelineWidget';
import BadgeShowcase from '../components/BadgeShowcase';
import { SkeletonCard } from '../components/ui/Skeleton';
const Dashboard = () => {
  const { user, setUser, socket, refreshUser } = useContext(AuthContext);
  const [scores, setScores] = useState(null);
  const [rankStatus, setRankStatus] = useState({ loading: true, value: null, error: false });
  const [loading, setLoading] = useState(true);
  const [loadingDNA, setLoadingDNA] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Custom states for new modules
  const [pipelines, setPipelines] = useState([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});

  // Toast notification state
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Doc form error state
  const [docError, setDocError] = useState('');

  // Certificate states
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certCategory, setCertCategory] = useState('Technical');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certCredentialId, setCertCredentialId] = useState('');
  const [certVerificationUrl, setCertVerificationUrl] = useState('');
  const [certDescription, setCertDescription] = useState('');
  const [certFile, setCertFile] = useState(null);
  
  const [certSearch, setCertSearch] = useState('');
  const [certCategoryFilter, setCertCategoryFilter] = useState('');
  const [certSortOrder, setCertSortOrder] = useState('newest');
  const [savingCert, setSavingCert] = useState(false);

  // ─── Portfolio Document states ────────────────────────────────────────────
  const PORT_CATEGORIES = ['Resume', 'Certificate', 'Marksheet', 'Project Report', 'Internship', 'Achievement', 'Research Paper', 'Other'];
  const CATEGORY_COLORS = {
    'Resume':          'badge-blue',
    'Certificate':     'badge-purple',
    'Marksheet':       'badge-amber',
    'Project Report':  'badge-cyan',
    'Internship':      'badge-emerald',
    'Achievement':     'badge-red',
    'Research Paper':  'badge-indigo',
    'Other':           'badge-gray',
  };
  const [docModalOpen,      setDocModalOpen]      = useState(false);
  const [editingDoc,        setEditingDoc]        = useState(null);
  const [docTitle,          setDocTitle]          = useState('');
  const [docCategory,       setDocCategory]       = useState('Other');
  const [docDescription,    setDocDescription]    = useState('');
  const [docFile,           setDocFile]           = useState(null);
  const [docSearch,         setDocSearch]         = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('');
  const [docSortOrder,      setDocSortOrder]      = useState('newest');
  const [savingDoc,         setSavingDoc]         = useState(false);

  // AI State
  const [aiData, setAiData] = useState({ insight: null, dna: null, analytics: [] });
  const [generatingAI, setGeneratingAI] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoadingDNA(true);
    setRankStatus(prev => ({ ...prev, loading: true, error: false }));
    try {
      let scoreRes;
      try {
        scoreRes = await api.get('/career/score');
      } catch (scoreErr) {
        console.warn('Failed to fetch career score:', scoreErr.message);
        setRankStatus({ loading: false, value: null, error: true });
        scoreRes = { data: { data: { overall: 0, development: 0, problemSolving: 0, community: 0, rank: null } } };
      }

      const scoreData = scoreRes.data?.data;
      setScores(scoreData);

      if (scoreData && scoreData.rank !== undefined && scoreData.rank !== null) {
        setRankStatus({ loading: false, value: scoreData.rank, error: false });
      } else if (!scoreRes.data?.data) {
        // Leave error status if request threw
      } else {
        setRankStatus({ loading: false, value: null, error: false });
      }

      // Fetch other indicators in parallel
      const emptyFallback = { data: { data: null } };
      const arrayFallback = { data: { data: [] } };

      const [insightRes, dnaRes, analyticsRes, pipelineRes, projectRes, annRes] = await Promise.all([
        api.get('/career/insights').catch(() => emptyFallback),
        api.get('/career/dna').catch(() => emptyFallback),
        api.get('/ai/analytics').catch(() => arrayFallback),
        api.get('/placement/student/pipelines').catch(() => arrayFallback),
        api.get('/projects').catch(() => ({ data: { data: [], count: 0 } })),
        api.get('/announcements/my-college').catch(() => arrayFallback),
      ]);
      
      setAiData({
        insight: insightRes.data.data,
        dna: dnaRes.data.data,
        analytics: analyticsRes.data.data || []
      });

      setPipelines(pipelineRes.data.data || []);
      setProjectsCount(projectRes.data.count || projectRes.data.data?.length || 0);
      setAnnouncements(annRes.data.data || []);
      
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
      setLoadingDNA(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time update via Socket.IO
  useEffect(() => {
    if (socket) {
      const onCareerUpdate = async () => {
        console.log('Real-time career update received over Socket.IO');
        await refreshUser();
        await fetchDashboardData();
      };
      socket.on('career_update', onCareerUpdate);
      socket.on('new_timeline_event', onCareerUpdate);
      return () => {
        socket.off('career_update', onCareerUpdate);
        socket.off('new_timeline_event', onCareerUpdate);
      };
    }
  }, [socket, refreshUser, fetchDashboardData]);

  const handleGenerateAIInsights = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post('/career/recalculate');
      if (res.data?.data) {
        setUser(res.data.data);
      }
      await fetchDashboardData();
      showToast('success', 'Insights recalculated successfully.');
    } catch (err) {
      console.error('AI generation error:', err);
      showToast('error', err.response?.data?.message || 'Failed to recalculate.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Profile Completion logic
  const calculateCompletion = () => {
    let score = 0;
    const missing = [];
    if (user?.avatar) score += 10; else missing.push('Profile Avatar');
    if (user?.bio) score += 10; else missing.push('Bio Description');
    if (user?.university?.name) score += 20; else missing.push('College Details');
    if (user?.platforms?.github?.username) score += 15; else missing.push('GitHub Link');
    if (projectsCount > 0) score += 15; else missing.push('Showcase Projects');
    if (user?.certificates?.length > 0) score += 15; else missing.push('Certificates');
    if (user?.portfolioDocs?.length > 0) score += 15; else missing.push('Portfolio Documents');
    return { score, missing };
  };

  const { score: completionScore, missing: missingSections } = calculateCompletion();

  // Document Upload, Download, and Preview handlers
  const fileInputRef = useRef(null);
  const [activeDocType, setActiveDocType] = useState(null);

  const handleUploadClick = (docType) => {
    setActiveDocType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeDocType) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Max size is 10MB.');
      e.target.value = '';
      return;
    }

    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const name = file.name.toLowerCase();
    const matches = allowed.some(ext => name.endsWith(ext));
    if (!matches) {
      alert(`Invalid file type. Allowed formats: ${allowed.join(', ')}`);
      e.target.value = '';
      return;
    }

    setUploadStatus(prev => ({ ...prev, [activeDocType]: 'Uploading...' }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/auth/document/${activeDocType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(res.data.data.user);
      setUploadStatus(prev => ({ ...prev, [activeDocType]: 'Uploaded!' }));
    } catch (err) {
      console.error(err);
      setUploadStatus(prev => ({ ...prev, [activeDocType]: 'Failed' }));
      alert(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadDoc = async (type) => {
    try {
      const res = await api.get(`/auth/document/${type}?download=true`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let fileUrl = '';
      if (user.documents?.list) {
        const docItem = user.documents.list.find(d => d.type === type);
        if (docItem) fileUrl = docItem.fileUrl;
      }
      if (!fileUrl && user.documents) {
        fileUrl = user.documents[type];
      }

      const ext = fileUrl ? fileUrl.substring(fileUrl.lastIndexOf('.')) : '.pdf';
      link.setAttribute('download', `${type}-${user.name.replace(/\s+/g, '_')}${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download document. It may be missing.');
    }
  };

  const handlePreviewDoc = async (type) => {
    try {
      const res = await api.get(`/auth/document/${type}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      alert('Failed to preview document. It may be missing.');
    }
  };

  const handleDeleteDoc = async (type) => {
    if (!window.confirm(`Are you sure you want to delete your ${type.toUpperCase()} document?`)) return;
    try {
      const res = await api.delete(`/auth/document/${type}`);
      setUser(res.data.data.user);
      alert('Document deleted successfully.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  // Certificate CRUD handlers
  const handleOpenCertModal = (cert = null) => {
    if (cert) {
      setEditingCert(cert);
      setCertTitle(cert.title);
      setCertIssuer(cert.issuer || '');
      setCertCategory(cert.category || 'Technical');
      setCertIssueDate(cert.issueDate ? cert.issueDate.substring(0, 10) : '');
      setCertExpiryDate(cert.expiryDate ? cert.expiryDate.substring(0, 10) : '');
      setCertCredentialId(cert.credentialId || '');
      setCertVerificationUrl(cert.verificationUrl || '');
      setCertDescription(cert.description || '');
      setCertFile(null);
    } else {
      setEditingCert(null);
      setCertTitle('');
      setCertIssuer('');
      setCertCategory('Technical');
      setCertIssueDate('');
      setCertExpiryDate('');
      setCertCredentialId('');
      setCertVerificationUrl('');
      setCertDescription('');
      setCertFile(null);
    }
    setCertModalOpen(true);
  };

  const handleSaveCertificate = async (e) => {
    e.preventDefault();
    if (!certTitle) return;

    setSavingCert(true);
    try {
      const formData = new FormData();
      formData.append('title', certTitle);
      formData.append('issuer', certIssuer);
      formData.append('category', certCategory);
      if (certIssueDate) formData.append('issueDate', certIssueDate);
      if (certExpiryDate) formData.append('expiryDate', certExpiryDate);
      formData.append('credentialId', certCredentialId);
      formData.append('verificationUrl', certVerificationUrl);
      formData.append('description', certDescription);
      if (certFile) {
        formData.append('file', certFile);
      }

      let res;
      if (editingCert) {
        res = await api.put(`/auth/certificate/${editingCert._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        if (!certFile) {
          alert('Please select a certificate file to upload.');
          setSavingCert(false);
          return;
        }
        res = await api.post('/auth/certificate', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setUser(res.data.data.user);
      setCertModalOpen(false);
      alert(editingCert ? 'Certificate updated successfully!' : 'Certificate uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save certificate.');
    } finally {
      setSavingCert(false);
    }
  };

  const handleDeleteCertificate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;
    try {
      const res = await api.delete(`/auth/certificate/${id}`);
      setUser(res.data.data.user);
      alert('Certificate deleted successfully.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete certificate.');
    }
  };

  const handleDownloadCertificate = async (id, title) => {
    try {
      const res = await api.get(`/auth/certificate/${id}/file?download=true`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const cert = user.certificates.find(c => c._id === id);
      const ext = cert?.fileUrl ? cert.fileUrl.substring(cert.fileUrl.lastIndexOf('.')) : '.pdf';
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download certificate file.');
    }
  };

  const handlePreviewCertificate = async (id) => {
    try {
      const res = await api.get(`/auth/certificate/${id}/file`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      alert('Failed to preview certificate file.');
    }
  };

  // Main student pipeline tracking
  const activePipeline = pipelines.find(p => !['Rejected', 'Placed', 'Joined'].includes(p.status)) || pipelines[0];
  const steps = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Technical Round', 'HR Round', 'Selected', 'Offer Sent', 'Joined'];
  const activeStepIndex = activePipeline ? steps.indexOf(activePipeline.status) : -1;

  // Certificate filter + sort function
  const getFilteredCertificates = () => {
    const certificates = user?.certificates || [];
    let filtered = certificates.filter(cert => {
      if (!cert) return false;
      const searchLower = (certSearch || '').toLowerCase();
      const matchesSearch =
        !searchLower ||
        (cert.title || '').toLowerCase().includes(searchLower) ||
        (cert.issuer || '').toLowerCase().includes(searchLower);
      const matchesCategory =
        !certCategoryFilter ||
        (cert.category || '') === certCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    filtered = [...filtered].sort((a, b) => {
      const dateA = a?.issueDate ? new Date(a.issueDate) : new Date(0);
      const dateB = b?.issueDate ? new Date(b.issueDate) : new Date(0);
      return certSortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  // ─── Portfolio Document CRUD handlers ─────────────────────────────────────

  const openDocModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setDocTitle(doc.title || '');
      setDocCategory(doc.category || 'Other');
      setDocDescription(doc.description || '');
      setDocFile(null);
    } else {
      setEditingDoc(null);
      setDocTitle('');
      setDocCategory('Other');
      setDocDescription('');
      setDocFile(null);
    }
    setDocError('');
    setDocModalOpen(true);
  };

  const validateDocFile = (file) => {
    if (!file) return '';
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const name = file.name.toLowerCase();
    const hasValidExt = allowed.some(ext => name.endsWith(ext));
    if (!hasValidExt) return `Invalid file type. Allowed: ${allowed.join(', ')}`;
    if (file.size > 10 * 1024 * 1024) return 'File is too large. Maximum size is 10 MB.';
    return '';
  };

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    setDocError('');
    if (!docTitle.trim()) { setDocError('Document title is required.'); return; }
    if (!docCategory) { setDocError('Please select a category.'); return; }

    // File validation
    if (!editingDoc && !docFile) { setDocError('Please select a file to upload.'); return; }
    if (docFile) {
      const fileErr = validateDocFile(docFile);
      if (fileErr) { setDocError(fileErr); return; }
    }

    setSavingDoc(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle.trim());
      formData.append('category', docCategory);
      formData.append('description', docDescription);
      if (docFile) formData.append('file', docFile);
      let res;
      if (editingDoc) {
        res = await api.put(`/auth/portfolio-doc/${editingDoc._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = await api.post('/auth/portfolio-doc', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setUser(res.data.data.user);
      setDocModalOpen(false);
      showToast('success', editingDoc ? 'Document updated successfully!' : 'Document uploaded successfully!');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Network error. Please check your connection.' : 'Failed to save document.');
      setDocError(msg);
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeletePortfolioDoc = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      const res = await api.delete(`/auth/portfolio-doc/${id}`);
      setUser(res.data.data.user);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  const handlePreviewPortfolioDoc = async (id) => {
    try {
      const res = await api.get(`/auth/portfolio-doc/${id}/file`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      window.open(window.URL.createObjectURL(blob), '_blank');
    } catch (err) {
      console.error(err);
      alert('Preview failed. File may be missing.');
    }
  };

  const handleDownloadPortfolioDoc = async (doc) => {
    try {
      const res = await api.get(`/auth/portfolio-doc/${doc._id}/file?download=true`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = doc.originalName ? doc.originalName.substring(doc.originalName.lastIndexOf('.')) : '.pdf';
      link.setAttribute('download', `${doc.title.replace(/\s+/g, '_')}${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Download failed.');
    }
  };

  const getFilteredDocs = () => {
    const docs = user?.portfolioDocs || [];
    let filtered = docs.filter(doc => {
      if (!doc) return false;
      const q = (docSearch || '').toLowerCase();
      const matchSearch = !q ||
        (doc.title || '').toLowerCase().includes(q) ||
        (doc.category || '').toLowerCase().includes(q) ||
        (doc.description || '').toLowerCase().includes(q);
      const matchCat = !docCategoryFilter || doc.category === docCategoryFilter;
      return matchSearch && matchCat;
    });
    return [...filtered].sort((a, b) => {
      const da = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
      const db = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
      return docSortOrder === 'oldest' ? da - db : db - da;
    });
  };

  const getFileExt = (doc) => {
    if (doc.originalName) {
      return doc.originalName.substring(doc.originalName.lastIndexOf('.')).toLowerCase();
    }
    if (doc.fileUrl) {
      return doc.fileUrl.substring(doc.fileUrl.lastIndexOf('.')).toLowerCase();
    }
    return '';
  };

  return (

    <UserLayout>
<header className="dashboard-header-row" style={{ marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h1 className="dashboard-title" style={{ margin: 0 }}>Welcome, {user?.name}</h1>
            {(user?.maviId || user?._id) && (
              <button
                onClick={() => {
                  const displayId = user?.maviId || `MAVI-${user._id.slice(-8).toUpperCase()}`;
                  navigator.clipboard.writeText(displayId);
                  showToast('success', `MAVI ID (${displayId}) copied to clipboard!`);
                }}
                className="badge badge-purple"
                style={{
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  border: '1px solid var(--accent-purple)',
                  padding: '0.25rem 0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                }}
                title="Click to copy your permanent MAVI ID"
              >
                <span>{user?.maviId || `MAVI-${user._id.slice(-8).toUpperCase()}`}</span>
              </button>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your developer portfolio, campus placements, and recruiter feedback.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--gradient-primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>Global Rank</div>
              <div className="text-gradient" style={{ fontSize: '1rem', fontWeight: '800' }}>
                {rankStatus.loading
                  ? 'Loading...'
                  : rankStatus.error
                  ? 'Unavailable'
                  : rankStatus.value !== null && rankStatus.value !== undefined
                  ? `#${rankStatus.value.toLocaleString()}`
                  : 'Unranked'}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleGenerateAIInsights} 
            disabled={generatingAI} 
            className="btn btn-primary"
          >
            {generatingAI ? 'Syncing...' : 'Sync AI DNA'}
          </button>
        </div>
      </header>

      {/* Tabs */}
<div className="dashboard-tabs" style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        {['overview', 'career', 'placement', 'documents', 'announcements', 'messages'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab ? 'white' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--accent-purple)' : 'none',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '600',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
            }}
          >            {tab === 'placement' ? 'Placements' : tab === 'documents' ? 'Documents & Build' : tab === 'career' ? 'Career Intelligence' : tab === 'messages' ? 'Messages' : tab}
          </button>
        ))}
      </div>

{loading ? (
        <div className="animate-fade-in" aria-busy="true" aria-label="Loading dashboard">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <SkeletonCard lines={1} height="110px" />
            <SkeletonCard lines={1} height="110px" />
            <SkeletonCard lines={1} height="110px" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <SkeletonCard lines={4} height="320px" />
            <SkeletonCard lines={4} height="320px" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <SkeletonCard lines={3} height="260px" />
            <SkeletonCard lines={3} height="260px" />
          </div>
        </div>
      ) : (        <>
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Overall Score</h3>
                    <Globe size={20} color="var(--accent-blue)" />
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>
                    {scores?.overall || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 1000</span>
                  </div>
                </div>

                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Development</h3>
                    <GitBranch size={20} color="var(--text-primary)" />
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>
                    {scores?.development || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 1000</span>
                  </div>
                </div>

                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Problem Solving</h3>
                    <Code2 size={20} color="var(--accent-purple)" />
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>
                    {scores?.problemSolving || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 1000</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <DNACard dna={aiData.dna} loading={loadingDNA} />
                <SkillRadar />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <GrowthChart analytics={aiData.analytics} />
                <LeaderboardWidget />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <ActivityFeed />
                <ReportGenerator candidateId={user?._id} candidate={user} />
              </div>

              <LeetCodeSection />
            </div>
          )}

          {activeTab === 'career' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Performance Score</h3>
                  <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent-blue)" strokeWidth="3" strokeDasharray={`${Math.max(0, (user?.scores?.overall || 0) / 10)}, 100`} />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{user?.scores?.overall || 0}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 1000</span>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card">
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>AI Insights</h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>Strengths</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {(user?.aiAnalysis?.strengths || []).map((s, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>• {s}</li>)}
                      {!(user?.aiAnalysis?.strengths?.length > 0) && <li style={{ color: 'var(--text-muted)' }}>No strengths generated yet.</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--accent-red)', marginBottom: '0.5rem' }}>Areas for Growth</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {(user?.aiAnalysis?.weaknesses || []).map((w, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>• {w}</li>)}
                      {!(user?.aiAnalysis?.weaknesses?.length > 0) && <li style={{ color: 'var(--text-muted)' }}>No weaknesses generated yet.</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <TimelineWidget userId={user?._id} />
                <BadgeShowcase userId={user?._id} />
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="animate-fade-in">
              <Messages />
            </div>
          )}

          {activeTab === 'placement' && (
            <div className="animate-fade-in" style={{ display: 'grid', gap: '2rem' }}>
              {/* Timeline Tracker */}
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase style={{ color: 'var(--accent-purple)' }} /> Active Hiring Progress
                </h3>
                {activePipeline ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1.15rem' }}>{activePipeline.role}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{activePipeline.companyName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-primary">{activePipeline.status}</span>
                        {activePipeline.nextAction && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
                            Next Action: {activePipeline.nextAction}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline stepper */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '2rem' }}>
                      <div style={{ position: 'absolute', top: '15px', left: '10px', right: '10px', height: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
                      <div style={{ position: 'absolute', top: '15px', left: '10px', width: `${(activeStepIndex / (steps.length - 1)) * 100}%`, height: '2px', background: 'var(--accent-purple)', zIndex: 0, transition: 'width 0.5s' }} />
                      
                      {steps.map((step, idx) => {
                        const isDone = idx <= activeStepIndex;
                        const isCurrent = idx === activeStepIndex;
                        return (
                          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1, textAlign: 'center' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isCurrent ? 'var(--gradient-primary)' : (isDone ? 'var(--accent-purple)' : 'var(--bg-secondary)'),
                              border: isDone ? 'none' : '2px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              color: isDone ? 'white' : 'var(--text-muted)'
                            }}>
                              {idx + 1}
                            </div>
                            <span style={{ fontSize: '0.65rem', marginTop: '0.5rem', fontWeight: isCurrent ? '700' : '500', color: isCurrent ? 'white' : 'var(--text-muted)' }}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    No active job applications. Browse jobs page to get started.
                  </div>
                )}
              </div>

              {/* Job Applications List */}
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Job Applications ({pipelines.length})</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {pipelines.map(p => (
                    <div key={p._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{p.role}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.companyName}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="badge badge-emerald">{p.status}</span>
                        {p.offerDetails?.offerLetterUrl && (
                          <a href={p.offerDetails.offerLetterUrl} download className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            Download Offer
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Header / Completion banner */}
              <div className="glass-card-static" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>My Portfolio Documents</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload and manage your resume, certificates, transcripts, project reports, and more.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                    <svg width="70" height="70" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="12" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent-purple)" strokeWidth="12"
                        strokeDasharray="314" strokeDashoffset={314 - (314 * completionScore) / 100}
                        strokeLinecap="round" transform="rotate(-90 60 60)" />
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '800' }}>
                      {completionScore}%
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '700', color: 'white' }}>Profile Completion</div>
                    {missingSections.length > 0 ? (
                      <span style={{ color: 'var(--accent-amber)' }}>Missing {missingSections.length} sections</span>
                    ) : (
                      <span style={{ color: 'var(--accent-emerald)' }}>All sections complete!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls row */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={docSearch}
                    onChange={e => setDocSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <select
                  value={docCategoryFilter}
                  onChange={e => setDocCategoryFilter(e.target.value)}
                  style={{ padding: '0.55rem 1rem', background: '#09090b', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', minWidth: '160px' }}
                >
                  <option value="">All Categories</option>
                  {PORT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={docSortOrder}
                  onChange={e => setDocSortOrder(e.target.value)}
                  style={{ padding: '0.55rem 1rem', background: '#09090b', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', minWidth: '150px' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <button
                  onClick={() => openDocModal()}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', whiteSpace: 'nowrap' }}
                >
                  <Plus size={16} /> Add Document
                </button>
              </div>

              {/* Document cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '1.25rem' }}>
                {getFilteredDocs().map(doc => {
                  const ext = getFileExt(doc);
                  const extLabel = ext ? ext.replace('.', '').toUpperCase() : null;
                  const badgeClass = CATEGORY_COLORS[doc.category] || 'badge-gray';
                  return (
                    <div key={doc._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem', fontWeight: '600' }}>{doc.category || 'Other'}</span>
                          {extLabel && (
                            <span style={{ fontSize: '0.6rem', fontWeight: '700', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.1rem 0.35rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                              {extLabel}
                            </span>
                          )}
                        </div>
                        <h5 style={{ fontWeight: '700', fontSize: '1rem', color: 'white', marginBottom: '0.3rem', lineHeight: '1.3' }}>{doc.title}</h5>
                        {doc.description && (
                          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: '0.35rem 0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {doc.description}
                          </p>
                        )}
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {doc.fileUrl && (
                            <>
                              <button onClick={() => handlePreviewPortfolioDoc(doc._id)} className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }} title="Preview">
                                <Eye size={12} /> View
                              </button>
                              <button onClick={() => handleDownloadPortfolioDoc(doc)} className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }} title="Download">
                                <Download size={12} />
                              </button>
                            </>
                          )}
                          <button onClick={() => openDocModal(doc)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', color: 'var(--accent-purple)' }} title="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDeletePortfolioDoc(doc._id)} className="btn btn-outline" style={{ padding: '0.3rem 0.45rem', color: 'var(--accent-red)' }} title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty state */}
                {getFilteredDocs().length === 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                      <FileText size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', marginBottom: '0.4rem' }}>
                          {docSearch || docCategoryFilter ? 'No documents match your filters.' : 'No documents uploaded yet.'}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {docSearch || docCategoryFilter
                            ? 'Try adjusting your search or filter.'
                            : 'Click "Add Document" to upload your resume, certificates, and more.'}
                        </p>
                      </div>
                      {!docSearch && !docCategoryFilter && (
                        <button onClick={() => openDocModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Plus size={16} /> Add Your First Document
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="animate-fade-in">
              {/* College Announcements */}
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Campus Placement Notices</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {announcements.map(ann => (
                    <div key={ann._id} className="glass-card" style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{ann.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Posted by {ann.teacherId?.name || 'College Office'} — {new Date(ann.createdAt).toLocaleDateString()}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ann.content}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No notifications or drive announcements posted yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Certificate Modal */}
      <AnimatePresence>
        {certModalOpen && (
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
              style={{ width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {editingCert ? 'Edit Certificate Details' : 'Add New Certificate'}
              </h2>

              <form onSubmit={handleSaveCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Certificate Title *</label>
                    <input
                      type="text"
                      required
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      placeholder="e.g. AWS Cloud Practitioner"
                      style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Issuing Organization *</label>
                    <input
                      type="text"
                      required
                      value={certIssuer}
                      onChange={(e) => setCertIssuer(e.target.value)}
                      placeholder="e.g. Amazon Web Services"
                      style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Category *</label>
                    <select
                      value={certCategory}
                      onChange={(e) => setCertCategory(e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', background: '#09090b', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                    >
                      <option value="Technical">Technical</option>
                      <option value="Language">Language</option>
                      <option value="Management">Management</option>
                      <option value="Aptitude">Aptitude</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Credential ID (optional)</label>
                    <input
                      type="text"
                      value={certCredentialId}
                      onChange={(e) => setCertCredentialId(e.target.value)}
                      placeholder="e.g. AWS-12345"
                      style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Issue Date *</label>
                    <input
                      type="date"
                      required
                      value={certIssueDate}
                      onChange={(e) => setCertIssueDate(e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Expiry Date (optional)</label>
                    <input
                      type="date"
                      value={certExpiryDate}
                      onChange={(e) => setCertExpiryDate(e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Verification URL (optional)</label>
                  <input
                    type="url"
                    value={certVerificationUrl}
                    onChange={(e) => setCertVerificationUrl(e.target.value)}
                    placeholder="https://credentials.aws.com/verify/..."
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Description</label>
                  <textarea
                    rows={2}
                    value={certDescription}
                    onChange={(e) => setCertDescription(e.target.value)}
                    placeholder="Briefly describe what skills or projects this certificate validates..."
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem', resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Certificate File (PDF, PNG, JPG - Max 10MB) {editingCert ? '(optional, choose file to replace)' : '*'}
                  </label>
                  <input
                    type="file"
                    required={!editingCert}
                    onChange={(e) => setCertFile(e.target.files[0])}
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ fontSize: '0.8rem', color: '#ccc' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setCertModalOpen(false)} disabled={savingCert}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingCert}>
                    {savingCert ? 'Saving...' : 'Save Certificate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Portfolio Document Modal */}
      <AnimatePresence>
        {docModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
          }} onClick={(e) => { if (e.target === e.currentTarget && !savingDoc) setDocModalOpen(false); }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-static"
              style={{ width: '100%', maxWidth: '560px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            >
              {/* Close button */}
              <button
                onClick={() => { if (!savingDoc) setDocModalOpen(false); }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                title="Close"
              >
                <X size={20} />
              </button>

              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  {editingDoc ? 'Edit Document' : 'Add New Document'}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {editingDoc ? 'Update document details or replace the file.' : 'Upload a document to your portfolio.'}
                </p>
              </div>

              {/* Error banner */}
              {docError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1rem', borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171', fontSize: '0.8rem'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  {docError}
                </div>
              )}

              <form onSubmit={handleSaveDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Document Title *</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => { setDocTitle(e.target.value); setDocError(''); }}
                    placeholder="e.g. Resume - July 2026"
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                {/* Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Category *</label>
                  <select
                    value={docCategory}
                    onChange={(e) => { setDocCategory(e.target.value); setDocError(''); }}
                    style={{ padding: '0.6rem 0.8rem', background: '#09090b', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                  >
                    {PORT_CATEGORIES.map(c => <option key={c} value={c}>{c === 'Marksheet' ? 'Marksheet / Transcript' : c}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Description (optional)</label>
                  <textarea
                    rows={2}
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="Brief description of this document..."
                    style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', fontSize: '0.85rem', resize: 'none', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>

                {/* File picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Select File (PDF, JPG, PNG — Max 10MB) {editingDoc ? '' : '*'}
                  </label>
                  <div style={{
                    border: '1px dashed var(--border-color)', borderRadius: '8px',
                    padding: '1.25rem', textAlign: 'center',
                    background: 'rgba(255,255,255,0.01)', cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                    onClick={() => document.getElementById('portfolio-doc-file-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      const file = e.dataTransfer.files[0];
                      if (file) { setDocFile(file); setDocError(''); }
                    }}
                  >
                    {docFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <FileText size={20} style={{ color: 'var(--accent-purple)' }} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white' }}>{docFile.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {(docFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDocFile(null); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                          title="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Click to browse or drag & drop
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', opacity: 0.6 }}>
                          PDF, JPG, JPEG, PNG — up to 10 MB
                        </div>
                      </div>
                    )}
                    <input
                      id="portfolio-doc-file-input"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) { setDocFile(file); setDocError(''); }
                        e.target.value = '';
                      }}
                    />
                  </div>
                  {editingDoc && !docFile && editingDoc.originalName && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Current file: {editingDoc.originalName}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setDocModalOpen(false)} disabled={savingDoc}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingDoc} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {savingDoc ? (
                      <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-rotate 0.8s linear infinite' }} /> Uploading...</>
                    ) : (
                      <><Upload size={15} /> {editingDoc ? 'Save Changes' : 'Upload Document'}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            style={{
              position: 'fixed', bottom: '2rem', left: '50%',
              transform: 'translateX(-50%)', zIndex: 9999,
              padding: '0.85rem 1.5rem', borderRadius: '10px',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '0.85rem', fontWeight: '600',
              background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: toast.type === 'success' ? '#34d399' : '#f87171',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.message}
            <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.1rem', marginLeft: '0.5rem' }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </UserLayout>
  );
};

export default Dashboard;
