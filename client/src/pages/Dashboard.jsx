import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import {
  Globe, GitBranch, Code2, Timeline, CheckCircle, FileText,
  Briefcase, Calendar, BarChart3, AlertCircle, Upload, QrCode
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

  // Mock document uploader
  const handleUploadDoc = async (type) => {
    setUploadStatus(prev => ({ ...prev, [type]: 'Uploading...' }));
    setTimeout(async () => {
      try {
        const mockUrl = `/public/uploads/mock_${type}_${Date.now()}.pdf`;
        const updatedDocs = { ...user.documents, [type]: mockUrl };
        const res = await api.put('/auth/me', { documents: updatedDocs });
        setUser(res.data.data.user);
        setUploadStatus(prev => ({ ...prev, [type]: 'Uploaded!' }));
      } catch (err) {
        console.error(err);
        setUploadStatus(prev => ({ ...prev, [type]: 'Failed' }));
      }
    }, 1000);
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
            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
              {/* Profile Completion Circle */}
              <div className="glass-card-static" style={{ padding: '2rem', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Profile Build Score</h3>
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem auto' }}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent-purple)" strokeWidth="10"
                      strokeDasharray="314" strokeDashoffset={314 - (314 * completionScore) / 100}
                      strokeLinecap="round" transform="rotate(-90 60 60)" />
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit' }}>
                    {completionScore}%
                  </div>
                </div>

                {missingSections.length > 0 ? (
                  <div>
                    <h5 style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}>
                      <AlertCircle size={14} /> Missing Checklist
                    </h5>
                    <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {missingSections.map(s => <div key={s}>• {s}</div>)}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
                    <CheckCircle size={16} style={{ display: 'inline', marginRight: '0.25rem' }} /> Profile Complete!
                  </div>
                )}
              </div>

              {/* Document Repository */}
              <div className="glass-card-static" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Official Documents Repository</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {['resume', 'aadhaar', 'pan', 'marksheet'].map(docType => {
                    const hasDoc = user?.documents?.[docType];
                    return (
                      <div key={docType} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <FileText style={{ color: hasDoc ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
                          <div style={{ textTransform: 'capitalize', fontWeight: '600' }}>{docType} Document</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {hasDoc && <span style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', marginRight: '0.5rem' }}>✓ Uploaded</span>}
                          <button onClick={() => handleUploadDoc(docType)} className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                            <Upload size={12} /> {uploadStatus[docType] || 'Upload'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
    </UserLayout>
  );
};

export default Dashboard;
