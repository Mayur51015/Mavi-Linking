import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { getCareerLabProfile } from '../api/careerLab';
import { AuthContext } from '../context/AuthContext';

const CareerLabCard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCareerLabProfile();
      if (res?.success && res.data) {
        setProfileData(res.data);
      }
    } catch (err) {
      console.error('Failed to load Career Lab card:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, user?.preferredRole]);

  if (loading && !profileData) {
    return (
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ width: '120px', height: '18px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
        <div style={{ width: '100%', height: '60px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
      </div>
    );
  }

  const { targetRole, currentMatch } = profileData || {};
  const matchScore = currentMatch?.overallMatch || 0;

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
        border: '1px solid rgba(236, 72, 153, 0.25)',
        background: 'linear-gradient(145deg, rgba(25, 18, 30, 0.7) 0%, rgba(16, 12, 22, 0.9) 100%)',
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <FlaskConical size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                MAVI Career Lab
              </h3>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              background: 'rgba(236, 72, 153, 0.15)',
              color: '#f472b6',
              border: '1px solid rgba(236, 72, 153, 0.3)',
            }}
          >
            What-If Simulator
          </span>
        </div>

        {/* Content */}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
          Simulate hypothetical skills, projects, and coding milestones to see estimated career impact.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
            marginBottom: '0.85rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Target Role Match</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {targetRole || 'Full-Stack Developer'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ec4899', fontFamily: 'Outfit, sans-serif' }}>
              {matchScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={() => navigate('/dashboard/career-lab')}
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
          borderColor: 'rgba(236, 72, 153, 0.4)',
          color: 'var(--text-primary)',
          background: 'rgba(236, 72, 153, 0.08)',
        }}
      >
        <Zap size={14} style={{ color: '#f472b6' }} /> Launch Career Lab <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default CareerLabCard;
