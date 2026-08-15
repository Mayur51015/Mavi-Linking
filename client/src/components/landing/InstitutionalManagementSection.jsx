import React from 'react';
import { Building2, Users, GraduationCap, Briefcase, ShieldCheck, FileCheck, FileText, CheckCircle2 } from 'lucide-react';

const InstitutionalManagementSection = () => {
  const operations = [
    { title: 'Student Management', icon: Users, desc: 'Centralized profiles, PRN verification, and learning progress.' },
    { title: 'Faculty & Teacher Portal', icon: GraduationCap, desc: 'Department scoping, classroom monitoring, and student readiness.' },
    { title: 'Department Scoping', icon: Building2, desc: 'Structured HOD administration and department-level analytics.' },
    { title: 'Recruiter Governance', icon: Briefcase, desc: 'Authorized company access, job posting, and candidate pipelines.' },
    { title: 'Approval Workflows', icon: FileCheck, desc: 'PRN validation, faculty appointments, and document verification.' },
    { title: 'Automated Reporting', icon: FileText, desc: 'Exportable PDF and CSV placement, academic, and audit reports.' },
  ];

  return (
    <section className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-purple" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          TOTAL INSTITUTIONAL GOVERNANCE
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          Run Your Institution <span className="text-gradient">From One Connected Platform.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.65 }}>
          Bring institutional operations into one secure, structured environment while maintaining clear role and department boundaries.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
        {operations.map((op, idx) => {
          const Icon = op.icon;
          return (
            <div
              key={idx}
              className="glass-card reveal"
              style={{
                padding: '2rem 1.75rem',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.25rem',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                  flexShrink: 0,
                }}
              >
                <Icon size={22} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.35rem' }}>
                  {op.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  {op.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default InstitutionalManagementSection;
