import { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  TrendingUp,
  Flame,
  ChevronRight,
  Sparkles,
  BookOpen,
  Target,
  Award,
  BarChart2,
  MoreVertical,
  RotateCcw,
  AlertCircle,
  Clock
} from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { SkeletonCard } from './ui/Skeleton';

const calculateConsecutiveStreak = (activities = []) => {
  if (!activities || activities.length === 0) return 0;
  
  // Extract unique active days (YYYY-MM-DD)
  const activeDays = new Set(
    activities
      .map(a => a.date || a.createdAt)
      .filter(Boolean)
      .map(d => new Date(d).toISOString().split('T')[0])
  );

  if (activeDays.size === 0) return 0;

  const sortedDays = Array.from(activeDays).sort().reverse();
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If latest activity is not today or yesterday, streak is broken
  const latestDay = sortedDays[0];
  if (latestDay !== todayStr && latestDay !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(latestDay);

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedStr = checkDate.toISOString().split('T')[0];
    if (sortedDays.includes(expectedStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const LearningGrowthCard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [roadmap, setRoadmap] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [roadmapRes, activitiesRes] = await Promise.allSettled([
        api.get('/career/roadmap'),
        api.get('/ai/activities'),
      ]);

      if (roadmapRes.status === 'fulfilled' && roadmapRes.value.data?.success) {
        setRoadmap(roadmapRes.value.data.data);
      }

      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.data?.success) {
        setActivities(activitiesRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load learning & growth data:', err);
      setError("Learning data couldn't be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Derived metrics
  const progressVal = roadmap?.overallProgress !== undefined ? Math.min(100, Math.max(0, roadmap.overallProgress)) : null;
  const progressDisplay = progressVal !== null && progressVal > 0 ? `${progressVal}%` : 'Not started';

  const skillGaps = roadmap?.skillGaps || [];
  const improvingSkillsCount = skillGaps.filter(g => g.category === 'improve' || g.category === 'learn').length;
  const skillsDisplay = improvingSkillsCount > 0 ? improvingSkillsCount : (user?.skillsList?.length ? user.skillsList.length : '—');

  const streakDays = calculateConsecutiveStreak(activities);
  const streakDisplay = streakDays > 0 ? `${streakDays} days` : '0 days';

  // Single Recommended "Next Up For You" Item
  const getNextRecommendedItem = () => {
    if (roadmap?.nextAction?.stepTitle) {
      return {
        title: roadmap.nextAction.stepTitle,
        category: `${roadmap.targetRole || 'Full-Stack'} Track • Phase ${roadmap.nextAction.phaseNumber || 1}`,
        estimatedTime: '~4h',
        priority: 'High Priority',
        description: roadmap.nextAction.description || '',
      };
    }

    if (roadmap?.roadmapPhases?.length > 0) {
      const allItems = roadmap.roadmapPhases.flatMap(p => (p.items || []).map(i => ({ ...i, phaseTitle: p.title })));
      const nextItem = allItems.find(i => i.status === 'In Progress') || allItems.find(i => i.status === 'Not Started') || allItems[0];
      if (nextItem) {
        return {
          title: nextItem.title,
          category: `${roadmap.targetRole || 'Software Engineering'} • ${nextItem.phaseTitle || 'Core Track'}`,
          estimatedTime: '~3-4h',
          priority: nextItem.priority === 'High' ? 'High Priority' : 'Recommended',
          description: nextItem.description || '',
        };
      }
    }

    return null;
  };

  const nextItem = getNextRecommendedItem();

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.5rem',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
              padding: '0.45rem',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <GraduationCap size={18} color="var(--accent-purple)" />
            </div>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif', fontWeight: '700' }}>
              Learning & Growth
            </h3>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn btn-ghost btn-sm"
              aria-label="Card options"
              style={{ padding: '0.25rem 0.4rem', color: 'var(--text-muted)' }}
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  background: 'var(--bg-card, #12131a)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  zIndex: 20,
                  minWidth: '150px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    fetchData();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                >
                  <RotateCcw size={14} /> Refresh Data
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/student/career-roadmap');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                >
                  <Target size={14} /> View Roadmap
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 0.85rem 0' }}>
          Track your learning journey and level up your skills.
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, justifyContent: 'center' }}>
          <SkeletonCard lines={1} height="40px" />
          <SkeletonCard lines={2} height="65px" />
          <SkeletonCard lines={1} height="30px" />
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem' }}>
          <AlertCircle size={24} color="var(--accent-red)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
          <button onClick={fetchData} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      ) : !roadmap && !nextItem ? (
        /* Empty State */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0.5rem' }}>
          <Sparkles size={28} color="var(--accent-purple)" style={{ marginBottom: '0.4rem' }} />
          <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.2rem' }}>
            Start Your Learning Journey
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: '280px', marginBottom: '0.75rem', lineHeight: '1.3' }}>
            Explore courses and build skills aligned with your career goals.
          </p>
          <button
            onClick={() => navigate('/student/career-roadmap')}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
          >
            Explore Learning Paths
          </button>
        </div>
      ) : (
        <>
          {/* 2. Top 3 Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.6rem 0.75rem',
            marginBottom: '0.65rem',
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '1.2' }}>
                Learning Progress
              </div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '1.05rem', fontFamily: 'Outfit', marginTop: '0.15rem' }}>
                {progressDisplay}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.5rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '1.2' }}>
                Skills Improving
              </div>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '1.05rem', fontFamily: 'Outfit', marginTop: '0.15rem' }}>
                {skillsDisplay}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.5rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '1.2' }}>
                Learning Streak
              </div>
              <div style={{ color: streakDays > 0 ? '#f59e0b' : 'var(--text-secondary)', fontWeight: '700', fontSize: '1.05rem', fontFamily: 'Outfit', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {streakDays > 0 && <Flame size={14} color="#f59e0b" />}
                <span>{streakDisplay}</span>
              </div>
            </div>
          </div>

          {/* 3. Compact Horizontal Progress Bar */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <span>Learning Progress</span>
              <span>Goal: 100%</span>
            </div>
            <div style={{
              width: '100%',
              height: '5px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progressVal || 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
                borderRadius: '999px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
          </div>

          {/* 4. Next Up For You Recommendation */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
              Next Up For You
            </div>

            {nextItem ? (
              <div
                onClick={() => navigate('/student/career-roadmap')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {nextItem.title}
                    </div>
                    <span style={{
                      fontSize: '0.62rem',
                      color: '#f59e0b',
                      background: 'rgba(245, 158, 11, 0.12)',
                      padding: '0.08rem 0.35rem',
                      borderRadius: '4px',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}>
                      {nextItem.priority}
                    </span>
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {nextItem.category}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                      <Clock size={11} /> {nextItem.estimatedTime}
                    </span>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                  flexShrink: 0,
                }}>
                  <ChevronRight size={14} />
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}>
                All recommended milestones completed. Explore more learning tracks!
              </div>
            )}
          </div>
        </>
      )}

      {/* 5. Quick Actions (Bottom Bar) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.35rem',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '0.65rem',
      }}>
        <button
          onClick={() => navigate('/student/career-roadmap')}
          className="btn btn-ghost btn-sm"
          style={{
            padding: '0.35rem 0.2rem',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            borderRadius: '6px',
          }}
          title="Learning Paths"
        >
          <BookOpen size={13} color="var(--accent-purple)" />
          <span>Paths</span>
        </button>

        <button
          onClick={() => navigate('/student/career-roadmap')}
          className="btn btn-ghost btn-sm"
          style={{
            padding: '0.35rem 0.2rem',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            borderRadius: '6px',
          }}
          title="Skill Gap Analysis"
        >
          <Target size={13} color="var(--accent-cyan)" />
          <span>Skill Gap</span>
        </button>

        <button
          onClick={() => navigate('/dashboard/documents')}
          className="btn btn-ghost btn-sm"
          style={{
            padding: '0.35rem 0.2rem',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            borderRadius: '6px',
          }}
          title="Certificates"
        >
          <Award size={13} color="#fbbf24" />
          <span>Certificates</span>
        </button>

        <button
          onClick={() => navigate('/dashboard/insights')}
          className="btn btn-ghost btn-sm"
          style={{
            padding: '0.35rem 0.2rem',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            borderRadius: '6px',
          }}
          title="Progress & Insights"
        >
          <BarChart2 size={13} color="#10b981" />
          <span>Progress</span>
        </button>
      </div>
    </div>
  );
};

export default LearningGrowthCard;
