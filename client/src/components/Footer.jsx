import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import './landing/LandingSections.css';

const Footer = () => {
  return (
    <footer className="edx-footer" role="contentinfo">
      <div className="edx-section-container">
        <div className="edx-footer-main">
          {/* Brand Info */}
          <div>
            <BrandLogo variant="full" size={28} linkTo="/" />
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                margin: '0.65rem 0 0 0',
                letterSpacing: '0.01em',
              }}
            >
              Education, Skills, Intelligence &amp; Hiring
            </p>
          </div>

          {/* Links */}
          <nav className="edx-footer-links" aria-label="Footer links">
            <a
              href="#what-it-does"
              className="edx-footer-link"
            >
              Platform
            </a>
            <a
              href="#who-its-for"
              className="edx-footer-link"
            >
              Solutions
            </a>
            <a
              href="#security"
              className="edx-footer-link"
            >
              Security
            </a>
            <a
              href="mailto:contact@edutalentx.com"
              className="edx-footer-link"
            >
              Contact
            </a>
            <RouterLink
              to="/"
              className="edx-footer-link"
            >
              Privacy
            </RouterLink>
            <RouterLink
              to="/"
              className="edx-footer-link"
            >
              Terms
            </RouterLink>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>&copy; {new Date().getFullYear()} EduTalentX. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
