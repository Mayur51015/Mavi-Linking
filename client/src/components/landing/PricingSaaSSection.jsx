import React, { useEffect, useState } from 'react';
import { Check, Sparkles, Building2, Shield, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

const PricingSaaSSection = ({ onOpenDemoModal }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/billing/plans');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setPlans(res.data.data);
        }
      } catch (err) {
        console.warn('Public billing plans API fallback:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const defaultPlans = [
    {
      code: 'BASIC',
      name: 'Basic Institution',
      priceINR: 49999,
      maxStudents: 1000,
      badge: 'Starter Tier',
      features: ['Up to 1,000 Students', '5 Department Admins', 'Core ERP & Student Profiles', 'Standard MAVI AI Analytics', 'Email & Document Support'],
      color: '#3b82f6',
    },
    {
      code: 'PRO',
      name: 'Pro Institution',
      priceINR: 149999,
      maxStudents: 5000,
      badge: 'Most Popular',
      isPopular: true,
      features: ['Up to 5,000 Students', 'Unlimited Department Admins', 'Full MAVI AI & Placement Engine', 'Recruiter Talent Discovery', 'Priority Support & Custom Branding'],
      color: '#8b5cf6',
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise University',
      priceINR: 399999,
      maxStudents: 25000,
      badge: 'Unlimited Scale',
      features: ['Up to 25,000 Students', 'Multi-College University Hub', 'Custom AI Model Fine-tuning', 'Dedicated Customer Success Manager', '24/7 SLA & On-Premises Isolation Options'],
      color: '#10b981',
    },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <section id="pricing" className="container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-purple" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          CENTRALIZED SAAS BILLING
        </span>
        <h2 className="title-xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', marginBottom: '1rem' }}>
          Simple, Scalable <span className="text-gradient">Institutional Billing.</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.65 }}>
          Institutions can subscribe to plans designed around their size and requirements.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
        {displayPlans.map((plan, idx) => {
          const isPop = plan.isPopular || plan.code === 'PRO';
          const planColor = plan.color || (plan.code === 'BASIC' ? '#3b82f6' : plan.code === 'PRO' ? '#8b5cf6' : '#10b981');
          return (
            <div
              key={plan.code || idx}
              className="glass-card reveal"
              style={{
                padding: '2.5rem 2rem',
                borderRadius: '24px',
                border: isPop ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                boxShadow: isPop ? 'var(--shadow-glow-strong)' : 'none',
                background: isPop
                  ? 'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15) 0%, rgba(18, 18, 28, 0.9) 100%)'
                  : 'rgba(26, 26, 40, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {isPop && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--gradient-primary)',
                    color: '#ffffff',
                    padding: '0.3rem 1.25rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.5)',
                  }}
                >
                  MOST POPULAR FOR COLLEGES
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <span className="badge" style={{ background: `${planColor}20`, color: planColor, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  {plan.badge || plan.code}
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ffffff', margin: '0.35rem 0' }}>
                  {plan.name}
                </h3>
                <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#ffffff', marginTop: '0.75rem' }}>
                  ₹{(plan.priceINR || plan.price || 0).toLocaleString('en-IN')}{' '}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ year</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'grid', gap: '0.85rem', flexGrow: 1 }}>
                {(plan.features || []).map((feat, featIdx) => (
                  <li key={featIdx} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Check size={16} color={planColor} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onOpenDemoModal}
                className={isPop ? 'btn btn-primary btn-lg' : 'btn btn-outline btn-lg'}
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
              >
                Request Institution Plan <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PricingSaaSSection;
