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
        <div style={{ width: '120px', height: '18px', background: 'var(--bg-tertiary)', borderRadius: '6px' }} />
        <div style={{ width: '100%', height: '60px', background: 'var(--bg-subtle)', borderRadius: '8px' }} />
      </div>
    );
  }

  const { targetRole, currentMatch } = profileData || {};
  const matchScore = currentMatch?.overallMatch || 0;

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
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#172554',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
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
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              background: '#172554',
              color: '#60A5FA',
              border: '1px solid #1D4ED8',
            }}
          >
            What-If Simulator
          </span>
        </div>

        {/* Content */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
          Simulate hypothetical skills, projects, and credentials to forecast career match trajectory.
        </p>

        {/* Clean Comparison Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            background: 'var(--bg-subtle)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '0.85rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Current Profile
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
              {matchScore}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {targetRole || 'Developer'}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Projected Trajectory
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', marginTop: '0.15rem' }}>
              +{Math.min(15, 100 - matchScore)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              via +2 Skills / Projects
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>* Hypothetical scenario — Does not alter live profile.</span>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={() => navigate('/dashboard/career-lab')}
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
        <Zap size={14} style={{ color: '#3B82F6' }} /> Launch Career Lab Simulator <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default CareerLabCard;
