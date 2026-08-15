import React, { useEffect, useRef, useState } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import SolutionSection from '../components/landing/SolutionSection';
import LinkingPillarsSection from '../components/landing/LinkingPillarsSection';
import PlatformModulesSection from '../components/landing/PlatformModulesSection';
import AIIntelligenceSection from '../components/landing/AIIntelligenceSection';
import StudentGrowthSection from '../components/landing/StudentGrowthSection';
import PlacementSection from '../components/landing/PlacementSection';
import RoleEcosystemSection from '../components/landing/RoleEcosystemSection';
import AnalyticsPreviewSection from '../components/landing/AnalyticsPreviewSection';
import InstitutionalManagementSection from '../components/landing/InstitutionalManagementSection';
import SecuritySection from '../components/landing/SecuritySection';
import PricingSaaSSection from '../components/landing/PricingSaaSSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import Footer from '../components/Footer';
import DemoRequestModal from '../components/landing/DemoRequestModal';

/**
 * Home — MAVI Linking Premium Landing Page Component
 * "The Digital Operating Platform for Institutions"
 * "Connecting Institutions. Empowering People. Enabling Intelligence."
 */
const Home = () => {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    // Intersection Observer for performance-friendly scroll reveals
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const revealElements = document.querySelectorAll('.reveal, .reveal-fade');
    revealElements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleOpenDemoModal = () => {
    setDemoModalOpen(true);
  };

  const handleCloseDemoModal = () => {
    setDemoModalOpen(false);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      {/* Sticky Navigation Bar */}
      <LandingNavbar onOpenDemoModal={handleOpenDemoModal} />

      {/* Main Content Sections */}
      <main>
        {/* Section 1: Hero & Node Canvas */}
        <HeroSection onOpenDemoModal={handleOpenDemoModal} />

        {/* Section 2: Problem Section */}
        <ProblemSection />

        {/* Section 3: Solution Ecosystem Section */}
        <SolutionSection />

        {/* Section 4: Meaning of "Linking" (4 Pillars) */}
        <LinkingPillarsSection />

        {/* Section 5: Platform Modules */}
        <PlatformModulesSection />

        {/* Section 6: AI Intelligence Section */}
        <AIIntelligenceSection />

        {/* Section 7: Student Development & Growth */}
        <StudentGrowthSection />

        {/* Section 8: Placement Intelligence */}
        <PlacementSection />

        {/* Section 9: Role-Based Ecosystem */}
        <RoleEcosystemSection />

        {/* Section 10: Executive Analytics Preview */}
        <AnalyticsPreviewSection />

        {/* Section 11: Total Institutional Management */}
        <InstitutionalManagementSection />

        {/* Section 12: Security & Data Trust */}
        <SecuritySection />

        {/* Section 13: SaaS Scalability & Centralized Billing */}
        <PricingSaaSSection onOpenDemoModal={handleOpenDemoModal} />

        {/* Section 14: Final Call to Action */}
        <FinalCTASection onOpenDemoModal={handleOpenDemoModal} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Demo Request Modal */}
      <DemoRequestModal isOpen={demoModalOpen} onClose={handleCloseDemoModal} />
    </div>
  );
};

export default Home;
