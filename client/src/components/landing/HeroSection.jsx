import React from 'react';
import { Sparkles, ArrowRight, Shield, Globe, Award, Layers } from 'lucide-react';
import HeroNodeCanvas from './HeroNodeCanvas';

const HeroSection = ({ onOpenDemoModal }) => {
  return (
    <section className="container" style={{ paddingTop: '5.5rem', paddingBottom: '4rem', textAlign: 'center', position: 'relative' }}>
      {/* Eyebrow Badge */}
      <div className="reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1.1rem', borderRadius: '30px', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '1.25rem' }}>
        <Sparkles size={16} color="var(--accent-purple)" />
        <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#c4b5fd' }}>
          THE DIGITAL OPERATING PLATFORM FOR INSTITUTIONS
        </span>
      </div>

      {/* Main Brand & Headlines */}
      <h1 className="title-xl reveal" style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)', lineHeight: 1.12, marginBottom: '1rem', fontWeight: '800' }}>
        MAVI LINKING <br />
        <span className="text-gradient">Connect Your Entire Institution.</span>
      </h1>

      <h2 className="reveal" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.1rem)', fontWeight: '700', color: 'var(--text-accent)', marginBottom: '1.25rem' }}>
        Manage. Analyze. Grow.
      </h2>

      {/* Primary Brand Statement */}
      <div className="reveal" style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', letterSpacing: '0.3px', marginBottom: '1.25rem' }}>
        "Connecting Institutions. Empowering People. Enabling Intelligence."
      </div>

      {/* Comprehensive Product Description */}
      <p className="reveal" style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '740px', margin: '0 auto 2.25rem auto', lineHeight: 1.65 }}>
        MAVI Linking is an AI-powered institutional platform that connects students, teachers, departments, recruiters, and administrators through one secure, intelligent ecosystem.
      </p>

      {/* CTAs */}
      <div className="reveal" style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <a href="#modules" className="btn btn-primary btn-lg" style={{ minWidth: '220px', padding: '0.9rem 2rem', fontSize: '1rem' }}>
          Explore MAVI Linking <ArrowRight size={18} />
        </a>
        <button onClick={onOpenDemoModal} className="btn btn-outline btn-lg" style={{ minWidth: '220px', padding: '0.9rem 2rem', fontSize: '1rem', borderColor: 'rgba(139, 92, 246, 0.4)' }}>
          Request an Institution Demo
        </button>
      </div>

      <div className="reveal" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Built for modern colleges and educational institutions.
      </div>

      {/* Connected Ecosystem Visual Diagram */}
      <div className="reveal">
        <HeroNodeCanvas />
      </div>
    </section>
  );
};

export default HeroSection;
