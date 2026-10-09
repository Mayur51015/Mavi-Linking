import React from 'react';
import { GraduationCap, Building2, Users } from 'lucide-react';

const WhoItsForSection = () => {
  const roles = [
    {
      role: 'STUDENTS',
      description: 'Build your profile and find opportunities.',
      icon: GraduationCap,
    },
    {
      role: 'INSTITUTIONS',
      description: 'Manage students and placement activities.',
      icon: Building2,
    },
    {
      role: 'RECRUITERS',
      description: 'Find and evaluate relevant candidates.',
      icon: Users,
    },
  ];

  return (
    <section
      id="who-its-for"
      style={{
        padding: '5rem 0',
        backgroundColor: '#F8F9FA',
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
            For students, institutions and recruiters.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.role}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '2rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'border-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      letterSpacing: '0.08em',
                      color: '#2563EB',
                    }}
                  >
                    {item.role}
                  </span>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={15} />
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.5,
                    color: '#111111',
                    margin: 0,
                    fontWeight: '400',
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

export default WhoItsForSection;
