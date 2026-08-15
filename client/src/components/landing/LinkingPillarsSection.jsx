import React from 'react';
import { Users, Database, BrainCircuit, Rocket } from 'lucide-react';

const LinkingPillarsSection = () => {
  const pillars = [
    {
      number: '01',
      title: 'PEOPLE LINKING',
      subtitle: 'Connecting Every Stakeholder',
      icon: Users,
      color: '#8b5cf6',
      flows: [
        'Student ↔ Teacher',
        'Student ↔ Recruiter',
        'Teacher ↔ Department',
        'Recruiter ↔ Institution',
      ],
    },
    {
      number: '02',
      title: 'DATA LINKING',
      subtitle: 'Unified Digital Identity & Records',
      icon: Database,
      color: '#3b82f6',
      flows: [
        'MAVI ID & PRN',
        'Academic Records',
        'GitHub & LeetCode',
        'Projects & Verified Skills',
      ],
    },
    {
      number: '03',
      title: 'INTELLIGENCE LINKING',
      subtitle: 'Transforming Data into Actionable Insights',
      icon: BrainCircuit,
      color: '#ec4899',
      flows: [
        'Institutional Data',
        '↓ MAVI AI Engine',
        '↓ Growth Insights',
        '→ Strategic Decisions',
      ],
    },
    {
      number: '04',
      title: 'OPPORTUNITY LINKING',
      subtitle: 'Connecting Capabilities with Careers',
      icon: Rocket,
      color: '#10b981',
      flows: [
        'Student Capabilities',
        '↓ AI Readiness Score',
        '↓ Recruiter Discovery',
        '→ Campus Placement',
      ],
    },
  ];

  return (
    <section id="linking" className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-purple" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          OUR BRAND PHILOSOPHY
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          What Does <span className="text-gradient">Linking</span> Mean?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto' }}>
          Four foundational pillars that transform raw institutional activity into connected growth.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
        {pillars.map((pillar, idx) => {
          const IconComponent = pillar.icon;
          return (
            <div
              key={idx}
              className="glass-card reveal"
              style={{
                padding: '2.25rem 1.75rem',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: '900',
                    color: pillar.color,
                    fontFamily: 'monospace',
                    opacity: 0.8,
                  }}
                >
                  {pillar.number}
                </div>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${pillar.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: pillar.color,
                  }}
                >
                  <IconComponent size={22} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.35rem', letterSpacing: '0.5px' }}>
                {pillar.title}
              </h3>
              <div style={{ fontSize: '0.85rem', color: pillar.color, fontWeight: '600', marginBottom: '1.5rem' }}>
                {pillar.subtitle}
              </div>

              <div
                style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: '14px',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  marginTop: 'auto',
                  display: 'grid',
                  gap: '0.5rem',
                }}
              >
                {pillar.flows.map((flow, flowIdx) => (
                  <div key={flowIdx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {flow}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="glass-card-static reveal"
        style={{
          padding: '1.75rem 2rem',
          borderRadius: '20px',
          textAlign: 'center',
          border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.3))',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
          maxWidth: '780px',
          margin: '0 auto',
        }}
      >
        <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
          "MAVI Linking connects the people, data, intelligence, and opportunities that drive institutional growth."
        </p>
      </div>
    </section>
  );
};

export default LinkingPillarsSection;
