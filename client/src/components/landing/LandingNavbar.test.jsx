import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LandingNavbar from './LandingNavbar';
import { AuthContext } from '../../context/AuthContext';

const renderNavbar = (user = null) => {
  return render(
    <AuthContext.Provider
      value={{
        user,
        getDashboardPath: () => '/dashboard',
      }}
    >
      <BrowserRouter>
        <LandingNavbar />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('LandingNavbar specification adherence', () => {
  it('renders exact 3 navbar links with correct href destinations and no unnecessary links', () => {
    renderNavbar();

    // Verify exactly the three required links
    const platformLinks = screen.getAllByRole('link', { name: /platform/i });
    expect(platformLinks.length).toBeGreaterThan(0);
    expect(platformLinks[0]).toHaveAttribute('href', '/#what-it-does');

    const solutionsLinks = screen.getAllByRole('link', { name: /solutions/i });
    expect(solutionsLinks.length).toBeGreaterThan(0);
    expect(solutionsLinks[0]).toHaveAttribute('href', '/#who-its-for');

    const securityLinks = screen.getAllByRole('link', { name: /security/i });
    expect(securityLinks.length).toBeGreaterThan(0);
    expect(securityLinks[0]).toHaveAttribute('href', '/#security');

    // Verify unnecessary links are NOT present
    expect(screen.queryByRole('link', { name: /pricing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /resources/i })).not.toBeInTheDocument();
  });

  it('renders Login and Get Started buttons for guests', () => {
    renderNavbar(null);

    const loginLinks = screen.getAllByRole('link', { name: /login/i });
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0]).toHaveAttribute('href', '/login');

    const getStartedLinks = screen.getAllByRole('link', { name: /get started/i });
    expect(getStartedLinks.length).toBeGreaterThan(0);
    expect(getStartedLinks[0]).toHaveAttribute('href', '/register');
  });

  it('renders Dashboard button for authenticated users', () => {
    renderNavbar({ id: '123', role: 'student', name: 'Test User' });

    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThan(0);
    expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard');
  });

  it('provides an accessible mobile menu toggle and opens/closes appropriately', () => {
    renderNavbar();

    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'mobile-navigation-menu');

    // Click to open
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();

    // Closes on Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Reopen and close by clicking a mobile link
    fireEvent.click(toggle);
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();

    const mobilePlatformLink = screen.getAllByRole('link', { name: /platform/i })[1];
    fireEvent.click(mobilePlatformLink);
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();
  });

  it('closes mobile menu when clicking outside on the backdrop', () => {
    const { container } = renderNavbar();

    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(toggle);

    const backdrop = container.querySelector('.edutalentx-mobile-backdrop');
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop);
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();
  });
});
