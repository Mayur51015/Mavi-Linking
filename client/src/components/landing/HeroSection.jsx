import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import HeroNodeCanvas from './HeroNodeCanvas';

const HeroSection = ({ onOpenDemoModal }) => {
  return (
    <section className="container" style={{ paddingTop: '6rem', paddingBottom: '3.5rem', textAlign: 'center', position: 'relative' }}>
      {/* Eyebrow Badge */}
      <div className="reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.95rem', borderRadius: 'var(--radius-full)', background: '#172554', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '1.25rem' }}>
        <Sparkles size={14} style={{ color: '#3B82F6' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60A5FA' }}>
          DEVELOPER & CAREER INTELLIGENCE PLATFORM
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="title-xl reveal" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', lineHeight: 1.15, marginBottom: '1rem', fontWeight: 800 }}>
        Developer Intelligence <br />
        <span className="text-gradient">for the Next Career</span>
      </h1>

      {/* Primary Brand Statement */}
      <p className="reveal" style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '680px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
        MAVI Linking connects student developer portfolios, higher-education institutions, and industry recruiters through verified skills, evidence-based career matching, and collaboration pipelines.
      </p>

      {/* CTAs */}
      <div className="reveal" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <Link to="/register" className="btn btn-primary btn-lg" style={{ minWidth: '180px' }}>
          Get Started <ArrowRight size={16} />
        </Link>
        <a href="#modules" className="btn btn-outline btn-lg" style={{ minWidth: '180px' }}>
          Explore Platform
        </a>
        <button onClick={onOpenDemoModal} className="btn btn-secondary btn-lg" style={{ minWidth: '180px' }}>
          Request Institution Demo
        </button>
      </div>

      <div className="reveal" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Built for students, academic departments, and talent acquisition teams.
      </div>

      {/* Connected Ecosystem Visual Diagram */}
      <div className="reveal">
        <HeroNodeCanvas />
      </div>
    </section>
  );
};

export default HeroSection;
