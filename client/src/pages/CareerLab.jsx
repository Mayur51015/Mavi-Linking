import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Target,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bookmark,
  BookmarkPlus,
  BookOpen,
  Code2,
  Cpu,
  FolderGit2,
  Activity,
  UserCheck,
  Plus,
  Trash2,
  Check,
  Info,
  ShieldCheck,
  BarChart3,
  Layers,
} from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import {
  getCareerLabProfile,
  simulateScenario,
  compareAllRoles,
  saveScenario,
  getSavedScenarios,
  deleteSavedScenario,
  addScenarioToRoadmap,
} from '../api/careerLab';
import { getSupportedRoles } from '../api/careerMatch';
import { AuthContext } from '../context/AuthContext';

const CareerLab = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'compare' | 'saved'
  const [profileData, setProfileData] = useState(null);
  const [supportedRoles, setSupportedRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(user?.preferredRole || 'Full-Stack Developer');

  // Hypothetical Changes State
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [codingSolved, setCodingSolved] = useState(0);
  const [additionalRepos, setAdditionalRepos] = useState(0);
  const [openSourceContr, setOpenSourceContr] = useState(false);
  const [testingAdded, setTestingAdded] = useState(false);
  const [completedProfile, setCompletedProfile] = useState(false);

  // Simulation State
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Role Comparison State
  const [roleComparisons, setRoleComparisons] = useState([]);
  const [loadingComparisons, setLoadingComparisons] = useState(false);

  // Saved Scenarios State
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [savingScenario, setSavingScenario] = useState(false);

  // Roadmap Integration State
  const [addingToRoadmap, setAddingToRoadmap] = useState(false);

  // Load initial lab data
  const loadProfile = useCallback(async (role = null) => {
    try {
      setLoading(true);
      setError('');
      const [labRes, rolesRes] = await Promise.all([
        getCareerLabProfile(role),
        getSupportedRoles(),
      ]);

      if (labRes?.success && labRes.data) {
        setProfileData(labRes.data);
        if (labRes.data.targetRole) {
          setSelectedRole(labRes.data.targetRole);
        }
      }
      if (rolesRes?.success && rolesRes.data) {
        setSupportedRoles(rolesRes.data);
      }
    } catch (err) {
      console.error('Failed to load Career Lab profile:', err);
      setError(err.response?.data?.message || 'Could not load Career Lab.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Execute simulation when inputs change
  const runCurrentSimulation = useCallback(
    async (overrideRole = null, overrideChanges = null) => {
      try {
        setSimulating(true);
        const role = overrideRole || selectedRole;
        const changes = overrideChanges || {
          skills: selectedSkills,
          projects: selectedProjects,
          coding: { additionalSolved: codingSolved },
          development: {
            additionalRepos,
            openSourceContribution: openSourceContr,
            testingAdded,
          },
          profile: { completedMissing: completedProfile },
        };

        const res = await simulateScenario(role, changes);
        if (res?.success && res.data) {
          setSimulationResult(res.data);
        }
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setSimulating(false);
      }
    },
    [
      selectedRole,
      selectedSkills,
      selectedProjects,
      codingSolved,
      additionalRepos,
      openSourceContr,
      testingAdded,
      completedProfile,
    ]
  );

  useEffect(() => {
    if (profileData) {
      runCurrentSimulation();
    }
  }, [
    selectedRole,
    selectedSkills,
    selectedProjects,
    codingSolved,
    additionalRepos,
    openSourceContr,
    testingAdded,
    completedProfile,
    runCurrentSimulation,
  ]);

  const handleRoleSelect = (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    loadProfile(newRole);
  };

  const handleToggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!customSkillInput.trim()) return;
    const clean = customSkillInput.trim();
    if (!selectedSkills.includes(clean)) {
      setSelectedSkills((prev) => [...prev, clean]);
    }
    setCustomSkillInput('');
  };

  const handleToggleProject = (proj) => {
    setSelectedProjects((prev) => {
      const exists = prev.some((p) => p.title === proj.title);
      return exists ? prev.filter((p) => p.title !== proj.title) : [...prev, proj];
    });
  };

  const handleResetSimulation = () => {
    setSelectedSkills([]);
    setSelectedProjects([]);
    setCodingSolved(0);
    setAdditionalRepos(0);
    setOpenSourceContr(false);
    setTestingAdded(false);
    setCompletedProfile(false);
    setNotification('Simulation reset to current profile state.');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleLoadSavedScenario = (scen) => {
    if (!scen) return;
    setSelectedRole(scen.targetRole);
    setSelectedSkills(scen.hypotheticalChanges?.skills || []);
    setSelectedProjects(scen.hypotheticalChanges?.projects || []);
    setCodingSolved(scen.hypotheticalChanges?.coding?.additionalSolved || 0);
    setAdditionalRepos(scen.hypotheticalChanges?.development?.additionalRepos || 0);
    setOpenSourceContr(Boolean(scen.hypotheticalChanges?.development?.openSourceContribution));
    setTestingAdded(Boolean(scen.hypotheticalChanges?.development?.testingAdded));
    setCompletedProfile(Boolean(scen.hypotheticalChanges?.profile?.completedMissing));
    setActiveTab('simulator');
    setNotification(`Loaded scenario: "${scen.name}"`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleSaveScenarioSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingScenario(true);
      const changes = {
        skills: selectedSkills,
        projects: selectedProjects,
        coding: { additionalSolved: codingSolved },
        development: {
          additionalRepos,
          openSourceContribution: openSourceContr,
          testingAdded,
        },
        profile: { completedMissing: completedProfile },
      };

      const res = await saveScenario(scenarioNameInput || `Plan for ${selectedRole}`, selectedRole, changes);
      if (res?.success) {
        setShowSaveModal(false);
        setScenarioNameInput('');
        setNotification('Scenario saved to your Career Lab library!');
        setTimeout(() => setNotification(''), 4000);
      }
    } catch (err) {
      console.error('Failed to save scenario:', err);
    } finally {
      setSavingScenario(false);
    }
  };

  const handleAddToRoadmap = async () => {
    try {
      setAddingToRoadmap(true);
      const changes = {
        skills: selectedSkills,
        projects: selectedProjects,
        coding: { additionalSolved: codingSolved },
      };

      const res = await addScenarioToRoadmap(selectedRole, changes);
      if (res?.success) {
        setNotification('Simulated milestones added to your Career Roadmap!');
        setTimeout(() => setNotification(''), 5000);
      }
    } catch (err) {
      console.error('Failed to add to roadmap:', err);
    } finally {
      setAddingToRoadmap(false);
    }
  };

  const loadRoleComparisons = async () => {
    try {
      setLoadingComparisons(true);
      const res = await compareAllRoles();
      if (res?.success) {
        setRoleComparisons(res.data);
      }
    } catch (err) {
      console.error('Failed to load role comparisons:', err);
    } finally {
      setLoadingComparisons(false);
    }
  };

  const loadSavedScenariosList = async () => {
    try {
      setLoadingSaved(true);
      const res = await getSavedScenarios();
      if (res?.success) {
        setSavedScenarios(res.data);
      }
    } catch (err) {
      console.error('Failed to load saved scenarios:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleDeleteScenario = async (id) => {
    try {
      await deleteSavedScenario(id);
      setSavedScenarios((prev) => prev.filter((s) => s._id !== id));
      setNotification('Scenario removed.');
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      console.error('Failed to delete scenario:', err);
    }
  };

  const scoreColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#6366f1';
    return '#f59e0b';
  };

  const totalChangesCount =
    selectedSkills.length +
    selectedProjects.length +
    (codingSolved > 0 ? 1 : 0) +
    (additionalRepos > 0 ? 1 : 0) +
    (openSourceContr ? 1 : 0) +
    (testingAdded ? 1 : 0) +
    (completedProfile ? 1 : 0);

  return (
    <UserLayout>
      <div className="career-lab-container" style={{ maxWidth: '1140px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid #ec4899',
                color: '#f472b6',
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <FlaskConical size={20} />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                MAVI Career Lab
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(236, 72, 153, 0.15)',
                  color: '#f472b6',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                }}
              >
                What-If Simulator
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
              Explore how hypothetical skills, projects, and coding milestones could improve your career readiness.
            </p>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.35rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`btn btn-sm ${activeTab === 'simulator' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
            >
              <FlaskConical size={14} /> Simulator
            </button>
            <button
              onClick={() => {
                setActiveTab('compare');
                loadRoleComparisons();
              }}
              className={`btn btn-sm ${activeTab === 'compare' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
            >
              <Layers size={14} /> Compare Roles
            </button>
            <button
              onClick={() => {
                setActiveTab('saved');
                loadSavedScenariosList();
              }}
              className={`btn btn-sm ${activeTab === 'saved' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
            >
              <Bookmark size={14} /> Saved Plans
            </button>
          </div>
        </div>

        {/* Current Profile Snapshot Banner */}
        {profileData && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '1.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>MAVI Score</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {profileData.user.maviScore} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ 1000</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Profile Strength</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                {profileData.user.profileStrength}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Developer DNA</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {profileData.user.dnaArchetype || 'Full-Stack'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Role Match</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: scoreColor(profileData.currentMatch.overallMatch) }}>
                {profileData.currentMatch.overallMatch}%
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 1: SIMULATOR ────────────────────────────────────────── */}
        {activeTab === 'simulator' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
            {/* Left Column: What-If Builder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Target Role Selector */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Target Career Role to Simulate
                </label>
                <select
                  value={selectedRole}
                  onChange={handleRoleSelect}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.95rem', fontWeight: 700, background: '#18181b', color: '#fff', padding: '0.6rem 0.8rem', borderRadius: '8px' }}
                >
                  {supportedRoles.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.role} ({r.domain})
                    </option>
                  ))}
                </select>
              </div>

              {/* What-If Improvements Builder */}
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={17} color="#ec4899" /> What if I improve...
                  </h3>
                  {totalChangesCount > 0 && (
                    <button
                      onClick={handleResetSimulation}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                    >
                      Reset All ({totalChangesCount})
                    </button>
                  )}
                </div>

                {/* 1. Skills to Simulate */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Code2 size={15} color="#818cf8" /> Technical Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {profileData?.availableSimulations?.skills?.map((skill) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => handleToggleSkill(skill)}
                          type="button"
                          style={{
                            padding: '0.35rem 0.7rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: `1px solid ${isSelected ? '#ec4899' : 'rgba(255,255,255,0.1)'}`,
                            background: isSelected ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.03)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s',
                          }}
                        >
                          {isSelected ? <Check size={13} color="#ec4899" /> : <Plus size={13} />} {skill}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Skill */}
                  <form onSubmit={handleAddCustomSkill} style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Add custom skill (e.g. AWS, Docker)..."
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      className="input-field"
                      style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                    />
                    <button type="submit" className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>
                      Add
                    </button>
                  </form>
                </div>

                {/* 2. Projects to Simulate */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FolderGit2 size={15} color="#ec4899" /> Portfolio Projects
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {profileData?.availableSimulations?.projects?.map((proj) => {
                      const isSelected = selectedProjects.some((p) => p.title === proj.title);
                      return (
                        <div
                          key={proj.id}
                          onClick={() => handleToggleProject(proj)}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            border: `1px solid ${isSelected ? '#ec4899' : 'rgba(255,255,255,0.08)'}`,
                            background: isSelected ? 'rgba(236, 72, 153, 0.12)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-primary)' }}>
                              {proj.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: isSelected ? '#ec4899' : 'var(--text-secondary)', fontWeight: 600 }}>
                              {isSelected ? '✓ Selected' : '+ Simulate'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                            {proj.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Problem Solving Coding Milestones */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Cpu size={15} color="#10b981" /> Coding Milestones
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {[15, 30, 50].map((num) => (
                      <button
                        key={num}
                        onClick={() => setCodingSolved((prev) => (prev === num ? 0 : num))}
                        type="button"
                        style={{
                          padding: '0.45rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          border: `1px solid ${codingSolved === num ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                          background: codingSolved === num ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.02)',
                          color: codingSolved === num ? '#10b981' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        +{num} Solved
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Development & GitHub Activity */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity size={15} color="#38bdf8" /> Development & GitHub
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={additionalRepos > 0}
                        onChange={(e) => setAdditionalRepos(e.target.checked ? 2 : 0)}
                      />
                      <span>Publish 2 Production Repositories</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={openSourceContr}
                        onChange={(e) => setOpenSourceContr(e.target.checked)}
                      />
                      <span>Contribute to Open-Source Repositories</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={testingAdded}
                        onChange={(e) => setTestingAdded(e.target.checked)}
                      />
                      <span>Integrate Automated CI/CD & Testing</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Simulation Result Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {simulationResult && (
                <div
                  className="card"
                  style={{
                    padding: '1.75rem',
                    background: 'linear-gradient(145deg, rgba(28, 20, 36, 0.9) 0%, rgba(18, 14, 26, 0.98) 100%)',
                    border: '1px solid rgba(236, 72, 153, 0.35)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Simulated Role
                      </div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {simulationResult.targetRole}
                      </h2>
                    </div>

                    <div
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '999px',
                        background: simulationResult.estimatedImpact > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${simulationResult.estimatedImpact > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: simulationResult.estimatedImpact > 0 ? '#10b981' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                      }}
                    >
                      {simulationResult.estimatedImpact > 0 ? `+${simulationResult.estimatedImpact} pts Estimated Impact` : 'No Impact Delta'}
                    </div>
                  </div>

                  {/* Score Comparison Display */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      marginBottom: '1.25rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Current Score */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Current Match
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif' }}>
                        {simulationResult.currentMatch}%
                      </div>
                    </div>

                    <div style={{ color: '#ec4899', fontSize: '1.5rem', fontWeight: 700 }}>
                      ➔
                    </div>

                    {/* Simulated Score */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#f472b6', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>
                        Simulated Match
                      </div>
                      <div style={{ fontSize: '2.4rem', fontWeight: 800, color: scoreColor(simulationResult.simulatedMatch), fontFamily: 'Outfit, sans-serif' }}>
                        {simulationResult.simulatedMatch}%
                      </div>
                    </div>
                  </div>

                  {/* Highest Impact Action Highlight */}
                  {simulationResult.highestImpactAction && simulationResult.highestImpactAction.impact > 0 && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'rgba(236, 72, 153, 0.1)',
                        border: '1px solid rgba(236, 72, 153, 0.25)',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={16} color="#ec4899" />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          Highest Impact Factor: <strong>{simulationResult.highestImpactAction.title}</strong>
                        </span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ec4899' }}>
                        +{simulationResult.highestImpactAction.impact} pts
                      </span>
                    </div>
                  )}

                  {/* Structured Explanation */}
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {simulationResult.explanation}
                  </p>

                  {/* 5-Dimension Competency Impact Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Competency Gain Breakdown
                    </div>

                    {Object.entries(simulationResult.categoryImpact).map(([key, data]) => {
                      const label = key === 'technicalSkills' ? 'Technical Skills' : key === 'problemSolving' ? 'Problem Solving' : key === 'projects' ? 'Projects' : key === 'developmentActivity' ? 'Development' : 'Profile';
                      return (
                        <div key={key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                            <span style={{ fontWeight: 700, color: data.delta > 0 ? '#10b981' : 'var(--text-primary)' }}>
                              {data.current}% ➔ {data.simulated}% {data.delta > 0 && `(+${data.delta}%)`}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${data.simulated}%`,
                                height: '100%',
                                background: data.delta > 0 ? 'linear-gradient(90deg, #ec4899, #10b981)' : '#6366f1',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleAddToRoadmap}
                      disabled={addingToRoadmap || totalChangesCount === 0}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <BookOpen size={15} /> Add to Career Roadmap
                    </button>
                    <button
                      onClick={() => setShowSaveModal(true)}
                      disabled={totalChangesCount === 0}
                      className="btn btn-outline"
                      style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <BookmarkPlus size={15} /> Save Plan
                    </button>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>
                    * {simulationResult.disclaimer} Real student profile is never modified.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: COMPARE ROLES ────────────────────────────────────── */}
        {activeTab === 'compare' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                  Multi-Role Alignment Matrix
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Estimated match percentages across all canonical roles based on your verified evidence.
                </p>
              </div>
              <button onClick={loadRoleComparisons} className="btn btn-outline btn-sm">
                <RefreshCw size={14} className={loadingComparisons ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loadingComparisons ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Comparing profiles...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {roleComparisons.map((r) => (
                  <div
                    key={r.role}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: r.role === selectedRole ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>{r.domain}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{r.confidence} Conf.</span>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                        {r.role}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: scoreColor(r.matchScore), fontFamily: 'Outfit, sans-serif' }}>
                        {r.matchScore}%
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRole(r.role);
                          setActiveTab('simulator');
                          loadProfile(r.role);
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        Simulate Role ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: SAVED SCENARIOS ──────────────────────────────────── */}
        {activeTab === 'saved' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
              Saved What-If Growth Plans
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>
              Your saved simulation plans and hypothetical career targets.
            </p>

            {loadingSaved ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
              </div>
            ) : savedScenarios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <Bookmark size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p>No saved scenarios yet. Run a simulation and click "Save Plan".</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {savedScenarios.map((s) => (
                  <div key={s._id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.2rem 0', color: 'var(--text-primary)' }}>
                          {s.name}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#f472b6', fontWeight: 600 }}>{s.targetRole}</span>
                      </div>
                      <button onClick={() => handleDeleteScenario(s._id)} className="btn-icon" title="Delete">
                        <Trash2 size={15} color="#f87171" />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0', fontSize: '0.82rem' }}>
                      <span>Current: <strong>{s.simulationResult?.currentMatch}%</strong></span>
                      <span>➔</span>
                      <span style={{ color: '#10b981' }}>Simulated: <strong>{s.simulationResult?.simulatedMatch}%</strong></span>
                    </div>

                    <button
                      onClick={() => handleLoadSavedScenario(s)}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    >
                      Load into Simulator
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save Scenario Modal */}
        {showSaveModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                Save What-If Scenario
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Save this hypothetical growth configuration to your Career Lab library for future reference.
              </p>

              <form onSubmit={handleSaveScenarioSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Scenario Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. My 90-Day ${selectedRole} Plan`}
                    value={scenarioNameInput}
                    onChange={(e) => setScenarioNameInput(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingScenario}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {savingScenario ? 'Saving...' : 'Save Plan'}
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

export default CareerLab;
