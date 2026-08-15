import React, { useState } from 'react';
import { Crown, ShieldCheck, Building2, Layers, Users, GraduationCap, Briefcase, ChevronRight } from 'lucide-react';

const RoleEcosystemSection = () => {
  const [selectedRole, setSelectedRole] = useState('institution_admin');

  const roleDetails = [
    {
      id: 'platform_owner',
      title: 'Platform Owner',
      icon: Crown,
      color: '#f59e0b',
      scope: 'Global SaaS Authority',
      desc: 'Manages SaaS pricing plans, platform metrics, tenant billing, and global system governance.',
    },
    {
      id: 'super_admin',
      title: 'Super Admin',
      icon: ShieldCheck,
      color: '#ec4899',
      scope: 'Multi-Tenant Governance',
      desc: 'Oversees institutional provisioning, subscription management, tenant audit logs, and global support.',
    },
    {
      id: 'institution_admin',
      title: 'Institution Admin',
      icon: Building2,
      color: '#8b5cf6',
      scope: 'College / University Scope',
      desc: 'Controls institution settings, department structures, faculty invitations, and billing checkouts.',
    },
    {
      id: 'department_admin',
      title: 'Department Admin / HOD',
      icon: Layers,
      color: '#3b82f6',
      scope: 'Department Scope',
      desc: 'Appoints faculty, manages student PRN approvals, monitors department readiness, and views analytics.',
    },
    {
      id: 'teachers',
      title: 'Teachers & Faculty',
      icon: GraduationCap,
      color: '#10b981',
      scope: 'Classroom & Student Scope',
      desc: 'Monitors assigned student progress, verifies portfolio documents, and reviews readiness leaderboards.',
    },
    {
      id: 'recruiters',
      title: 'Corporate Recruiters',
      icon: Briefcase,
      color: '#06b6d4',
      scope: 'Permitted Talent Scope',
      desc: 'Searches developer talent, bookmarks candidates, and manages recruitment placement pipelines.',
    },
    {
      id: 'students',
      title: 'Students',
      icon: Users,
      color: '#a855f7',
      scope: 'Personal Developer Scope',
      desc: 'Aggregates GitHub & LeetCode activity, builds dynamic portfolio, and receives AI growth recommendations.',
    },
  ];

  const active = roleDetails.find((r) => r.id === selectedRole) || roleDetails[2];
  const ActiveIcon = active.icon;

  return (
    <section id="roles" className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-purple" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          ENTERPRISE RBAC ARCHITECTURE
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          Everyone Has <span className="text-gradient">Their Own Place.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.65 }}>
          Powerful role-based access ensures every user sees the information, tools, and actions relevant to their responsibilities.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
        {/* Left: Role Navigation Hierarchy */}
        <div className="glass-card reveal" style={{ padding: '1.5rem', borderRadius: '24px', display: 'grid', gap: '0.6rem' }}>
          {roleDetails.map((r) => {
            const Icon = r.icon;
            const isSel = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                style={{
                  background: isSel ? `${r.color}20` : 'transparent',
                  border: `1px solid ${isSel ? r.color : 'transparent'}`,
                  borderRadius: '14px',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: isSel ? '#ffffff' : 'var(--text-secondary)',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={r.color} />
                  <span style={{ fontWeight: isSel ? '800' : '600', fontSize: '0.95rem' }}>{r.title}</span>
                </div>
                <ChevronRight size={16} color={isSel ? r.color : 'var(--text-muted)'} />
              </button>
            );
          })}
        </div>

        {/* Right: Active Role Scope Card */}
        <div
          className="glass-card reveal"
          style={{
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            border: `1px solid ${active.color}60`,
            boxShadow: `0 0 30px ${active.color}25`,
            background: `radial-gradient(ellipse at top left, ${active.color}15 0%, rgba(18, 18, 28, 0.9) 100%)`,
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: `${active.color}25`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: active.color,
              marginBottom: '1.5rem',
            }}
          >
            <ActiveIcon size={28} />
          </div>

          <div style={{ fontSize: '0.8rem', color: active.color, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.35rem' }}>
            {active.scope}
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ffffff', marginBottom: '1rem' }}>
            {active.title} Dashboard
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2rem' }}>
            {active.desc}
          </p>

          <div
            style={{
              background: 'rgba(10, 10, 15, 0.6)',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            ✓ Strict Tenant & Department Boundary Scoping Applied Automatically
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoleEcosystemSection;
