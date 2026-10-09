import React from 'react';
import { User, Code2, Briefcase, TrendingUp } from 'lucide-react';

const WhatItDoesSection = () => {
  const items = [
    {
      title: 'Profile',
      description: 'Build a complete academic and professional profile.',
      icon: User,
    },
    {
      title: 'Skills',
      description: 'Show projects, certificates, coding and experience.',
      icon: Code2,
    },
    {
      title: 'Opportunities',
      description: 'Find internships, jobs and placement opportunities.',
      icon: Briefcase,
    },
    {
      title: 'Growth',
      description: 'Track your progress and improve your career readiness.',
      icon: TrendingUp,
    },
  ];

  return (
    <section
      id="what-it-does"
      style={{
        padding: '5rem 0',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '0 1.5rem',
        }}
      >
        <div style={{ marginBottom: '2.5rem' }}>
          <h2
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: '600',
              color: '#111111',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Everything in one place.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '1.75rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>

                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    color: '#111111',
                    margin: 0,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.925rem',
                    lineHeight: 1.55,
                    color: '#4B5563',
                    margin: 0,
                  }}
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatItDoesSection;
