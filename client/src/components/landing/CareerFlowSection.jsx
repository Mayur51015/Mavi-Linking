import React from 'react';
import { ArrowRight, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import './LandingSections.css';

const CareerFlowSection = () => {
  const steps = [
    { num: '01', title: 'Profile', desc: 'Academic records & history' },
    { num: '02', title: 'Skills', desc: 'Projects & code metrics' },
    { num: '03', title: 'Verification', desc: 'Institutional audit check' },
    { num: '04', title: 'Opportunities', desc: 'Curated internships & jobs' },
    { num: '05', title: 'Career', desc: 'Verified placement success' },
  ];

  const securityPoints = [
    {
      title: 'Institutional Verification',
      desc: 'Accredited university domain authentication, faculty endorsements, and tamper-resistant academic records.',
      icon: ShieldCheck,
    },
    {
      title: 'Role-Based Access Control',
      desc: 'Granular permissions ensure students, department faculty, and recruiters access only authorized information.',
      icon: Lock,
    },
    {
      title: 'Student Privacy & Governance',
      desc: 'Strict FERPA-aligned data protection, zero unauthorized third-party sharing, and encrypted communications.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section
      id="flow"
      className="edx-section"
      aria-label="EduTalentX career flow and security architecture"
    >
      <div className="edx-section-container">
        {/* Career Flow Header */}
        <div className="edx-section-header">
          <div className="edx-section-eyebrow">
            HOW IT WORKS
          </div>
          <h2 className="edx-section-title">
            From skills to opportunity.
          </h2>
          <p className="edx-section-subtitle">
            A seamless journey from initial coursework to verified career outcomes.
          </p>
        </div>

        {/* Process Flow Track (Responsive Horizontal -> Grid -> Stack) */}
        <div className="edx-flow-track" role="list">
          {steps.map((step, idx) => (
            <React.Fragment key={step.title}>
              <div className="edx-flow-step" role="listitem">
                <span className="edx-flow-step-num">
                  {step.num}
                </span>
                <span className="edx-flow-step-title">
                  {step.title}
                </span>
                <span className="edx-flow-step-desc">
                  {step.desc}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div className="edx-flow-arrow" aria-hidden="true">
                  <ArrowRight size={16} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Dedicated Target Anchor for Security Navigation */}
        <div id="security" className="edx-security-container">
          <div className="edx-section-header" style={{ marginBottom: '1.5rem' }}>
            <div className="edx-section-eyebrow">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>SECURITY &amp; COMPLIANCE</span>
            </div>
            <h3 className="edx-section-title" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.85rem)' }}>
              Enterprise security and institutional trust.
            </h3>
            <p className="edx-section-subtitle">
              EduTalentX is built with institutional safeguards, ensuring student privacy and data integrity at every step.
            </p>
          </div>

          <div className="edx-security-grid">
            {securityPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="edx-security-card">
                  <div className="edx-security-icon-box">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <h4 className="edx-security-card-title">
                    {point.title}
                  </h4>
                  <p className="edx-security-card-desc">
                    {point.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CareerFlowSection;
