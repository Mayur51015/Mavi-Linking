import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Code2,
  Cpu,
  FolderGit2,
  Activity,
  UserCheck,
  HelpCircle,
  TrendingUp,
  Award,
  ChevronDown,
  Info,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import { getCareerMatch, updateTargetRole } from '../api/careerMatch';
import { AuthContext } from '../context/AuthContext';

const CareerMatch = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);

  const [matchData, setMatchData] = useState(null);
  const [supportedRoles, setSupportedRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(user?.preferredRole || 'Full-Stack Developer');
  const [loading, setLoading] = useState(true);
  const [updatingGoal, setUpdatingGoal] = useState(false);
  const [error, setError] = useState('');
  const [showExplainer, setShowExplainer] = useState(false);
  const [notification, setNotification] = useState('');

  const fetchAnalysis = useCallback(async (roleToQuery = null) => {
    try {
      setLoading(true);
      setError('');
      const res = await getCareerMatch(roleToQuery);
      if (res?.success && res.data) {
        setMatchData(res.data);
        if (res.supportedRoles) {
          setSupportedRoles(res.supportedRoles);
        }
        if (res.data.targetRole) {
          setSelectedRole(res.data.targetRole);
        }
      }
    } catch (err) {
      console.error('Failed to load Career Match analysis:', err);
      setError(err.response?.data?.message || 'Could not load Career Match analysis');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    fetchAnalysis(newRole);
  };

  const handleSetAsPrimaryGoal = async () => {
    try {
      setUpdatingGoal(true);
      const res = await updateTargetRole(selectedRole);
      if (res?.success) {
        setMatchData(res.data);
        setNotification(`Target career role updated to "${selectedRole}" successfully!`);
        if (refreshUser) refreshUser();
        setTimeout(() => setNotification(''), 4000);
      }
    } catch (err) {
      console.error('Failed to set target role:', err);
      setError(err.response?.data?.message || 'Failed to update target role');
    } finally {
      setUpdatingGoal(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 75) return '#10b981'; // Green
    if (score >= 50) return '#6366f1'; // Indigo
    return '#f59e0b'; // Amber
  };

  const getScoreGrade = (score) => {
    if (score >= 85) return 'Exceptional Match';
    if (score >= 70) return 'High Readiness';
    if (score >= 50) return 'Moderate Readiness';
    return 'Foundational Phase';
  };

  return (
    <UserLayout>
      <div className="career-match-container" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Top Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#10b981',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} /> {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Target size={18} />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                MAVI Career Match
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
              Deterministic, evidence-based alignment analysis between your verified profile and target engineering roles.
            </p>
          </div>

          {/* Target Role Selector Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.5rem 0.75rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Analyzing Target Role
              </div>
              <select
                value={selectedRole}
                onChange={handleRoleChange}
                className="input-field"
                style={{
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {supportedRoles.map((r) => (
                  <option key={r.role} value={r.role} style={{ background: '#18181b', color: '#fff' }}>
                    {r.role}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchAnalysis(selectedRole)}
              disabled={loading}
              className="btn btn-outline"
              style={{ padding: '0.45rem', borderRadius: '8px' }}
              title="Refresh match calculations"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && !matchData ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing student evidence and role benchmarks...</p>
          </div>
        ) : error && !matchData ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>
            <AlertTriangle size={36} color="#f87171" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Failed to Load Career Match</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={() => fetchAnalysis()} className="btn btn-primary">Try Again</button>
          </div>
        ) : (
          matchData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* ─── Top Match Score Banner ────────────────────────────── */}
              <div
                className="card"
                style={{
                  padding: '1.75rem',
                  background: 'linear-gradient(135deg, rgba(24, 24, 37, 0.9) 0%, rgba(15, 15, 26, 0.95) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '2rem',
                    alignItems: 'center',
                  }}
                >
                  {/* Left: Overall Match Dial */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        background: `conic-gradient(${scoreColor(matchData.overallMatch)} ${matchData.overallMatch * 3.6}deg, rgba(255, 255, 255, 0.06) 0deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 25px ${scoreColor(matchData.overallMatch)}33`,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: '50%',
                          background: '#09090b',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.8rem',
                            fontWeight: 800,
                            fontFamily: 'Outfit, sans-serif',
                            color: scoreColor(matchData.overallMatch),
                            lineHeight: 1,
                          }}
                        >
                          {matchData.overallMatch}%
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                          MATCH
                        </span>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                          {matchData.targetRole}
                        </h2>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            fontWeight: 600,
                          }}
                        >
                          {matchData.domain}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: scoreColor(matchData.overallMatch), fontWeight: 700, marginBottom: '0.5rem' }}>
                        {getScoreGrade(matchData.overallMatch)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <ShieldCheck size={14} color="#10b981" /> Confidence: <strong style={{ color: 'var(--text-primary)' }}>{matchData.confidence}</strong>
                        </span>
                        <span>•</span>
                        <span>Version {matchData.version}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                    {user?.preferredRole !== selectedRole ? (
                      <button
                        onClick={handleSetAsPrimaryGoal}
                        disabled={updatingGoal}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <Zap size={16} /> {updatingGoal ? 'Saving Goal...' : `Set "${selectedRole}" as Target Career Goal`}
                      </button>
                    ) : (
                      <div
                        style={{
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#10b981',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <CheckCircle2 size={16} /> Current Active Career Goal on Profile
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => navigate('/dashboard/career-roadmap')}
                        className="btn btn-outline"
                        style={{ flex: 1, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <BookOpen size={15} /> View Career Roadmap <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => setShowExplainer(!showExplainer)}
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        title="Learn how MAVI calculates this score"
                      >
                        <Info size={15} /> Scoring Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Explainer Collapsible Section ──────────────────────── */}
              <AnimatePresence>
                {showExplainer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="card"
                    style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <HelpCircle size={16} /> How MAVI Career Match is Calculated
                      </h4>
                      <button onClick={() => setShowExplainer(false)} className="btn-icon" style={{ padding: '2px' }}>✕</button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      The Match Score is 100% deterministic and derived from your real verified MAVI platform data.
                      Weights are dynamically calibrated across five core competencies:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        <strong>Technical Skills (30%)</strong>: Verified core & preferred technologies.
                      </div>
                      <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        <strong>Problem Solving (20%)</strong>: LeetCode & Codeforces algorithmic benchmarks.
                      </div>
                      <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        <strong>Projects Portfolio (20%)</strong>: Project count, complexity & keyword relevance.
                      </div>
                      <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        <strong>Dev Activity (15%)</strong>: GitHub commit activity & repositories.
                      </div>
                      <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        <strong>Profile & DNA (15%)</strong>: Developer archetype alignment & completion.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── 5-Dimension Competency Breakdown ──────────────────── */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  Competency Breakdown
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {/* 1. Technical Skills */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Code2 size={15} color="#818cf8" /> Technical Skills
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Weight: 30%</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(matchData.breakdown?.technicalSkills?.score || 0), fontFamily: 'Outfit, sans-serif' }}>
                      {matchData.breakdown?.technicalSkills?.score || 0}%
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', margin: '0.5rem 0' }}>
                      <div style={{ width: `${matchData.breakdown?.technicalSkills?.score || 0}%`, height: '100%', background: '#818cf8', borderRadius: '2px' }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Evaluated against {matchData.targetRole} core tech stack.
                    </p>
                  </div>

                  {/* 2. Problem Solving */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Cpu size={15} color="#10b981" /> Problem Solving
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Weight: 20%</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(matchData.breakdown?.problemSolving?.score || 0), fontFamily: 'Outfit, sans-serif' }}>
                      {matchData.breakdown?.problemSolving?.score || 0}%
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', margin: '0.5rem 0' }}>
                      <div style={{ width: `${matchData.breakdown?.problemSolving?.score || 0}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {matchData.breakdown?.problemSolving?.evidence?.[0] || 'Algorithmic readiness index'}
                    </p>
                  </div>

                  {/* 3. Projects Portfolio */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FolderGit2 size={15} color="#ec4899" /> Projects Portfolio
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Weight: 20%</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(matchData.breakdown?.projects?.score || 0), fontFamily: 'Outfit, sans-serif' }}>
                      {matchData.breakdown?.projects?.score || 0}%
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', margin: '0.5rem 0' }}>
                      <div style={{ width: `${matchData.breakdown?.projects?.score || 0}%`, height: '100%', background: '#ec4899', borderRadius: '2px' }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {matchData.breakdown?.projects?.evidence?.[0] || 'Portfolio relevance index'}
                    </p>
                  </div>

                  {/* 4. Development Activity */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Activity size={15} color="#38bdf8" /> Development
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Weight: 15%</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(matchData.breakdown?.developmentActivity?.score || 0), fontFamily: 'Outfit, sans-serif' }}>
                      {matchData.breakdown?.developmentActivity?.score || 0}%
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', margin: '0.5rem 0' }}>
                      <div style={{ width: `${matchData.breakdown?.developmentActivity?.score || 0}%`, height: '100%', background: '#38bdf8', borderRadius: '2px' }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {matchData.breakdown?.developmentActivity?.evidence?.[0] || 'Repository & commit index'}
                    </p>
                  </div>

                  {/* 5. Profile & DNA */}
                  <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <UserCheck size={15} color="#fbbf24" /> Profile & DNA
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Weight: 15%</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(matchData.breakdown?.profile?.score || 0), fontFamily: 'Outfit, sans-serif' }}>
                      {matchData.breakdown?.profile?.score || 0}%
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', margin: '0.5rem 0' }}>
                      <div style={{ width: `${matchData.breakdown?.profile?.score || 0}%`, height: '100%', background: '#fbbf24', borderRadius: '2px' }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Archetype: {matchData.evidenceSummary?.dnaArchetype || 'Developer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── Strengths vs Skill Gaps Side-by-Side ──────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {/* Verified Strengths */}
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Your Verified Strengths
                    </h3>
                  </div>

                  {matchData.strengths && matchData.strengths.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {matchData.strengths.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(16, 185, 129, 0.04)',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>
                              ✓ {s.skill}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>
                              {s.score}% Strength
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {s.evidence}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Add projects or verify skills to populate your verified strengths.
                    </p>
                  )}
                </div>

                {/* Skill Gaps */}
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <AlertTriangle size={18} color="#f59e0b" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Identified Skill Gaps
                    </h3>
                  </div>

                  {matchData.skillGaps && matchData.skillGaps.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {matchData.skillGaps.map((g, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(245, 158, 11, 0.04)',
                            borderRadius: '8px',
                            border: '1px solid rgba(245, 158, 11, 0.15)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem' }}>
                              ⚠ {g.skill}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              {g.importance}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {g.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} /> All core required skills satisfied for {matchData.targetRole}!
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Actionable Prioritized Next Steps ──────────────────── */}
              <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(20, 20, 32, 0.8), rgba(12, 12, 20, 0.95))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={20} color="#818cf8" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      Prioritized Next Steps for {matchData.targetRole}
                    </h3>
                  </div>

                  <button
                    onClick={() => navigate('/dashboard/career-roadmap')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    Open Roadmap <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {matchData.recommendations && matchData.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'inline-block',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: idx === 0 ? 'rgba(236, 72, 153, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: idx === 0 ? '#ec4899' : '#818cf8',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Step {rec.priority || idx + 1}
                        </div>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
                          {rec.title}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </UserLayout>
  );
};

export default CareerMatch;
