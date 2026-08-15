import React from 'react';
import { Fingerprint, Building2, Cpu, LineChart, Briefcase, ShieldCheck, MessageSquare, CreditCard } from 'lucide-react';

const PlatformModulesSection = () => {
  const modules = [
    {
      id: 'mavi-id',
      title: 'MAVI ID',
      tagline: 'Identity & Authentication',
      description: 'A unified identity layer for every member of the institution.',
      icon: Fingerprint,
      color: '#8b5cf6',
      isPrimary: true,
      badge: 'Core Identity',
    },
    {
      id: 'mavi-erp',
      title: 'MAVI ERP',
      tagline: 'Institutional Governance',
      description: 'Manage students, teachers, departments, recruiters, and institutional operations.',
      icon: Building2,
      color: '#3b82f6',
      isPrimary: true,
      badge: 'Core Operations',
    },
    {
      id: 'mavi-ai',
      title: 'MAVI AI',
      tagline: 'Intelligence Engine',
      description: 'Turn institutional and development data into intelligent insights.',
      icon: Cpu,
      color: '#ec4899',
      isPrimary: true,
      badge: 'AI Engine',
    },
    {
      id: 'mavi-insights',
      title: 'MAVI Insights',
      tagline: 'Analytics & Reporting',
      description: 'Understand student growth, department performance, placement, and institutional trends.',
      icon: LineChart,
      color: '#06b6d4',
      isPrimary: false,
      badge: 'Analytics',
    },
    {
      id: 'mavi-talent',
      title: 'MAVI Talent',
      tagline: 'Placement Intelligence',
      description: 'Connect student capabilities with recruiters and placement opportunities.',
      icon: Briefcase,
      color: '#10b981',
      isPrimary: false,
      badge: 'Placements',
    },
    {
      id: 'mavi-verify',
      title: 'MAVI Verify',
      tagline: 'Trust & Compliance',
      description: 'Streamline student, teacher, recruiter, and institutional verification.',
      icon: ShieldCheck,
      color: '#f59e0b',
      isPrimary: false,
      badge: 'Verification',
    },
    {
      id: 'mavi-connect',
      title: 'MAVI Connect',
      tagline: 'Stakeholder Communication',
      description: 'Keep students, faculty, departments, and recruiters connected.',
      icon: MessageSquare,
      color: '#a855f7',
      isPrimary: false,
      badge: 'Communication',
    },
    {
      id: 'mavi-billing',
      title: 'MAVI Billing',
      tagline: 'Subscription & Invoicing',
      description: 'Manage subscriptions, pricing, payments, invoices, and renewals.',
      icon: CreditCard,
      color: '#6366f1',
      isPrimary: false,
      badge: 'SaaS Billing',
    },
  ];

  return (
    <section id="modules" className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-cyan" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          MODULAR SAAS ARCHITECTURE
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          Everything Your <span className="text-gradient">Institution Needs.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto' }}>
          Modular, interconnected software components built specifically for modern institutional administration.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
        {modules.map((mod) => {
          const IconComp = mod.icon;
          return (
            <div
              key={mod.id}
              className="glass-card reveal"
              style={{
                padding: '2.25rem 1.75rem',
                borderRadius: '22px',
                border: mod.isPrimary
                  ? `1px solid ${mod.color}60`
                  : '1px solid var(--border-color)',
                boxShadow: mod.isPrimary ? `0 0 25px ${mod.color}20` : 'none',
                background: mod.isPrimary
                  ? `radial-gradient(ellipse at top left, ${mod.color}15 0%, var(--bg-card) 100%)`
                  : 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '16px',
                    background: `${mod.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: mod.color,
                  }}
                >
                  <IconComp size={24} />
                </div>
                <span className="badge" style={{ background: `${mod.color}15`, color: mod.color, fontSize: '0.72rem', border: `1px solid ${mod.color}30` }}>
                  {mod.badge}
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {mod.title}
              </h3>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '600' }}>
                {mod.tagline}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginTop: 'auto' }}>
                {mod.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlatformModulesSection;
