import React from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import WhatItDoesSection from '../components/landing/WhatItDoesSection';
import WhoItsForSection from '../components/landing/WhoItsForSection';
import CareerFlowSection from '../components/landing/CareerFlowSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import Footer from '../components/Footer';

/**
 * Home — EduTalentX Clean, Minimal, Professional Landing Page
 * Structure:
 * 1. Navbar
 * 2. Hero
 * 3. What EduTalentX Does
 * 4. Who It's For
 * 5. Simple Career Flow
 * 6. Final CTA
 * 7. Footer
 */
const Home = () => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        color: '#111111',
        minHeight: '100vh',
        overflowX: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* 1. Navbar */}
      <LandingNavbar />

      <main>
        {/* 2. Hero */}
        <HeroSection />

        {/* 3. What EduTalentX Does */}
        <WhatItDoesSection />

        {/* 4. Who It's For */}
        <WhoItsForSection />

        {/* 5. Simple Career Flow */}
        <CareerFlowSection />

        {/* 6. Final CTA */}
        <FinalCTASection />
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
};

export default Home;
