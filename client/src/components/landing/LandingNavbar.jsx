import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';
import BrandLogo from '../BrandLogo';

const LandingNavbar = ({ onOpenDemoModal }) => {
  const { user, getDashboardPath } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Platform', href: '#modules' },
    { label: 'AI', href: '#ai' },
    { label: 'Analytics', href: '#analytics' },
    { label: 'Solutions', href: '#linking' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
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
          <BrandLogo variant="full" size={34} linkTo="/" />

          {/* Desktop Nav Links */}
          <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
                {item.label}
              </a>
            ))}
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
                <Link to="/login" className="nav-link hide-mobile" style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none' }}>
                  Login
                </Link>
                <button onClick={onOpenDemoModal} className="btn btn-primary hide-mobile" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}>
                  Request Demo
                </button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="mobile-toggle-btn"
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-nav-panel${mobileMenuOpen ? ' open' : ''}`} role="navigation" aria-label="Mobile navigation">
        <div className="mobile-nav-header">
          <BrandLogo variant="full" size={28} linkTo="/" />
          <button type="button" onClick={closeMobileMenu} aria-label="Close navigation menu" className="mobile-nav-close">
            <X size={20} />
          </button>
        </div>

        <div className="mobile-nav-links">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={closeMobileMenu} className="mobile-nav-link">
              {item.label}
            </a>
          ))}

          {!user ? (
            <>
              <Link to="/login" onClick={closeMobileMenu} className="mobile-nav-link">Login</Link>
              <button type="button" onClick={() => { onOpenDemoModal(); closeMobileMenu(); }} className="btn btn-primary mobile-nav-cta">
                Request Demo
              </button>
            </>
          ) : (
            <Link to={getDashboardPath()} onClick={closeMobileMenu} className="btn btn-primary mobile-nav-cta">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default LandingNavbar;
