import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer
      className="footer"
      style={{
        borderTop: '1px solid var(--border-color)',
        marginTop: '4rem',
        paddingTop: '3.5rem',
        paddingBottom: '2rem',
        position: 'relative',
        background: 'var(--bg-secondary)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Brand Column */}
          <div style={{ gridColumn: 'span 2' }}>
            <BrandLogo variant="full" size={40} linkTo="/" showTagline={true} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '340px', marginTop: '1rem' }}>
              The digital operating platform for Education, Skills, Intelligence &amp; Hiring. Connecting Institutions, Empowering Students, and Accelerating Careers.
            </p>
          </div>

          {/* Platform Modules */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><a href="#modules" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>EduTalentX ERP</a></li>
              <li><a href="#ai" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>EduTalentX AI Engine</a></li>
              <li><a href="#analytics" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>EduTalentX Insights</a></li>
              <li><a href="#placement" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>EduTalentX Talent</a></li>
              <li><a href="#security" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>EduTalentX Verify</a></li>
              <li><a href="#pricing" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>EduTalentX Billing</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><RouterLink to="/" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>About Us</RouterLink></li>
              <li><RouterLink to="/login" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Institution Portal</RouterLink></li>
              <li><RouterLink to="/register" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Get Started</RouterLink></li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Trust &amp; Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><a href="#security" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Security Architecture</a></li>
              <li><a href="#linking" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Brand Philosophy</a></li>
              <li><span style={{ color: 'var(--text-muted)' }}>Privacy Policy</span></li>
              <li><span style={{ color: 'var(--text-muted)' }}>Terms of Service</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <p style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} EduTalentX — Education, Skills, Intelligence &amp; Hiring. All rights reserved.
          </p>

          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
