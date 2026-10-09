import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, GraduationCap, Code2, Briefcase, CheckCircle2 } from 'lucide-react';

const HeroSection = () => {
  return (
    <section
      style={{
        paddingTop: '7.5rem',
        paddingBottom: '5rem',
        background: '#FFFFFF',
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
        <div
          className="hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3.5rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Headline & Action */}
          <div>
            {/* Small Label */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#2563EB',
                marginBottom: '1.25rem',
              }}
            >
              EDUCATION • SKILLS • CAREER
            </div>

            {/* Main Heading */}
            <h1
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                lineHeight: 1.15,
                fontWeight: '700',
                color: '#111111',
                letterSpacing: '-0.025em',
                margin: '0 0 1.25rem 0',
              }}
            >
              Build skills.
              <br />
              Find opportunities.
            </h1>

            {/* Supporting Text */}
            <p
              style={{
                fontSize: '1.05rem',
                lineHeight: 1.6,
                color: '#4B5563',
                maxWidth: '460px',
                margin: '0 0 2rem 0',
              }}
            >
              EduTalentX connects students, institutions, faculty, and recruiters in one platform.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.85rem',
                alignItems: 'center',
              }}
            >
              <Link
                to="/register"
                className="btn btn-primary"
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  padding: '0.75rem 1.6rem',
                  borderRadius: '6px',
                  fontSize: '0.925rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease',
                  border: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
              >
                Get Started
              </Link>

              <a
                href="#what-it-does"
                style={{
                  background: '#FFFFFF',
                  color: '#111111',
                  border: '1px solid #E5E7EB',
                  padding: '0.75rem 1.6rem',
                  borderRadius: '6px',
                  fontSize: '0.925rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                Explore Platform
              </a>
            </div>
          </div>

          {/* Right Column: Hero Visual — Student -> Skills -> Opportunities */}
          <div>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '2rem 1.75rem',
                maxWidth: '440px',
                margin: '0 auto',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '1rem',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid #E5E7EB',
                  fontSize: '0.75rem',
                  color: '#6B7280',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                }}
              >
                <span>Platform Architecture</span>
                <span style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Active
                </span>
              </div>

              {/* Node 1: Student */}
              <div
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <GraduationCap size={18} />
                </div>
                <div>
                  <div style={{ color: '#111111', fontWeight: '600', fontSize: '0.925rem' }}>
                    Student
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '2px' }}>
                    Academic record & verified identity
                  </div>
                </div>
              </div>

              {/* Connector 1 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.65rem 0',
                }}
              >
                <div style={{ width: '1px', height: '14px', background: '#D1D5DB' }} />
                <div
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '999px',
                    padding: '2px 10px',
                    fontSize: '0.7rem',
                    color: '#1D4ED8',
                    fontWeight: '500',
                    margin: '3px 0',
                  }}
                >
                  EduTalentX
                </div>
                <div style={{ width: '1px', height: '14px', background: '#D1D5DB' }} />
                <ArrowDown size={14} color="#6B7280" />
              </div>

              {/* Node 2: Skills */}
              <div
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Code2 size={18} />
                </div>
                <div>
                  <div style={{ color: '#111111', fontWeight: '600', fontSize: '0.925rem' }}>
                    Skills
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '2px' }}>
                    Projects, certificates & code profiles
                  </div>
                </div>
              </div>

              {/* Connector 2 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.65rem 0',
                }}
              >
                <div style={{ width: '1px', height: '18px', background: '#D1D5DB' }} />
                <ArrowDown size={14} color="#6B7280" />
              </div>

              {/* Node 3: Opportunities */}
              <div
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Briefcase size={18} />
                </div>
                <div>
                  <div style={{ color: '#111111', fontWeight: '600', fontSize: '0.925rem' }}>
                    Opportunities
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: '2px' }}>
                    Internships, jobs & placement drives
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
