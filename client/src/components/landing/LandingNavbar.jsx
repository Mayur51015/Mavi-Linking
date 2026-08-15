import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';

const LandingNavbar = ({ onOpenDemoModal }) => {
  const { user, getDashboardPath } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className="navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease',
        background: scrolled ? 'var(--bg-glass)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent',
        padding: '0.9rem 0',
      }}
    >
      <div className="container nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
            MAVI <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>LINKING</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <a href="#modules" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
            Platform
          </a>
          <a href="#ai" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
            AI
          </a>
          <a href="#analytics" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
            Analytics
          </a>
          <a href="#linking" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
            Solutions
          </a>
          <a href="#security" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
            Security
          </a>
          <a href="#pricing" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
            Pricing
          </a>
        </div>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          {user ? (
            <Link to={getDashboardPath()} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}>
              Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-link" style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none' }}>
                Login
              </Link>
              <button onClick={onOpenDemoModal} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}>
                Request Demo
              </button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'none' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
