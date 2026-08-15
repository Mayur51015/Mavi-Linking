import React from 'react';
import { TrendingUp, Users, Target, Award, LineChart, Info } from 'lucide-react';

const AnalyticsPreviewSection = () => {
  const metrics = [
    { label: 'Student Developer Growth', val: '+24.8%', icon: TrendingUp, color: '#8b5cf6', sub: 'Year-over-year skill velocity' },
    { label: 'Avg Placement Readiness', val: '82%', icon: Target, color: '#10b981', sub: 'Based on verified code quality' },
    { label: 'Active Student Developers', val: '1,284', icon: Users, color: '#3b82f6', sub: 'Linked GitHub & LeetCode accounts' },
    { label: 'Campus Placement Rate', val: '76.4%', icon: Award, color: '#f59e0b', sub: 'Verified hiring outcomes' },
  ];

  return (
    <section id="analytics" className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-cyan" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          EXECUTIVE INSTITUTIONAL ANALYTICS
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          See Your Institution <span className="text-gradient">Like Never Before.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.65 }}>
          Transform institutional activity into measurable insights that help administrators make better decisions.
        </p>
      </div>

      {/* Demo Analytics Dashboard Widget Preview */}
      <div
        className="glass-card reveal"
        style={{
          padding: '2.5rem 2rem',
          borderRadius: '28px',
          border: '1px solid var(--border-glow, rgba(139, 92, 246, 0.4))',
          boxShadow: 'var(--shadow-glow-strong)',
          background: 'radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.12) 0%, rgba(18, 18, 28, 0.9) 100%)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(26, 26, 40, 0.7)',
                  borderRadius: '18px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{m.label}</span>
                  <Icon size={18} color={m.color} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff', marginBottom: '0.25rem' }}>
                  {m.val}
                </div>
                <div style={{ fontSize: '0.75rem', color: m.color, fontWeight: '600' }}>
                  {m.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* Department Trend Overview */}
        <div style={{ background: 'rgba(10, 10, 15, 0.6)', borderRadius: '18px', padding: '1.5rem 2rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LineChart size={16} color="var(--accent-purple)" />
            DEPARTMENT READINESS & GROWTH TRENDS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <span style={{ fontWeight: '700', color: '#ffffff' }}>Computer Science (CSE)</span>
              <span style={{ color: '#34d399', fontWeight: '800' }}>↑ 89% Readiness</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <span style={{ fontWeight: '700', color: '#ffffff' }}>Information Tech (IT)</span>
              <span style={{ color: '#34d399', fontWeight: '800' }}>↑ 85% Readiness</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <span style={{ fontWeight: '700', color: '#ffffff' }}>Mechanical Engineering</span>
              <span style={{ color: '#f59e0b', fontWeight: '800' }}>→ 72% Readiness</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
        <Info size={14} />
        <span>Demonstration values representing platform analytical capabilities.</span>
      </div>
    </section>
  );
};

export default AnalyticsPreviewSection;
