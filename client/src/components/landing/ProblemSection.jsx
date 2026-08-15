import React from 'react';
import { Unplug, Layers, BrainCircuit, Clock, Sparkles } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      title: 'Disconnected People',
      description: 'Students, faculty, recruiters, and administrators often work across separate workflows.',
      icon: Unplug,
      color: '#ef4444',
      badge: 'Workflows',
    },
    {
      title: 'Fragmented Data',
      description: 'Academic, development, placement, and institutional data are difficult to connect.',
      icon: Layers,
      color: '#f59e0b',
      badge: 'Silos',
    },
    {
      title: 'Limited Intelligence',
      description: 'Raw data exists, but actionable insights are often missing.',
      icon: BrainCircuit,
      color: '#06b6d4',
      badge: 'Analysis',
    },
    {
      title: 'Manual Operations',
      description: 'Verification, approvals, reporting, and administration consume valuable time.',
      icon: Clock,
      color: '#8b5cf6',
      badge: 'Overhead',
    },
  ];

  return (
    <section className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-purple" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          THE INSTITUTIONAL CHALLENGE
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          Institutions Have <span className="text-gradient-secondary">Data Everywhere.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto' }}>
          But meaningful information is often scattered across different systems.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
        {problems.map((prob, idx) => {
          const IconComp = prob.icon;
          return (
            <div
              key={idx}
              className="glass-card reveal"
              style={{
                padding: '2.25rem 1.75rem',
                borderRadius: '20px',
                borderTop: `3px solid ${prob.color}`,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: `${prob.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: prob.color,
                  }}
                >
                  <IconComp size={24} />
                </div>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  {prob.badge}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.75rem' }}>
                {prob.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, flexGrow: 1 }}>
                {prob.description}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className="glass-card-static reveal"
        style={{
          padding: '1.5rem 2rem',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.4))',
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, rgba(18, 18, 28, 0.5) 100%)',
          maxWidth: '560px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
          <Sparkles size={20} color="var(--accent-purple)" />
          <span>MAVI Linking brings everything together.</span>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
