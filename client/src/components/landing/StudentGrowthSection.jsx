import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const StudentGrowthSection = () => {
  return (
    <section className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-emerald" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          STUDENT DEVELOPMENT ENGINE
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          Help Every Student <span className="text-gradient">Understand Their Growth.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.65 }}>
          Give students a clearer picture of where they are, where they need to improve, and how they can become more career-ready.
        </p>
      </div>

      <div className="glass-card reveal" style={{ padding: '3rem 2.25rem', borderRadius: '28px', border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.4))' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          {/* Left: Interactive Growth Indicator Preview */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '20px', padding: '2rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>STUDENT GROWTH SCORE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>Developer Readiness</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.5rem 1rem', borderRadius: '30px', fontWeight: '800', fontSize: '1.1rem' }}>
                88.4 / 100
              </div>
            </div>

            {/* Sub-Metrics Progress Bars */}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  <span>Development & Code Quality</span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>92%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  <span>Problem Solving (LeetCode)</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>84%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '84%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  <span>Project & Architecture Impact</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>89%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '89%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature Narrative */}
          <div>
            <div className="badge badge-purple" style={{ marginBottom: '1rem' }}>
              PERSONAL ACTIONABLE FEEDBACK
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.3 }}>
              Continuous Feedback Loop for Student Career Growth
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              Instead of relying solely on exam scores, MAVI Linking analyzes real developer contributions, hackathon achievements, and project code quality to create an objective developer profile.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                <CheckCircle2 size={18} color="var(--accent-purple)" />
                <span>Centralized profile aggregating GitHub, LeetCode, and institutional PRN.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                <CheckCircle2 size={18} color="var(--accent-purple)" />
                <span>AI-driven skill gap recommendations tailored to target corporate roles.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                <CheckCircle2 size={18} color="var(--accent-purple)" />
                <span>Public verified identity page with dynamic QR code for instant recruiter sharing.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentGrowthSection;
