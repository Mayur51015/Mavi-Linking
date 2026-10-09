import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const Footer = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid #E5E7EB',
        background: '#FFFFFF',
        padding: '3rem 0 2rem 0',
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
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          {/* Brand Info */}
          <div>
            <BrandLogo variant="full" size={28} linkTo="/" />
            <p
              style={{
                color: '#6B7280',
                fontSize: '0.85rem',
                margin: '0.65rem 0 0 0',
                letterSpacing: '0.01em',
              }}
            >
              Education, Skills, Intelligence &amp; Hiring
            </p>
          </div>

          {/* Links */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.75rem',
              alignItems: 'center',
            }}
          >
            <a
              href="#what-it-does"
              style={{
                color: '#4B5563',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
            >
              Platform
            </a>
            <a
              href="#security"
              style={{
                color: '#4B5563',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
            >
              Security
            </a>
            <a
              href="mailto:contact@edutalentx.com"
              style={{
                color: '#4B5563',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
            >
              Contact
            </a>
            <RouterLink
              to="/"
              style={{
                color: '#4B5563',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
            >
              Privacy
            </RouterLink>
            <RouterLink
              to="/"
              style={{
                color: '#4B5563',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
            >
              Terms
            </RouterLink>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#6B7280',
          }}
        >
          <span>&copy; 2026 EduTalentX</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
