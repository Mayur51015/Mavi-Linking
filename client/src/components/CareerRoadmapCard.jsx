import { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Edit3,
  Check
} from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const CareerRoadmapCard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [roadmap, setRoadmap] = useState(null);
  const [profileStrength, setProfileStrength] = useState(50);
  const [missingItems, setMissingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
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
        if (res.data.data?.targetRole) {
          setCustomGoal(res.data.data.targetRole);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Career Roadmap:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (err.response?.status === 404) {
        setRoadmap(null);
      } else {
        setError(err.response?.data?.message || 'Could not load your career roadmap at this time.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleGenerate = async (roleOverride) => {
    if (generating) return;
    try {
      setGenerating(true);
      setError('');
      const targetRoleToUse = roleOverride || customGoal || roadmap?.targetRole || user?.preferredDomain || 'Full-Stack Developer';
      const res = await api.post('/career/roadmap/generate', { targetRole: targetRoleToUse });
      if (res.data?.success) {
        setRoadmap(res.data.data);
      }
    } catch (err) {
      console.error('Career roadmap generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate career roadmap. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateGoalSubmit = async (e) => {
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
      console.error('Failed to update target role:', err);
      setError(err.response?.data?.message || 'Failed to update target career goal.');
    } finally {
      setUpdatingGoal(false);
    }
  };

  // Collect a preview list of up to 4 items from the roadmap (completed + upcoming)
  const getPreviewItems = () => {
    if (!roadmap?.roadmapPhases?.length) return [];
    const allItems = roadmap.roadmapPhases.flatMap(p => p.items || []);
    
    // Pick 2 completed (or first available completed) and 2 upcoming (in progress or not started)
    const completed = allItems.filter(i => i.status === 'Completed').slice(0, 2);
    const upcoming = allItems.filter(i => i.status !== 'Completed').slice(0, 4 - completed.length);
    
    // If not enough, fill with any available items
    const combined = [...completed, ...upcoming];
    return combined.slice(0, 4);
  };

  const previewItems = getPreviewItems();
  const progressPercent = roadmap?.overallProgress !== undefined ? Math.min(100, Math.max(0, roadmap.overallProgress)) : 0;
  const currentLevel = roadmap?.currentLevel || 'Intermediate';
  const targetRole = roadmap?.targetRole || user?.preferredDomain || 'Full-Stack Engineer';

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', textAlign: 'center' }}>
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.25rem', borderRadius: '50%', marginBottom: '1.25rem' }}>
          <Loader2 size={36} color="var(--accent-purple)" className="animate-spin" />
        </div>
        <h4 style={{ color: 'white', fontSize: '1.15rem', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
          Loading Your Career Roadmap...
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Retrieving your real-time skills and milestones
        </p>
      </div>
    );
  }

  // Empty state if no roadmap could be found/generated and profile lacks info
  if (!roadmap && !generating) {
    return (
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '1.25rem', borderRadius: '50%', marginBottom: '1.25rem' }}>
          <Compass size={40} color="var(--accent-purple)" />
        </div>
        <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.35rem', fontFamily: 'Outfit, sans-serif' }}>
          MAVI Career Roadmap
        </h3>
        <p style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.75rem' }}>
          Your career roadmap needs a little more information.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '380px', marginBottom: '1.5rem' }}>
          Add your skills, projects or career goal to generate a personalized AI roadmap tailored to your dream role.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '340px', flexDirection: 'column' }}>
          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={16} />
            {generating ? 'Building your roadmap...' : 'Generate My Career Roadmap'}
          </button>
          <button
            onClick={() => navigate('/dashboard/link')}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            Complete Profile
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--accent-red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
            padding: '0.75rem',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Compass size={24} color="var(--accent-purple)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
                MAVI Career Roadmap
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                AI Personalized
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Build your path from your current skills to your target career.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleGenerate()}
          disabled={generating}
          className="btn btn-ghost btn-sm"
          title="Regenerate Roadmap"
          style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
        >
          <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
        </button>
      </div>

      {generating && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--accent-purple)',
          fontSize: '0.85rem'
        }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Building your personalized career roadmap...</span>
        </div>
      )}

      {/* Meta Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '0.875rem 1rem',
        marginBottom: '1.25rem',
      }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            Current Level
          </div>
          <div style={{ color: 'white', fontWeight: '600', fontSize: '0.95rem' }}>
            {currentLevel}
          </div>
        </div>

        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            Target Role
          </div>
          <div style={{
            color: 'var(--accent-cyan)',
            fontWeight: '600',
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            cursor: 'pointer'
          }}
          onClick={() => setShowGoalModal(true)}
          title="Click to change target role"
          >
            <span>{targetRole}</span>
            <Edit3 size={11} color="var(--text-muted)" />
          </div>
        </div>

        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            Progress
          </div>
          <div style={{ color: 'var(--accent-purple)', fontWeight: '700', fontSize: '0.95rem', fontFamily: 'Outfit' }}>
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'var(--gradient-primary, linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%))',
            borderRadius: '999px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      {/* Next Recommended Items List */}
      <div style={{ flex: 1, marginBottom: '1.25rem' }}>
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.65rem'
        }}>
          Next Recommended:
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {previewItems.map((item, idx) => {
            const isCompleted = item.status === 'Completed';
            return (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: isCompleted ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                {isCompleted ? (
                  <Check size={15} color="#10b981" style={{ flexShrink: 0 }} />
                ) : (
                  <ArrowRight size={14} color="var(--accent-purple)" style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                }}>
                  {item.title}
                </span>
                {item.priority === 'High' && !isCompleted && (
                  <span style={{ fontSize: '0.65rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                    Priority
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA Button */}
      <button
        onClick={() => navigate('/student/career-roadmap')}
        className="btn btn-primary"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}
      >
        <Compass size={18} />
        View My Roadmap
      </button>

      {/* Quick Career Goal Modal */}
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
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem', fontFamily: 'Outfit' }}>
              Update Target Career Goal
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Specify your dream role to instantly regenerate your personalized learning roadmap.
            </p>

            <form onSubmit={handleUpdateGoalSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  Target Role
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Full-Stack Developer, AI/ML Engineer, DevOps"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {['Full-Stack Developer', 'AI/ML Engineer', 'Frontend Developer', 'Backend Developer', 'Data Scientist', 'DevOps Engineer'].map((role) => (
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
                      padding: '0.3rem 0.6rem',
                    }}
                  >
                    {role}
                  </button>
                ))}
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
                  {updatingGoal ? 'Updating...' : 'Update & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmapCard;
