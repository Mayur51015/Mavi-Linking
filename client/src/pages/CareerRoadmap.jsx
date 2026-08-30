import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Edit3,
  ExternalLink,
  Briefcase,
  Layers,
  Code2,
  FolderGit2,
  Award,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Check,
  Loader2,
  BookOpen,
  Zap,
  UserCheck
} from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import UserLayout from '../layouts/UserLayout';

const CareerRoadmapPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [roadmap, setRoadmap] = useState(null);
  const [profileStrength, setProfileStrength] = useState(50);
  const [missingItems, setMissingItems] = useState([]);
  const [profileChanged, setProfileChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [error, setError] = useState('');
  
  // Goal Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [updatingGoal, setUpdatingGoal] = useState(false);

  const fetchRoadmap = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/career/roadmap');
      if (res.data?.success) {
        setRoadmap(res.data.data);
        if (res.data.profileStrength !== undefined) {
          setProfileStrength(res.data.profileStrength);
        }
        if (res.data.missingProfileItems) {
          setMissingItems(res.data.missingProfileItems);
        }
        if (res.data.profileChangedSinceGeneration !== undefined) {
          setProfileChanged(res.data.profileChangedSinceGeneration);
        }
        if (res.data.data?.targetRole) {
          setCustomGoal(res.data.data.targetRole);
        }
      }
    } catch (err) {
      console.error('Error loading Career Roadmap:', err);
      setError(err.response?.data?.message || 'Failed to load your career roadmap.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleGenerate = async (overrideRole) => {
    if (generating) return;
    try {
      setGenerating(true);
      setError('');
      const target = overrideRole || customGoal || roadmap?.targetRole || user?.preferredDomain || 'Full-Stack Developer';
      const res = await api.post('/career/roadmap/generate', { targetRole: target });
      if (res.data?.success) {
        setRoadmap(res.data.data);
        setProfileChanged(false);
      }
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err.response?.data?.message || 'Failed to generate career roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    if (updatingItem) return;
    try {
      setUpdatingItem(itemId);
      const res = await api.put('/career/roadmap/progress', { itemId, status: newStatus });
      if (res.data?.success) {
        setRoadmap(res.data.data);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update progress.');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleGoalSubmit = async (e) => {
    e?.preventDefault();
    if (!customGoal.trim() || updatingGoal) return;
    try {
      setUpdatingGoal(true);
      setError('');
      const res = await api.put('/career/target-role', { targetRole: customGoal.trim() });
      if (res.data?.success) {
        setRoadmap(res.data.data);
        setShowGoalModal(false);
      }
    } catch (err) {
      console.error('Error updating target role:', err);
      setError(err.response?.data?.message || 'Failed to update career goal.');
    } finally {
      setUpdatingGoal(false);
    }
  };

  const progressPercent = roadmap?.overallProgress !== undefined ? Math.min(100, Math.max(0, roadmap.overallProgress)) : 0;
  const targetRole = roadmap?.targetRole || user?.preferredDomain || 'Full-Stack Engineer';
  const currentLevel = roadmap?.currentLevel || 'Intermediate';

  const strongGaps = (roadmap?.skillGaps || []).filter(g => g.category === 'strong');
  const improveGaps = (roadmap?.skillGaps || []).filter(g => g.category === 'improve');
  const learnGaps = (roadmap?.skillGaps || []).filter(g => g.category === 'learn');

  return (
    <UserLayout>
      <div className="career-roadmap-container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
        
        {/* Top Breadcrumb & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Student Dashboard</span>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--accent-purple)', fontWeight: '500' }}>MAVI Career Roadmap</span>
            </div>
            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
              MAVI Career Roadmap
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowGoalModal(true)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Edit3 size={15} />
              Update Career Goal
            </button>

            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Regenerating Roadmap...' : 'Regenerate Roadmap'}
            </button>
          </div>
        </div>

        {/* Profile Changed Banner */}
        {profileChanged && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                  Your profile has changed since your roadmap was generated.
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Regenerate your roadmap to synchronize with your newest projects, skills, and coding platform milestones.
                </div>
              </div>
            </div>
            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="btn btn-sm"
              style={{ background: '#f59e0b', color: 'black', fontWeight: '600', border: 'none' }}
            >
              Regenerate Roadmap
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Loader2 size={48} color="var(--accent-purple)" className="animate-spin" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ color: 'white', fontSize: '1.35rem', fontFamily: 'Outfit' }}>
              Building your personalized career roadmap...
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Analyzing your skills, experience, project history, and platform metrics.
            </p>
          </div>
        ) : (
          <>
            {/* HERO OVERVIEW CARD */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '350px',
                height: '350px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                      Target Career
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      AI-estimated learning roadmap
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                      {targetRole}
                    </h2>
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="btn btn-ghost btn-sm"
                      title="Edit target role"
                      style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '540px', lineHeight: '1.5', margin: 0 }}>
                    Build your personalized path from your current <strong>{currentLevel}</strong> foundation to an industry-ready <strong>{targetRole}</strong>.
                  </p>

                  <div style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Roadmap generated: {roadmap?.generatedAt ? new Date(roadmap.generatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Today'}
                  </div>
                </div>

                {/* Progress Circle & Metrics */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Roadmap Progress
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-purple)', fontFamily: 'Outfit' }}>
                        {progressPercent}%
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Profile Strength
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: profileStrength >= 75 ? '#10b981' : '#f59e0b', fontFamily: 'Outfit' }}>
                        {profileStrength}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #10b981 100%)',
                        borderRadius: '999px',
                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    </div>
                  </div>

                  {missingItems.length > 0 ? (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Improve your roadmap by completing your profile:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                        {missingItems.map((item, idx) => (
                          <span key={idx} style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            • {item}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => navigate('/dashboard/link')}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', fontSize: '0.78rem' }}
                      >
                        Complete Profile
                      </button>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.8rem', fontWeight: '600' }}>
                        <CheckCircle2 size={15} /> Your profile is fully complete
                      </div>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--text-secondary)' }}
                      >
                        View Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NEXT ACTION HERO CALLOUT */}
            {roadmap?.nextAction && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5rem',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                  <div style={{
                    background: 'var(--accent-purple)',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '0.2rem' }}>
                      Next Recommended Step (Phase {roadmap.nextAction.phaseNumber || 1})
                    </div>
                    <h3 style={{ color: 'white', fontSize: '1.15rem', margin: '0 0 0.25rem 0', fontFamily: 'Outfit' }}>
                      {roadmap.nextAction.stepTitle}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                      {roadmap.nextAction.description}
                    </p>
                  </div>
                </div>

                {roadmap.nextAction.itemId && roadmap.nextAction.itemId !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange(roadmap.nextAction.itemId, 'Completed')}
                    disabled={updatingItem === roadmap.nextAction.itemId}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                  >
                    <CheckCircle2 size={16} />
                    {updatingItem === roadmap.nextAction.itemId ? 'Updating...' : 'Mark as Complete'}
                  </button>
                )}
              </div>
            )}

            {/* 2-COLUMN MAIN CONTENT: CURRENT PROFILE & SKILL GAP */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* CURRENT PROFILE */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <UserCheck size={20} color="var(--accent-purple)" />
                  <h3 style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'Outfit', margin: 0 }}>
                    Current Profile
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current Level</span>
                    <span className="badge badge-primary" style={{ fontWeight: '600' }}>{currentLevel}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Overall Score</span>
                    <span style={{ color: 'white', fontWeight: '600' }}>{user?.scores?.overall || 0} / 1000</span>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      Existing Strengths & Technologies:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {(roadmap?.currentSkills || ['JavaScript', 'HTML/CSS', 'Git']).map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            color: 'var(--accent-blue)',
                            fontSize: '0.78rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                          }}
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      Projects & Experience:
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                      {user?.degree ? `${user.degree} student at ${user.university?.name || 'University'}. ` : ''}
                      Actively building developer portfolio on MAVI Linking.
                    </p>
                  </div>
                </div>
              </div>

              {/* SKILL GAP ANALYSIS */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <TrendingUp size={20} color="var(--accent-cyan)" />
                  <h3 style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'Outfit', margin: 0 }}>
                    Skill Gap Analysis
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Strong Skills */}
                  <div>
                    <div style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Check size={14} /> Strong Skills (Foundational)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {strongGaps.length > 0 ? strongGaps.map((g, idx) => (
                        <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }} title={g.reason}>
                          ✓ {g.name}
                        </span>
                      )) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None specified yet</span>
                      )}
                    </div>
                  </div>

                  {/* Skills to Improve */}
                  <div>
                    <div style={{ color: '#f59e0b', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ArrowRight size={14} /> Skills to Improve
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {improveGaps.length > 0 ? improveGaps.map((g, idx) => (
                        <span key={idx} style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }} title={g.reason}>
                          → {g.name}
                        </span>
                      )) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None detected</span>
                      )}
                    </div>
                  </div>

                  {/* Skills to Learn */}
                  <div>
                    <div style={{ color: 'var(--accent-purple)', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Zap size={14} /> Skills to Learn (Priority Gaps)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {learnGaps.length > 0 ? learnGaps.map((g, idx) => (
                        <span key={idx} style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', color: 'var(--accent-purple)', fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }} title={g.reason}>
                          → {g.name}
                        </span>
                      )) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None detected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE LEARNING ROADMAP PHASES */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Layers size={22} color="var(--accent-purple)" />
                  <div>
                    <h3 style={{ color: 'white', fontSize: '1.35rem', fontFamily: 'Outfit', margin: 0 }}>
                      Interactive Learning Roadmap
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                      Click any milestone item to update your learning status (Not Started • In Progress • Completed).
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                    <Circle size={10} color="var(--text-muted)" /> Not Started
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b' }}>
                    <Clock size={10} color="#f59e0b" /> In Progress
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981' }}>
                    <CheckCircle2 size={10} color="#10b981" /> Completed
                  </span>
                </div>
              </div>

              {/* Phases Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {(roadmap?.roadmapPhases || []).map((phase) => {
                  const phaseCompleted = phase.items.every(i => i.status === 'Completed');
                  const phaseItems = phase.items || [];
                  const phaseProgress = phaseItems.length > 0 
                    ? Math.round((phaseItems.filter(i => i.status === 'Completed').length / phaseItems.length) * 100) 
                    : 0;

                  return (
                    <div
                      key={phase.phaseNumber}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: phaseCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                        borderRadius: '14px',
                        padding: '1.25rem 1.5rem',
                      }}
                    >
                      {/* Phase Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={{ color: 'white', fontSize: '1.05rem', margin: 0, fontFamily: 'Outfit' }}>
                              {phase.title}
                            </h4>
                            {phaseCompleted && (
                              <span style={{ color: '#10b981', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                <Check size={12} /> Phase Completed
                              </span>
                            )}
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                            {phase.description}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            Suggested: {phase.estimatedTimeline}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            {phaseProgress}%
                          </span>
                        </div>
                      </div>

                      {/* Items Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                        {phaseItems.map((item) => {
                          const isCompleted = item.status === 'Completed';
                          const isInProgress = item.status === 'In Progress';
                          const isUpdating = updatingItem === item.id;

                          return (
                            <div
                              key={item.id}
                              style={{
                                background: isCompleted ? 'rgba(16, 185, 129, 0.04)' : isInProgress ? 'rgba(245, 158, 11, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                                border: isCompleted ? '1px solid rgba(16, 185, 129, 0.2)' : isInProgress ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid var(--border-subtle)',
                                borderRadius: '10px',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                  <div style={{ color: isCompleted ? 'var(--text-muted)' : 'white', fontWeight: '600', fontSize: '0.9rem', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                                    {item.title}
                                  </div>
                                  {item.priority === 'High' && (
                                    <span style={{ fontSize: '0.65rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px', flexShrink: 0 }}>
                                      High Priority
                                    </span>
                                  )}
                                </div>

                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>
                                  {item.description}
                                </p>

                                {item.resources?.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                                    {item.resources.map((res, rIdx) => (
                                      <span key={rIdx} style={{ fontSize: '0.68rem', color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                        📚 {res}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Status Toggle Buttons */}
                              <div style={{ display: 'flex', gap: '0.35rem', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(item.id, 'Not Started')}
                                  disabled={isUpdating}
                                  style={{
                                    flex: 1,
                                    padding: '0.3rem 0.4rem',
                                    fontSize: '0.72rem',
                                    borderRadius: '6px',
                                    border: item.status === 'Not Started' ? '1px solid var(--text-muted)' : '1px solid transparent',
                                    background: item.status === 'Not Started' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                    color: item.status === 'Not Started' ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Not Started
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(item.id, 'In Progress')}
                                  disabled={isUpdating}
                                  style={{
                                    flex: 1,
                                    padding: '0.3rem 0.4rem',
                                    fontSize: '0.72rem',
                                    borderRadius: '6px',
                                    border: item.status === 'In Progress' ? '1px solid #f59e0b' : '1px solid transparent',
                                    background: item.status === 'In Progress' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                    color: item.status === 'In Progress' ? '#f59e0b' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: item.status === 'In Progress' ? '600' : '400',
                                  }}
                                >
                                  In Progress
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(item.id, 'Completed')}
                                  disabled={isUpdating}
                                  style={{
                                    flex: 1,
                                    padding: '0.3rem 0.4rem',
                                    fontSize: '0.72rem',
                                    borderRadius: '6px',
                                    border: item.status === 'Completed' ? '1px solid #10b981' : '1px solid transparent',
                                    background: item.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                    color: item.status === 'Completed' ? '#10b981' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: item.status === 'Completed' ? '600' : '400',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.2rem',
                                  }}
                                >
                                  <Check size={11} /> Done
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RECOMMENDED PROJECTS */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <Code2 size={22} color="var(--accent-purple)" />
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.35rem', fontFamily: 'Outfit', margin: 0 }}>
                    Recommended Practical Projects
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                    Hands-on portfolio projects crafted to eliminate skill gaps and impress tech recruiters.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {(roadmap?.recommendedProjects || []).map((proj) => (
                  <div
                    key={proj.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span className="badge" style={{
                          background: proj.difficulty === 'Advanced' ? 'rgba(239, 68, 68, 0.1)' : proj.difficulty === 'Intermediate' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: proj.difficulty === 'Advanced' ? '#ef4444' : proj.difficulty === 'Intermediate' ? '#f59e0b' : '#10b981',
                          border: 'none',
                          fontSize: '0.7rem'
                        }}>
                          {proj.difficulty}
                        </span>
                      </div>

                      <h4 style={{ color: 'white', fontSize: '1.1rem', margin: '0 0 0.5rem 0', fontFamily: 'Outfit' }}>
                        {proj.title}
                      </h4>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.45', marginBottom: '1rem' }}>
                        {proj.description}
                      </p>

                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                          Skills Practiced:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {(proj.skillsPracticed || []).map((s, sIdx) => (
                            <span key={sIdx} style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.08)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {proj.suggestedTechnologies?.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                            Suggested Tech:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {proj.suggestedTechnologies.map((t, tIdx) => (
                              <span key={tIdx} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.04)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                      <div style={{ color: '#10b981', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Award size={14} /> Expected: {proj.expectedOutcome || 'Production Portfolio Asset'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECOMMENDED CAREER PATHS & PROFILE ALIGNMENT */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <TrendingUp size={22} color="var(--accent-purple)" />
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.35rem', fontFamily: 'Outfit', margin: 0 }}>
                    Recommended Career Paths
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                    AI-estimated profile alignment with adjacent developer specializations.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {(roadmap?.careerAlignment || []).map((alignment, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ color: 'white', fontSize: '1rem', margin: 0, fontFamily: 'Outfit' }}>
                          {alignment.role}
                        </h4>
                        <span style={{
                          color: alignment.alignmentScore >= 85 ? '#10b981' : 'var(--accent-purple)',
                          fontWeight: '700',
                          fontSize: '1rem',
                          fontFamily: 'Outfit'
                        }}>
                          {alignment.alignmentScore}%
                        </span>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        AI Profile Alignment
                      </div>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', margin: 0 }}>
                        {alignment.matchReason}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setCustomGoal(alignment.role);
                        handleGenerate(alignment.role);
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: '1rem', width: '100%', fontSize: '0.78rem', color: 'var(--accent-purple)' }}
                    >
                      Switch Target to this Role →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Career Goal Modal */}
        {showGoalModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}>
            <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }}>
              <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.35rem', fontFamily: 'Outfit' }}>
                Set Your Target Career Goal
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Enter your target role to recalculate your skill gaps, milestone phases, and practical project recommendations.
              </p>

              <form onSubmit={handleGoalSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                    Target Role
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Full-Stack Developer, AI/ML Engineer, Cloud Architect"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    required
                    autoFocus
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Popular Paths:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {[
                      'Full-Stack Developer',
                      'Frontend Developer',
                      'Backend Developer',
                      'AI/ML Engineer',
                      'Data Scientist',
                      'DevOps Engineer',
                      'Cybersecurity Engineer',
                      'Mobile Developer',
                      'Software Engineer',
                    ].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setCustomGoal(role)}
                        className="badge"
                        style={{
                          background: customGoal === role ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.05)',
                          color: customGoal === role ? 'white' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          border: '1px solid var(--border-subtle)',
                          padding: '0.35rem 0.65rem',
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingGoal}
                    className="btn btn-primary"
                  >
                    {updatingGoal ? 'Recalculating...' : 'Update & Recalculate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </UserLayout>
  );
};

export default CareerRoadmapPage;
