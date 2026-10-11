import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './LandingSections.css';

const FinalCTASection = () => {
  return (
    <section
      id="cta"
      className="edx-section"
      style={{ padding: '5rem 0 6rem 0' }}
      aria-label="Call to action"
    >
      <div className="edx-section-container">
        <div className="edx-cta-card">
          <h2
            className="edx-section-title"
            style={{ marginBottom: '0.85rem' }}
          >
            Ready to get started?
          </h2>

          <p
            className="edx-section-subtitle"
            style={{ margin: '0 auto 2rem auto', textAlign: 'center' }}
          >
            Create your EduTalentX profile and unlock verified skills, intelligence, and opportunities.
          </p>

          <div className="edx-cta-actions">
            <Link
              to="/register"
              className="edx-cta-primary-btn"
            >
              Get Started <ArrowRight size={15} aria-hidden="true" />
            </Link>

            <Link
              to="/login"
              className="edx-cta-secondary-btn"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
