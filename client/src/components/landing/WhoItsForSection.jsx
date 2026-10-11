import React from 'react';
import { GraduationCap, Building2, Users } from 'lucide-react';
import './LandingSections.css';

const WhoItsForSection = () => {
  const roles = [
    {
      role: 'STUDENTS',
      description: 'Build your verified developer profile, track coding growth, and unlock curated opportunities.',
      icon: GraduationCap,
    },
    {
      role: 'INSTITUTIONS',
      description: 'Manage batch analytics, verify student achievements, and streamline campus placement pipelines.',
      icon: Building2,
    },
    {
      role: 'RECRUITERS',
      description: 'Discover high-signal technical talent with verified coding profiles and AI skill benchmarking.',
      icon: Users,
    },
  ];

  return (
    <section
      id="who-its-for"
      className="edx-section edx-section-alt"
      aria-label="Solutions for students, institutions, and recruiters"
    >
      <div className="edx-section-container">
        <div className="edx-section-header">
          <div className="edx-section-eyebrow">
            SOLUTIONS & ECOSYSTEM
          </div>
          <h2 className="edx-section-title">
            For students, institutions, and recruiters.
          </h2>
          <p className="edx-section-subtitle">
            EduTalentX bridges academia and industry with verified credibility and automated skill matching.
          </p>
        </div>

        <div className="edx-roles-grid">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.role}
                className="edx-role-card"
              >
                <div className="edx-role-top">
                  <span className="edx-role-badge">
                    {item.role}
                  </span>
                  <div className="edx-role-icon-box">
                    <Icon size={16} aria-hidden="true" />
                  </div>
                </div>

                <p className="edx-role-desc">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhoItsForSection;
