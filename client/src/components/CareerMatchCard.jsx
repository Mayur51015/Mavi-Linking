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
    if (score >= 75) return '#10b981'; // Green
    if (score >= 50) return '#6366f1'; // Indigo/Purple
    return '#f59e0b'; // Amber
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '120px', height: '18px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
          <div style={{ width: '60px', height: '18px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
        </div>
        <div style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }} />
      </div>
    );
  }

  if (error && !matchData) {
    return (
      <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 600, fontSize: '0.9rem' }}>
            <Target size={16} /> MAVI Career Match
          </div>
          <button onClick={fetchMatch} className="btn-icon" title="Retry" style={{ padding: '4px' }}>
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
      className="card hover-lift"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        background: 'linear-gradient(145deg, rgba(20, 20, 30, 0.7) 0%, rgba(15, 15, 25, 0.9) 100%)',
      }}
    >
      {/* Background Accent Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
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
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              background: confidence === 'High' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: confidence === 'High' ? '#10b981' : '#f59e0b',
              border: `1px solid ${confidence === 'High' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <ShieldCheck size={11} /> {confidence} Confidence
          </span>
        </div>

        {/* Target Role & Match Score Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Target Role
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {targetRole || 'Full-Stack Developer'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: scoreColor(overallMatch),
                fontFamily: 'Outfit, sans-serif',
                lineHeight: 1,
              }}
            >
              {overallMatch}%
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              MATCH SCORE
            </div>
          </div>
        </div>

        {/* Mini Breakdown Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Technical Skills</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{breakdown?.technicalSkills?.score || 0}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${breakdown?.technicalSkills?.score || 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: '2px',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            <span>Problem Solving</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{breakdown?.problemSolving?.score || 0}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${breakdown?.problemSolving?.score || 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>

        {/* Quick Highlights: Top Strength & Top Gap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
          {strengths && strengths.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
              <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Strong: <strong style={{ color: 'var(--text-primary)' }}>{strengths.slice(0, 3).map((s) => s.skill).join(', ')}</strong>
              </span>
            </div>
          )}
          {skillGaps && skillGaps.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Improve: <strong style={{ color: 'var(--text-primary)' }}>{skillGaps.slice(0, 2).map((s) => s.skill).join(', ')}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <button
        onClick={() => navigate('/dashboard/career-match')}
        className="btn btn-outline"
        style={{
          width: '100%',
          padding: '0.45rem 0.75rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          borderColor: 'rgba(99, 102, 241, 0.4)',
          color: 'var(--text-primary)',
          background: 'rgba(99, 102, 241, 0.08)',
        }}
      >
        <Zap size={14} style={{ color: '#818cf8' }} /> View Full Match Analysis <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default CareerMatchCard;
