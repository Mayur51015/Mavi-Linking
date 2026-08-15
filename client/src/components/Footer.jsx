import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Sparkles, ArrowUp, ShieldCheck, FileText, Book, Lock } from 'lucide-react';

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
        paddingTop: '4.5rem',
        paddingBottom: '2.5rem',
        position: 'relative',
        background: 'var(--bg-secondary)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '3rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Brand Column */}
          <div style={{ gridColumn: 'span 2' }}>
            <RouterLink to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Sparkles size={18} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff' }}>
                MAVI <span style={{ color: '#c4b5fd', fontWeight: '400' }}>LINKING</span>
              </span>
            </RouterLink>

            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>
              The Digital Operating Platform for Institutions
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, maxWidth: '320px' }}>
              "Connecting Institutions. Empowering People. Enabling Intelligence."
            </p>
          </div>

          {/* Platform Modules */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><a href="#modules" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>MAVI ERP</a></li>
              <li><a href="#ai" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>MAVI AI Engine</a></li>
              <li><a href="#analytics" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>MAVI Insights</a></li>
              <li><a href="#placement" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>MAVI Talent</a></li>
              <li><a href="#security" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>MAVI Verify</a></li>
              <li><a href="#pricing" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>MAVI Billing</a></li>
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
              <li><a href="mailto:contact@mavilinking.com" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Contact Sales</a></li>
              <li><RouterLink to="/register" className="footer-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Get Started</RouterLink></li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Trust & Legal
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
            paddingTop: '2rem',
            borderTop: '1px solid var(--border-color)',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <p style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} MAVI Linking. The Digital Operating Platform for Institutions.
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
