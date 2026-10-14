import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HeroSection from './HeroSection';

describe('HeroSection Component with 3D Background', () => {
  it('renders hero headline, description, 4 core pillars, and functional CTAs', () => {
    render(
      <BrowserRouter>
        <HeroSection />
      </BrowserRouter>
    );

    // 1. Headline
    const headline = screen.getByRole('heading', { level: 1 });
    expect(headline).toHaveTextContent(/Build skills/i);
    expect(headline).toHaveTextContent(/Find opportunities/i);

    // 2. Eyebrow & Description
    expect(screen.getByText(/EDUCATION • SKILLS • CAREER/i)).toBeInTheDocument();
    expect(
      screen.getByText(/EduTalentX connects students, institutions, faculty, and recruiters/i)
    ).toBeInTheDocument();

    // 3. 4 Core Pillars
    expect(screen.getByText(/AI Skill Mapping/i)).toBeInTheDocument();
    expect(screen.getByText(/Developer Profiles/i)).toBeInTheDocument();
    expect(screen.getByText(/GitHub • LeetCode • Codeforces • Stack Overflow/i)).toBeInTheDocument();
    expect(screen.getByText(/Skill-Matched Opportunities/i)).toBeInTheDocument();

    // 4. CTAs
    const getStartedLink = screen.getByRole('link', { name: /Get Started/i });
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink.getAttribute('href')).toBe('/register');

    const exploreLink = screen.getByRole('link', { name: /Explore Platform/i });
    expect(exploreLink).toBeInTheDocument();
    expect(exploreLink.getAttribute('href')).toBe('#what-it-does');

    // 5. Hero Workspace Image directly below CTAs
    const heroImg = screen.getByAltText(/EduTalentX dashboard connecting developer skills, coding profiles, and career opportunities/i);
    expect(heroImg).toBeInTheDocument();
    expect(heroImg.getAttribute('src')).toBe('/images/edutalentx-hero-workspace.png');
  });
});
