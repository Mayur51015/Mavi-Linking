import React from 'react';
import { Users, Database, Cpu, Rocket, Sparkles, CheckCircle } from 'lucide-react';

const SolutionSection = () => {
  const quadrants = [
    {
      title: 'PEOPLE',
      color: '#8b5cf6',
      icon: Users,
      items: ['Students', 'Teachers', 'Recruiters', 'Administrators'],
    },
    {
      title: 'DATA',
      color: '#3b82f6',
      icon: Database,
      items: ['Academic Data', 'Projects', 'Skills', 'PRN & MAVI ID', 'Placement Records'],
    },
    {
      title: 'INTELLIGENCE',
      color: '#ec4899',
      icon: Cpu,
      items: ['MAVI AI Engine', 'Growth Analytics', 'Readiness Scores', 'Smart Recommendations'],
    },
    {
      title: 'OPPORTUNITIES',
      color: '#10b981',
      icon: Rocket,
      items: ['Campus Recruitment', 'Placement Pipelines', 'Career Growth', 'Skill Benchmarking'],
    },
  ];

  return (
    <section className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-emerald" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          UNIFIED INSTITUTIONAL ECOSYSTEM
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          One Platform. <span className="text-gradient">Every Connection.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '720px', margin: '0 auto', lineHeight: 1.65 }}>
          From identity and institutional management to AI-powered analytics and placement intelligence, MAVI Linking creates one connected digital ecosystem for modern institutions.
        </p>
      </div>

      {/* Central Matrix Visualization */}
      <div
        className="glass-card reveal"
        style={{
          padding: '3rem 2rem',
          borderRadius: '28px',
          border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.4))',
          boxShadow: 'var(--shadow-glow-strong)',
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, var(--bg-card) 100%)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          {quadrants.map((quad, idx) => {
            const IconComponent = quad.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-glass)',
                  borderRadius: '20px',
                  padding: '1.75rem',
                  border: `1px solid ${quad.color}30`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: `${quad.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: quad.color,
                    }}
                  >
                    <IconComponent size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '1px' }}>
                    {quad.title}
                  </h3>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.6rem' }}>
                  {quad.items.map((item, itemIdx) => (
                    <li key={itemIdx} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={14} color={quad.color} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Central Hub Overlay Banner */}
        <div
          style={{
            marginTop: '2.5rem',
            padding: '1.25rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          <Sparkles size={20} color="var(--accent-purple)" />
          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Everything connects seamlessly through MAVI LINKING
          </span>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
