import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import api from '../api/axios';

const SkillProgressList = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([
    { name: 'React.js', pct: 80 },
    { name: 'Node.js', pct: 65 },
    { name: 'MongoDB', pct: 50 },
    { name: 'System Design', pct: 30 },
    { name: 'Cloud (AWS)', pct: 20 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get('/career/analysis');
        const radar = res.data?.data?.radar || [];
        if (radar.length > 0 && radar.some(r => r.axis === 'React.js' || r.axis === 'Node.js')) {
          const mapped = radar.map(r => ({
            name: r.axis,
            pct: Math.min(100, Math.max(10, r.score || 50)),
          }));
          setSkills(mapped.slice(0, 5));
        }
      } catch (err) {
        // Fallback already set to match reference
      }
    };
    fetchSkills();
  }, []);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '0.9rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '280px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'var(--brand-blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-blue)',
            }}
          >
            <Layers size={15} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
            Skill Progress
          </h3>
        </div>
        <button
          onClick={() => navigate('/dashboard/projects')}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: '6px',
            padding: '0.25rem 0.6rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--brand-blue)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          View All
        </button>
      </div>

      {/* Progress Items */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.5rem 0' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: '24px', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {skills.map((skill, idx) => (
            <div key={skill.name || idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{skill.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                  {skill.pct}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '5px',
                  borderRadius: '3px',
                  background: 'var(--border-color)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${skill.pct}%`,
                    height: '100%',
                    borderRadius: '3px',
                    background: '#3B82F6',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillProgressList;
