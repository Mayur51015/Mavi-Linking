import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LandingNavbar from './LandingNavbar';
import { AuthContext } from '../../context/AuthContext';

const renderNavbar = (user = null) => {
  render(
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

describe('LandingNavbar mobile navigation', () => {
  it('provides an accessible mobile menu trigger and opens the mobile menu panel', () => {
    renderNavbar();

    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    fireEvent.click(toggle);

    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /platform/i }).length).toBeGreaterThan(0);
  });
});
