import React from 'react';
import { Briefcase, Search, CheckCircle, Award, ArrowRight, UserCheck, Filter, ChevronRight } from 'lucide-react';

const PlacementSection = () => {
  const steps = [
    { title: 'Student Profile', desc: 'Verified identity & coding activity' },
    { title: 'Skills & Projects', desc: 'GitHub, LeetCode & portfolio' },
    { title: 'AI Analysis', desc: 'Readiness & skill scoring' },
    { title: 'Recruiter Discovery', desc: 'Scoped candidate search' },
    { title: 'Opportunity', desc: 'Shortlisting & campus placement' },
  ];

  return (
    <section id="placement" className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          PLACEMENT INTELLIGENCE ECOSYSTEM
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          From Skills to <span className="text-gradient">Opportunities.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '660px', margin: '0 auto', lineHeight: 1.65 }}>
          Help recruiters discover relevant talent while giving students clearer paths toward career readiness.
        </p>
      </div>

      {/* Visual Pipeline Step-by-Step */}
      <div
        className="glass-card reveal"
        style={{
          padding: '2.5rem 1.5rem',
          borderRadius: '24px',
          border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.4))',
          marginBottom: '3rem',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {steps.map((s, idx) => (
            <React.Fragment key={idx}>
              <div
                style={{
                  background: 'rgba(26, 26, 40, 0.7)',
                  borderRadius: '16px',
                  padding: '1.25rem 1rem',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--accent-purple)', marginBottom: '0.25rem' }}>
                  STEP 0{idx + 1}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.25rem' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {s.desc}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
        <div className="glass-card reveal" style={{ padding: '2rem 1.75rem', borderRadius: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '1.25rem' }}>
            <Search size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.5rem' }}>
            Recruiter Talent Discovery
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Corporate recruiters search verified student profiles scoped precisely to their authorized colleges and departments.
          </p>
        </div>

        <div className="glass-card reveal" style={{ padding: '2rem 1.75rem', borderRadius: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '1.25rem' }}>
            <Filter size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.5rem' }}>
            Skill Matching & Verification
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Match job requirements against real GitHub code commits, LeetCode scores, and verified institutional PRN credentials.
          </p>
        </div>

        <div className="glass-card reveal" style={{ padding: '2rem 1.75rem', borderRadius: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '1.25rem' }}>
            <Briefcase size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.5rem' }}>
            Placement Pipeline Tracking
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Track candidates through hiring stages: Shortlisted, Under Review, Interview Scheduled, Offer Received, and Hired.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PlacementSection;
