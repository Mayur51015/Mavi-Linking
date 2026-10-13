import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GitHubIntelligenceCard from './GitHubIntelligenceCard';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('./GitHubIntelligenceModal', () => ({
  default: () => <div data-testid="github-modal" />,
}));

const renderWithContext = (ui, authUser = { id: 'u1', name: 'Test User' }) => {
  return render(
    <AuthContext.Provider value={{ user: authUser, loading: false }}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('GitHubIntelligenceCard Truthful Data Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unlinked state when user has not connected GitHub - no fake stats or username', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          linked: false,
          connectionState: 'not_connected',
          username: null,
          intelligence: null,
          totalScore: null,
          lastSyncedAt: null,
        },
      },
    });

    renderWithContext(<GitHubIntelligenceCard />);

    await waitFor(() => {
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
    });

    // Must not show fake username, repos, languages, commits, or scores
    expect(screen.queryByText('@mayur51015')).not.toBeInTheDocument();
    expect(screen.queryByText('59')).not.toBeInTheDocument();
    expect(screen.queryByText('697')).not.toBeInTheDocument();
    expect(screen.queryByText('31 Commits')).not.toBeInTheDocument();
    expect(screen.queryByText(/Synced 14m ago/i)).not.toBeInTheDocument();

    // Must show clear Connect GitHub action
    expect(screen.getByRole('button', { name: /Connect GitHub/i })).toBeInTheDocument();
  });

  it('renders revoked authorization state with Reconnect action when access is revoked', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          linked: false,
          connectionState: 'revoked',
          username: null,
          intelligence: null,
          totalScore: null,
          lastSyncedAt: null,
        },
      },
    });

    renderWithContext(<GitHubIntelligenceCard />);

    await waitFor(() => {
      expect(screen.getByText('Authorization Revoked')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Reconnect GitHub/i })).toBeInTheDocument();
  });

  it('renders pending state when connection is pending verification', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          linked: false,
          connectionState: 'pending',
          username: null,
          intelligence: null,
          totalScore: null,
          lastSyncedAt: null,
        },
      },
    });

    renderWithContext(<GitHubIntelligenceCard />);

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Verify GitHub Account/i })).toBeInTheDocument();
  });

  it('renders connected state with truthful live statistics and real 0 values', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          linked: true,
          connectionState: 'connected',
          username: 'realdev',
          intelligence: {
            repositories: [],
            languages: { distribution: {} },
            commits: { available: true, recentCount30Days: 0 },
          },
          totalScore: 120,
          lastSyncedAt: new Date(Date.now() - 5 * 60000).toISOString(),
          freshnessMinutes: 5,
        },
      },
    });

    renderWithContext(<GitHubIntelligenceCard />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    expect(screen.getByText('@realdev')).toBeInTheDocument();
    expect(screen.getByText(/Synced 5m ago/i)).toBeInTheDocument();

    // Must display real 0 values truthfully, not fallback placeholders
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3); // repos=0, languages=0, commits=0

    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('displays "Not available" when development score has insufficient evidence', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          linked: true,
          connectionState: 'connected',
          username: 'newcoder',
          intelligence: {
            repositories: [],
            languages: { distribution: {} },
            commits: { available: false, recentCount30Days: null },
          },
          totalScore: null,
          lastSyncedAt: new Date().toISOString(),
          freshnessMinutes: 0,
        },
      },
    });

    renderWithContext(<GitHubIntelligenceCard />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    expect(screen.getByText('Not available')).toBeInTheDocument();
    expect(screen.queryByText('697')).not.toBeInTheDocument();
  });
});
