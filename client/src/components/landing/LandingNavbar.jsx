import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import BrandLogo from '../BrandLogo';

const LandingNavbar = () => {
  const { user, getDashboardPath } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Platform', href: '#what-it-does' },
    { label: 'Solutions', href: '#who-its-for' },
    { label: 'Security', href: '#security' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
          transition: 'box-shadow 0.2s ease',
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: scrolled ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
          padding: '0.85rem 0',
        }}
      >
        <div
          className="container nav-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '0 1.5rem',
          }}
        >
          {/* Brand Logo */}
          <BrandLogo variant="full" size={30} linkTo="/" />

          {/* Desktop Nav Links */}
          <div
            className="nav-links-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="nav-link"
                style={{
                  color: '#4B5563',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <Link
                to={getDashboardPath()}
                className="btn btn-primary"
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-link hide-mobile"
                  style={{
                    color: '#111111',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    padding: '0.4rem 0.75rem',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#111111')}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary hide-mobile"
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="mobile-toggle-btn"
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                color: '#111111',
                padding: '0.4rem',
                cursor: 'pointer',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Accessible Mobile Navigation Panel */}
      <div
        className={`mobile-nav-panel${mobileMenuOpen ? ' open' : ''}`}
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
        }}
      >
        <div className="mobile-nav-header">
          <BrandLogo variant="full" size={26} linkTo="/" />
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
            className="mobile-nav-close"
            style={{ color: '#111111' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mobile-nav-links">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={closeMobileMenu}
              className="mobile-nav-link"
              style={{ color: '#111111' }}
            >
              {item.label}
            </a>
          ))}

          {!user ? (
            <>
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="mobile-nav-link"
                style={{ color: '#111111' }}
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="btn btn-primary mobile-nav-cta"
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  padding: '0.65rem 1rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  marginTop: '0.5rem',
                }}
              >
                Get Started
              </Link>
            </>
          ) : (
            <Link
              to={getDashboardPath()}
              onClick={closeMobileMenu}
              className="btn btn-primary mobile-nav-cta"
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                textAlign: 'center',
                padding: '0.65rem 1rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                marginTop: '0.5rem',
              }}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default LandingNavbar;
