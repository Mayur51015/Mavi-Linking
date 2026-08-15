import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, PlayCircle } from 'lucide-react';

const FinalCTASection = ({ onOpenDemoModal }) => {
  return (
    <section className="container reveal" style={{ paddingTop: '4rem', paddingBottom: '6rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div
        className="gradient-border-card"
        style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
          borderRadius: '32px',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.18) 0%, rgba(18, 18, 28, 0.95) 75%)',
          border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.4))',
          boxShadow: 'var(--shadow-glow-strong)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1.1rem', borderRadius: '30px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '1.25rem' }}>
            <Sparkles size={16} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#c4b5fd' }}>
              THE FUTURE OF CONNECTED INSTITUTIONS
            </span>
          </div>

          <h2 className="title-xl" style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)', marginBottom: '0.5rem', fontWeight: '800' }}>
            Your Institution Is Already Connected.
          </h2>
          <h3 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.85rem)', fontWeight: '700', color: 'var(--text-accent)', marginBottom: '1.5rem' }}>
            The next step is making those connections intelligent.
          </h3>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto 2.5rem auto', lineHeight: 1.65 }}>
            Join forward-thinking colleges and educational institutions transforming operations, student development, and placement intelligence with MAVI Linking.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ minWidth: '220px', padding: '0.9rem 2rem', fontSize: '1rem' }}>
              Get Started <ArrowRight size={18} />
            </Link>
            <button onClick={onOpenDemoModal} className="btn btn-outline btn-lg" style={{ minWidth: '220px', padding: '0.9rem 2rem', fontSize: '1rem', borderColor: 'rgba(139, 92, 246, 0.4)' }}>
              Request an Institution Demo
            </button>
          </div>

          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            MAVI Linking — Connecting Institutions. Empowering People. Enabling Intelligence.
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
