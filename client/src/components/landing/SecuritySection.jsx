import React from 'react';
import { ShieldCheck, Lock, KeyRound, EyeOff, Server, FileCode, CheckCircle, ShieldAlert } from 'lucide-react';

const SecuritySection = () => {
  const securityItems = [
    { title: 'Multi-Tenant Architecture', desc: 'Strict database and logical isolation between colleges & institutions.' },
    { title: 'Role-Based Access Control', desc: 'Granular permissions for Owners, Admins, HODs, Teachers, and Recruiters.' },
    { title: 'Institution Data Isolation', desc: 'College data is private and inaccessible across tenant boundaries.' },
    { title: 'Department-Level Scoping', desc: 'Faculty members only access data belonging to their assigned department.' },
    { title: 'Secure JWT Authentication', desc: 'HttpOnly refresh tokens and signed short-lived JWT access tokens.' },
    { title: 'Self-Service Email Verification', desc: '2-step password-verified OTP challenge for registered email updates.' },
    { title: 'Comprehensive Audit Logs', desc: 'Full event tracking for profile edits, role upgrades, and billing events.' },
    { title: 'Server-Side Authorization', desc: 'All business logic and permissions enforced strictly on backend APIs.' },
    { title: 'Production Razorpay Checkout', desc: 'PCI-compliant HMAC SHA-256 signature verification & idempotent webhooks.' },
  ];

  return (
    <section id="security" className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-emerald" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          ENTERPRISE SECURITY & PRIVACY
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          Built for <span className="text-gradient">Institutional Trust.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.65 }}>
          Security, access control, and tenant isolation are built into the foundation of MAVI Linking.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
        {securityItems.map((item, idx) => (
          <div
            key={idx}
            className="glass-card reveal"
            style={{
              padding: '1.75rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={20} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>{item.title}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div
        className="glass-card-static reveal"
        style={{
          padding: '1.5rem 2rem',
          borderRadius: '20px',
          textAlign: 'center',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, rgba(18, 18, 28, 0.8) 100%)',
          maxWidth: '540px',
          margin: '0 auto',
        }}
      >
        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Lock size={22} color="#34d399" />
          <span>Your institution's data stays yours.</span>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
