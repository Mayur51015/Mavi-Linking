import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const FinalCTASection = () => {
  return (
    <section
      id="cta"
      style={{
        padding: '5rem 0 6rem 0',
        backgroundColor: '#FFFFFF',
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
          style={{
            background: '#F8F9FA',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            maxWidth: '680px',
            margin: '0 auto',
          }}
        >
          <h2
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: '600',
              color: '#111111',
              letterSpacing: '-0.02em',
              margin: '0 0 0.85rem 0',
            }}
          >
            Ready to get started?
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: '#4B5563',
              margin: '0 auto 2rem auto',
              maxWidth: '460px',
            }}
          >
            Create your EduTalentX profile and take the next step.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: 'none',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              Get Started <ArrowRight size={15} />
            </Link>

            <Link
              to="/login"
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
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
