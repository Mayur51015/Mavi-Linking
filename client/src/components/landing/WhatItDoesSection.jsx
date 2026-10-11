import React from 'react';
import { User, Code2, Briefcase, TrendingUp } from 'lucide-react';
import './LandingSections.css';

const WhatItDoesSection = () => {
  const items = [
    {
      title: 'Profile',
      description: 'Build a complete academic and professional profile.',
      icon: User,
    },
    {
      title: 'Skills',
      description: 'Show projects, certificates, coding and experience.',
      icon: Code2,
    },
    {
      title: 'Opportunities',
      description: 'Find internships, jobs and placement opportunities.',
      icon: Briefcase,
    },
    {
      title: 'Growth',
      description: 'Track your progress and improve your career readiness.',
      icon: TrendingUp,
    },
  ];

  return (
    <section
      id="what-it-does"
      className="edx-section"
      aria-label="What EduTalentX does"
    >
      <div className="edx-section-container">
        <div className="edx-section-header">
          <div className="edx-section-eyebrow">
            PLATFORM CAPABILITIES
          </div>
          <h2 className="edx-section-title">
            Everything in one place.
          </h2>
          <p className="edx-section-subtitle">
            One unified platform that transforms student skills, coursework, and coding contributions into real career pathways.
          </p>
        </div>

        <div className="edx-features-grid">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="edx-feature-card"
              >
                <div className="edx-feature-icon-box">
                  <Icon size={18} aria-hidden="true" />
                </div>

                <h3 className="edx-feature-title">
                  {item.title}
                </h3>

                <p className="edx-feature-desc">
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

export default WhatItDoesSection;
