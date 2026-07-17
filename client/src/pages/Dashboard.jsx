import React, { useContext, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import {
  Globe, GitBranch, Code2, Timeline, CheckCircle, FileText,
  Briefcase, Calendar, BarChart3, AlertCircle, Upload, QrCode,
  Eye, Download, Plus, Edit2, Trash2, Search
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

const Dashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [scores, setScores] = useState(null);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Custom states for new modules
  const [pipelines, setPipelines] = useState([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});

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

  // AI State
  const [aiData, setAiData] = useState({ insight: null, dna: null, analytics: [] });
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/scores/me').catch(() => ({ data: { data: { scores: null, rank: null } } }));
        setScores(res.data.data.scores);
        setRank(res.data.data.rank);
        
        // Fetch data concurrently — every call has a .catch() so one failure never kills the rest
        const emptyFallback = { data: { data: null } };
        const arrayFallback = { data: { data: [] } };

        const [insightRes, dnaRes, analyticsRes, pipelineRes, projectRes, annRes] = await Promise.all([
          api.get('/ai/insights').catch(() => emptyFallback),
          api.get('/ai/dna').catch(() => emptyFallback),
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
      }
    };
    fetchDashboardData();
  }, []);

  const handleGenerateAIInsights = async () => {
    setGeneratingAI(true);
    try {
      const res = await api.post('/ai/insights/generate');
      setAiData({
        insight: res.data.data.insight,
        dna: res.data.data.dna,
        analytics: aiData.analytics
      });
    } catch (err) {
      console.error('AI generation error:', err);
      // Don't use alert() — just silently log; the UI remains functional
    } finally {
      setGeneratingAI(false);
    }
  };

  // Profile Completion logic
  const calculateCompletion = () => {
    let score = 0;
    const missing = [];
    if (user?.avatar) score += 15; else missing.push('Profile Avatar');
    if (user?.bio) score += 15; else missing.push('Bio Description');
    if (user?.university?.name) score += 20; else missing.push('College Details');
    if (user?.platforms?.github?.username) score += 15; else missing.push('GitHub Link');
    if (projectsCount > 0) score += 15; else missing.push('Showcase Projects');
    if (user?.certificates?.length > 0) score += 20; else missing.push('Certificates');
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

  return (
    <UserLayout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome, {user?.name}</h1>
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
                {rank ? `#${rank}` : 'Unranked'}
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
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        {['overview', 'placement', 'documents', 'announcements', 'messages'].map(tab => (
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
            }}
          >
            {tab === 'placement' ? 'Timeline & Placements' : tab === 'documents' ? 'Documents & Build' : tab === 'messages' ? 'Messages' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading intelligence dashboard...</div>
      ) : (
        <>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {aiData.dna && <DNACard dna={aiData.dna} />}
                {aiData.insight && <SkillRadar insights={aiData.insight} />}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <GrowthChart analytics={aiData.analytics} />
                <LeaderboardWidget />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <ActivityFeed />
                <ReportGenerator />
              </div>

              <LeetCodeSection />
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
              {/* Header/Completion banner */}
              <div className="glass-card-static" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Professional Portfolio & Build</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload credentials, academic transcripts, and verify certificates for recruiter visibility.</p>
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
                    <div style={{ fontWeight: '700', color: 'white' }}>Profile Completion Score</div>
                    {missingSections.length > 0 ? (
                      <span style={{ color: 'var(--accent-amber)' }}>Missing {missingSections.length} sections</span>
                    ) : (
                      <span style={{ color: 'var(--accent-emerald)' }}>All sections complete!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hidden file picker input for Required Documents */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.jpg,.jpeg,.png"
              />

              {/* Required Documents Section */}
              <div>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} className="text-gradient" /> Required Portfolio Documents
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {[
                    { key: 'resume', label: 'Resume / CV' },
                    { key: 'transcript', label: 'Academic Transcript / Marksheet' },
                    { key: 'projectReport', label: 'Project Report' },
                    { key: 'internshipOffer', label: 'Internship Offer Letter' },
                    { key: 'internshipCompletion', label: 'Internship Completion Certificate' },
                    { key: 'experienceLetter', label: 'Experience Letter' },
                    { key: 'researchPaper', label: 'Research Paper (optional)' },
                    { key: 'other', label: 'Other Document' }
                  ].map(doc => {
                    let hasDoc = false;
                    if (user?.documents?.list) {
                      hasDoc = user.documents.list.some(d => d.type === doc.key);
                    }
                    if (!hasDoc && user?.documents?.[doc.key]) {
                      hasDoc = true;
                    }
                    
                    return (
                      <div key={doc.key} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                            <span className={`badge ${hasDoc ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                              {hasDoc ? 'Uploaded' : 'Pending'}
                            </span>
                            {hasDoc && (
                              <button onClick={() => handleDeleteDoc(doc.key)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '0.25rem' }} title="Delete">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <h5 style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', marginBottom: '0.25rem' }}>{doc.label}</h5>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Supported formats: PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {hasDoc ? (
                            <>
                              <button onClick={() => handlePreviewDoc(doc.key)} className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.35rem 0.6rem', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}>
                                <Eye size={12} /> View
                              </button>
                              <button onClick={() => handleDownloadDoc(doc.key)} className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.35rem 0.6rem', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}>
                                <Download size={12} /> Get
                              </button>
                              <button onClick={() => handleUploadClick(doc.key)} className="btn btn-primary" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.35rem 0.6rem', fontSize: '0.7rem', flex: '1 0 100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                                <Upload size={12} /> {uploadStatus[doc.key] || 'Replace'}
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleUploadClick(doc.key)} className="btn btn-primary" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.4rem 0.75rem', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}>
                              <Upload size={12} /> {uploadStatus[doc.key] || 'Upload File'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificates Section */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h4 style={{ fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Globe size={20} className="text-gradient" /> Certificates Repository
                  </h4>
                  <button onClick={() => handleOpenCertModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Certificate
                  </button>
                </div>

                {/* Filter / Search Controls Row */}
                <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search certificates or issuers..."
                      value={certSearch}
                      onChange={(e) => setCertSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem 0.5rem 2.25rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <select
                    value={certCategoryFilter}
                    onChange={(e) => setCertCategoryFilter(e.target.value)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#09090b',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '150px',
                    }}
                  >
                    <option value="">All Categories</option>
                    <option value="Technical">Technical</option>
                    <option value="Language">Language</option>
                    <option value="Management">Management</option>
                    <option value="Aptitude">Aptitude</option>
                    <option value="Other">Other</option>
                  </select>

                  <select
                    value={certSortOrder}
                    onChange={(e) => setCertSortOrder(e.target.value)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#09090b',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '150px',
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {/* Certificates Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {getFilteredCertificates().map(cert => (
                    <div key={cert._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', position: 'relative' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{cert.category || 'Certificate'}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'N/A'}
                          </span>
                        </div>
                        <h5 style={{ fontWeight: '700', fontSize: '1.05rem', color: 'white', marginBottom: '0.25rem' }}>{cert.title}</h5>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem' }}>
                          Issued by <span style={{ color: 'var(--accent-purple)' }}>{cert.issuer || 'Unknown Organization'}</span>
                        </div>
                        {cert.credentialId && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            ID: <code style={{ color: '#aaa', background: 'rgba(255,255,255,0.03)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{cert.credentialId}</code>
                          </div>
                        )}
                        {cert.description && (
                          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0.5rem 0 0 0' }}>
                            {cert.description}
                          </p>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {cert.fileUrl && (
                            <>
                              <button onClick={() => handlePreviewCertificate(cert._id)} className="btn btn-outline" style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Preview">
                                <Eye size={12} /> View
                              </button>
                              <button onClick={() => handleDownloadCertificate(cert._id, cert.title)} className="btn btn-outline" style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} title="Download">
                                <Download size={12} /> Get
                              </button>
                            </>
                          )}
                          {cert.verificationUrl && (
                            <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              Verify
                            </a>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => handleOpenCertModal(cert)} className="btn btn-outline" style={{ padding: '0.35rem 0.5rem', color: 'var(--accent-purple)' }} title="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDeleteCertificate(cert._id)} className="btn btn-outline" style={{ padding: '0.35rem 0.5rem', color: 'var(--accent-red)' }} title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getFilteredCertificates().length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }} className="glass-card">
                      No certificates match your search or filter options.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
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

              {/* QR Analytics Widget */}
              <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1rem' }}>QR Analytics</h3>
                <QrCode size={48} style={{ color: 'var(--accent-cyan)', margin: '0 auto 1.5rem auto' }} />
                
                <div style={{ display: 'grid', gap: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Scan Views</span>
                    <span style={{ fontWeight: '700' }}>{user?.qrAnalytics?.scanCount || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Last Scan</span>
                    <span>{user?.qrAnalytics?.lastScan ? new Date(user.qrAnalytics.lastScan).toLocaleDateString() : 'Never'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Top Scanned Devices</span>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {user?.qrAnalytics?.devices?.slice(0, 3).map((d, i) => (
                        <span key={i} className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>{d}</span>
                      )) || <span style={{ color: 'var(--text-muted)' }}>None</span>}
                    </div>
                  </div>
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
    </UserLayout>
  );
};

export default Dashboard;
