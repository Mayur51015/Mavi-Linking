import React from 'react';
import { Cpu, Code2, TrendingUp, AlertTriangle, Target, Lightbulb, LineChart } from 'lucide-react';

const AIIntelligenceSection = () => {
  const aiFeatures = [
    {
      title: 'AI Developer Growth Analytics',
      description: 'Tracks skill progression and code velocity over time using multi-platform activity aggregation.',
      icon: TrendingUp,
      color: '#8b5cf6',
    },
    {
      title: 'Skill Gap Detection',
      description: 'Identifies missing technical requirements between student profiles and recruiter target skills.',
      icon: AlertTriangle,
      color: '#f59e0b',
    },
    {
      title: 'Problem Solving Analysis',
      description: 'Evaluates algorithmic efficiency, contest performance, and rating trajectories across LeetCode & Codeforces.',
      icon: Code2,
      color: '#06b6d4',
    },
    {
      title: 'Placement Readiness Score',
      description: 'Generates an objective 0–100 placement readiness score based on verified projects, code quality, and skills.',
      icon: Target,
      color: '#10b981',
    },
    {
      title: 'Personalized Recommendations',
      description: 'Provides actionable career advice, recommended learning paths, and project improvements for students.',
      icon: Lightbulb,
      color: '#ec4899',
    },
    {
      title: 'Department Intelligence',
      description: 'Aggregates department-level performance metrics for HODs and faculty to benchmark institutional outcomes.',
      icon: LineChart,
      color: '#3b82f6',
    },
  ];

  return (
    <section id="ai" className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-purple" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          PROPRIETARY INSTITUTIONAL AI
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          Turn Activity Into <span className="text-gradient">Intelligence.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.65 }}>
          MAVI Linking doesn't just collect institutional data. It turns activity into meaningful intelligence.
        </p>
      </div>

      {/* Visual Pipeline Banner */}
      <div
        className="glass-card reveal"
        style={{
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.4))',
          boxShadow: 'var(--shadow-glow-strong)',
          background: 'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.1) 0%, var(--bg-card) 100%)',
          marginBottom: '3.5rem',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          {/* Inputs */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-purple)', marginBottom: '0.75rem' }}>
              DATA INPUTS
            </div>
            <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>• GitHub Commits & Repos</div>
              <div>• LeetCode & Contest Rating</div>
              <div>• Projects & Architecture</div>
              <div>• Verified Skills & PRN</div>
              <div>• Academic Performance</div>
            </div>
          </div>

          {/* Central AI Engine */}
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto',
                boxShadow: '0 0 30px rgba(236, 72, 153, 0.5)',
                color: '#ffffff',
              }}
            >
              <Cpu size={32} />
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)' }}>MAVI AI ENGINE</div>
            <div style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: '700' }}>Deep Contextual Synthesis</div>
          </div>

          {/* Outputs */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
              INTELLIGENT OUTPUTS
            </div>
            <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div>✓ Development & Skill Score</div>
              <div>✓ Problem Solving Index</div>
              <div>✓ Skill Gap Identification</div>
              <div>✓ Placement Readiness Index</div>
              <div>✓ Personal Action Plans</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
        {aiFeatures.map((feat, idx) => {
          const IconComponent = feat.icon;
          return (
            <div
              key={idx}
              className="glass-card reveal"
              style={{
                padding: '2rem 1.75rem',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: `${feat.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: feat.color,
                  marginBottom: '1.25rem',
                }}
              >
                <IconComponent size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {feat.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginTop: 'auto' }}>
                {feat.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AIIntelligenceSection;
