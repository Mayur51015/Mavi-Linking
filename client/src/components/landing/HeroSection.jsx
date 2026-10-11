import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Code2, GitBranch, Briefcase } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section
      className="edutalentx-hero-section"
      role="region"
      aria-label="EduTalentX Hero - AI-powered skills and developer opportunities"
    >
      <div className="edutalentx-hero-container">
        <div className="edutalentx-hero-content">
          {/* Eyebrow Badge */}
          <div className="edutalentx-hero-eyebrow">
            EDUCATION • SKILLS • CAREER
          </div>

          {/* Main Headline */}
          <h1 className="edutalentx-hero-headline">
            Build skills.
            <br />
            Find opportunities.
          </h1>

          {/* Supporting Description */}
          <p className="edutalentx-hero-description">
            EduTalentX connects students, institutions, faculty, and recruiters in one platform.
          </p>

          {/* Platform Capability Badges communicating the 4 core pillars */}
          <div className="edutalentx-hero-pillars" aria-label="Platform Highlights">
            <span className="edutalentx-hero-pill">
              <Sparkles size={13} aria-hidden="true" /> AI Skill Mapping
            </span>
            <span className="edutalentx-hero-pill">
              <Code2 size={13} aria-hidden="true" /> Developer Profiles
            </span>
            <span className="edutalentx-hero-pill">
              <GitBranch size={13} aria-hidden="true" /> GitHub • LeetCode • Codeforces • Stack Overflow
            </span>
            <span className="edutalentx-hero-pill">
              <Briefcase size={13} aria-hidden="true" /> Skill-Matched Opportunities
            </span>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="edutalentx-hero-actions">
            <Link
              to="/register"
              className="edutalentx-hero-btn-primary"
            >
              Get Started
            </Link>

            <a
              href="#what-it-does"
              className="edutalentx-hero-btn-secondary"
            >
              Explore Platform
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
