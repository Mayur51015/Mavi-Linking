import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

const CareerFlowSection = () => {
  const steps = [
    { num: '01', title: 'Profile', desc: 'Academic records' },
    { num: '02', title: 'Skills', desc: 'Projects & code' },
    { num: '03', title: 'Verification', desc: 'Institutional check' },
    { num: '04', title: 'Opportunities', desc: 'Internships & jobs' },
    { num: '05', title: 'Career', desc: 'Verified placement' },
  ];

  return (
    <section
      id="flow"
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
        <div style={{ marginBottom: '3rem' }}>
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
            From skills to opportunity.
          </h2>
        </div>

        {/* Desktop Horizontal Flow / Mobile Vertical Stack */}
        <div className="flow-container">
          <div
            className="flow-track"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              position: 'relative',
            }}
          >
            {steps.map((step, idx) => (
              <React.Fragment key={step.title}>
                <div
                  className="flow-step-node"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    flex: 1,
                    minWidth: '130px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: '#2563EB',
                      fontWeight: '600',
                    }}
                  >
                    {step.num}
                  </span>
                  <span
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      color: '#111111',
                    }}
                  >
                    {step.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: '#4B5563',
                    }}
                  >
                    {step.desc}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className="flow-step-arrow hide-mobile"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      paddingTop: '1.35rem',
                      color: '#9CA3AF',
                    }}
                  >
                    <ArrowRight size={16} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Target anchor for Security navigation */}
        <div
          id="security"
          style={{
            marginTop: '3.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.85rem',
            color: '#4B5563',
          }}
        >
          <ShieldCheck size={16} color="#2563EB" />
          <span>
            Institutional verification &bull; Role-based access control &bull; Student data privacy
          </span>
        </div>
      </div>
    </section>
  );
};

export default CareerFlowSection;
