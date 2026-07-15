
import { Link as RouterLink } from 'react-router-dom';
import { Terminal, GitBranch, MessageCircle, Link as LinkIcon, Heart, ArrowUp, Mail, Book, FileText, Users, MessageSquare } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="footer section-dark" style={{ borderTop: '1px solid var(--border-color)', marginTop: '6rem', paddingTop: '4rem', paddingBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div className="footer-glow" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
      <div className="container">
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
          
          {/* Brand Section */}
          <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: '1 / -1', '@media (minWidth: 768px)': { gridColumn: 'span 2' } }}>
            <RouterLink to="/" className="nav-brand" aria-label="Home" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Terminal size={28} className="text-gradient" />
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>MaVi Linking</span>
            </RouterLink>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '300px' }}>
              One platform for students, recruiters, and teachers. Empowering the next generation of developers with AI-driven insights and a unified identity.
            </p>
            <div className="social-links" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <a href="#" className="social-btn" aria-label="GitHub" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', transition: 'all 0.3s ease' }}><GitBranch size={20} /></a>
              <a href="#" className="social-btn" aria-label="Twitter" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', transition: 'all 0.3s ease' }}><MessageCircle size={20} /></a>
              <a href="#" className="social-btn" aria-label="LinkedIn" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', transition: 'all 0.3s ease' }}><LinkIcon size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><RouterLink to="/" className="footer-link">Home</RouterLink></li>
              <li><a href="#features" className="footer-link">Features</a></li>
              <li><a href="#roles" className="footer-link">Roles</a></li>
              <li><RouterLink to="/login" className="footer-link">Login</RouterLink></li>
              <li><RouterLink to="/register" className="footer-link">Register</RouterLink></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Resources</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><a href="#" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Book size={16} /> Documentation</a></li>
              <li><a href="#" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} /> API Reference</a></li>
              <li><a href="https://github.com/Mayur51015/Mavi-Linking" target="_blank" rel="noreferrer" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><GitBranch size={16} /> Open Source</a></li>
            </ul>
          </div>

          {/* Community & Contact */}
          <div className="footer-section">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Community</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><a href="#" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={16} /> Discord Server</a></li>
              <li><a href="#" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} /> Contributing</a></li>
              <li><a href="mailto:contact@mavilinking.com" className="footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> Contact Us</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            &copy; {new Date().getFullYear()} MaVi Linking. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>Made with</span>
            <Heart size={16} color="var(--accent-pink)" style={{ fill: 'var(--accent-pink)' }} />
            <span>for the community</span>
          </div>
          
          <button 
            onClick={scrollToTop} 
            className="back-to-top-btn"
            aria-label="Back to top"
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-primary)', 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              transition: 'all 0.3s ease',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
