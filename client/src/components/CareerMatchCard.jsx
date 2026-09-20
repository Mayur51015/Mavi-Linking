import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { getCareerMatch } from '../api/careerMatch';
import { AuthContext } from '../context/AuthContext';

const CareerMatchCard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMatch = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getCareerMatch();
      if (res?.success && res.data) {
        setMatchData(res.data);
      }
    } catch (err) {
      console.error('Failed to load Career Match:', err);
      setError(err.response?.data?.message || 'Could not load Career Match');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch, user?.preferredRole]);

  const scoreColor = (score) => {
    if (score >= 75) return '#8B5CF6';
    if (score >= 50) return '#3B82F6';
    return '#06B6D4';
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '120px', height: '18px', background: 'var(--bg-tertiary)', borderRadius: '6px' }} />
          <div style={{ width: '60px', height: '18px', background: 'var(--bg-tertiary)', borderRadius: '6px' }} />
        </div>
        <div style={{ width: '100%', height: '80px', background: 'var(--bg-subtle)', borderRadius: '10px' }} />
      </div>
    );
  }

  if (error && !matchData) {
    return (
      <div className="card" style={{ padding: '1.25rem', border: '1px solid #FECACA' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontWeight: 600, fontSize: '0.9rem' }}>
            <Target size={16} /> MAVI Career Match
          </div>
          <button onClick={fetchMatch} className="btn-icon" title="Retry" style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <RefreshCw size={14} />
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  const { targetRole, overallMatch, confidence, breakdown, strengths, skillGaps } = matchData || {};

  return (
    <div
      className="erp-card"
      style={{
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B5CF6',
              }}
            >
              <Target size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Career Match
              </h3>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              background: confidence === 'High' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: confidence === 'High' ? '#22C55E' : '#F59E0B',
              border: `1px solid ${confidence === 'High' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <ShieldCheck size={11} /> {confidence || 'Normal'} Confidence
          </span>
        </div>

        {/* Target Role & Match Score Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '0.85rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Target Role
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {targetRole || 'Full-Stack Developer'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: scoreColor(overallMatch),
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1,
              }}
            >
              {overallMatch || 0}%
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.15rem' }}>
              Match Score
            </div>
          </div>
        </div>

        {/* Mini Breakdown Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Technical Skills</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{breakdown?.technicalSkills?.score || 0}%</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${breakdown?.technicalSkills?.score || 0}%`,
                height: '100%',
                background: '#3B82F6',
                borderRadius: '3px',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            <span>Problem Solving</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{breakdown?.problemSolving?.score || 0}%</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${breakdown?.problemSolving?.score || 0}%`,
                height: '100%',
                background: '#10B981',
                borderRadius: '3px',
              }}
            />
          </div>
        </div>

        {/* Quick Highlights: Top Strength & Top Gap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', marginBottom: '0.85rem' }}>
          {strengths && strengths.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669' }}>
              <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Skills: <strong style={{ color: 'var(--text-primary)' }}>{strengths.slice(0, 3).map((s) => s.skill).join(', ')}</strong>
              </span>
            </div>
          )}
          {skillGaps && skillGaps.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D97706' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Gaps: <strong style={{ color: 'var(--text-primary)' }}>{skillGaps.slice(0, 2).map((s) => s.skill).join(', ')}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action CTA */}
      <button
        onClick={() => navigate('/dashboard/career-match')}
        className="btn btn-secondary"
        style={{
          width: '100%',
          padding: '0.5rem 0.85rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}
      >
        <Zap size={14} style={{ color: '#3B82F6' }} /> View Career Analysis <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default CareerMatchCard;
