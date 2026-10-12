import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BarChart2, GitPullRequest, Briefcase, ArrowRight } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section
      className="edutalentx-hero-section"
      role="region"
      aria-label="EduTalentX Hero - AI-powered skills and opportunities platform"
    >
      <div className="edutalentx-hero-container">
        {/* 1. Hero Eyebrow */}
        <div className="edutalentx-hero-eyebrow">
          EDUCATION • SKILLS • CAREER
        </div>

        {/* 2. Main Headline */}
        <h1 className="edutalentx-hero-headline">
          Build skills.
          <br />
          <span className="hero-headline-accent">Find opportunities.</span>
        </h1>

        {/* 3. Description */}
        <p className="edutalentx-hero-description">
          EduTalentX connects students, institutions, faculty, and recruiters through AI-powered skill mapping and real developer insights.
        </p>

        {/* 4. Feature Badges */}
        <div className="edutalentx-hero-pillars" aria-label="Core platform capabilities">
          <div className="edutalentx-hero-pillars-row">
            <span className="edutalentx-hero-pill">
              <Sparkles size={14} className="pill-icon" aria-hidden="true" />
              <span>AI Skill Mapping</span>
            </span>
            <span className="edutalentx-hero-pill">
              <BarChart2 size={14} className="pill-icon" aria-hidden="true" />
              <span>Developer Profiles</span>
            </span>
          </div>
          <div className="edutalentx-hero-pill full-width">
            <GitPullRequest size={14} className="pill-icon" aria-hidden="true" />
            <span>GitHub • LeetCode • Codeforces • Stack Overflow</span>
          </div>
          <div className="edutalentx-hero-pill full-width">
            <Briefcase size={14} className="pill-icon" aria-hidden="true" />
            <span>Skill-Matched Opportunities</span>
          </div>
        </div>

        {/* 5. Primary and Secondary CTA Buttons in one horizontal row */}
        <div className="edutalentx-hero-actions">
          <Link
            to="/register"
            className="edutalentx-hero-btn-primary"
          >
            Get Started <ArrowRight size={16} aria-hidden="true" />
          </Link>

          <a
            href="#what-it-does"
            className="edutalentx-hero-btn-secondary"
          >
            Explore Platform
          </a>
        </div>

        {/* 6. Hero image immediately below both CTA buttons */}
        <div className="edutalentx-hero-image-wrapper">
          <img
            src="/images/edutalentx-hero-workspace.png"
            alt="EduTalentX dashboard connecting developer skills, coding profiles, and career opportunities"
            className="edutalentx-hero-image"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
