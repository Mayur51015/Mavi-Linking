import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import BrandLogo from '../BrandLogo';
import './LandingNavbar.css';

const LandingNavbar = () => {
  const { user, getDashboardPath } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact 3 navigation links and destinations required by specification
  const navItems = [
    { label: 'Platform', href: '/#what-it-does' },
    { label: 'Solutions', href: '/#who-its-for' },
    { label: 'Security', href: '/#security' },
  ];

  // Scroll detection for subtle border shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu and restore body scrolling
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Escape key handler to close mobile menu
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen, closeMobileMenu]);

  // Prevent background scroll while mobile menu is open, restore on close
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <header className={`edutalentx-navbar${scrolled ? ' scrolled' : ''}`} role="banner">
        <div className="edutalentx-navbar-container">
          {/* 1. Left: Brand Logo */}
          <div className="edutalentx-navbar-brand">
            <BrandLogo variant="full" size={28} linkTo="/" />
          </div>

          {/* 2. Center/Left-Center: Desktop Nav Links (Platform, Solutions, Security) */}
          <nav className="edutalentx-desktop-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="edutalentx-nav-link"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* 3. Right: Desktop Action Buttons */}
          <div className="edutalentx-desktop-actions">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="edutalentx-get-started-btn"
              >
                Dashboard <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="edutalentx-login-btn"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="edutalentx-get-started-btn"
                >
                  Get Started <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>

          {/* 4. Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="edutalentx-mobile-toggle"
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* 5. Mobile Backdrop (closes on click outside) */}
      {mobileMenuOpen && (
        <div
          className="edutalentx-mobile-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* 6. Accessible Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="edutalentx-mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="edutalentx-mobile-links-list">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={closeMobileMenu}
                className="edutalentx-mobile-link"
              >
                <span>{item.label}</span>
                <ArrowRight size={16} color="#9CA3AF" aria-hidden="true" />
              </a>
            ))}
          </div>

          <div className="edutalentx-mobile-actions">
            {user ? (
              <Link
                to={getDashboardPath()}
                onClick={closeMobileMenu}
                className="edutalentx-mobile-get-started-btn"
              >
                Dashboard <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="edutalentx-mobile-login-btn"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="edutalentx-mobile-get-started-btn"
                >
                  Get Started <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LandingNavbar;
