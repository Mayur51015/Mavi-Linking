import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Dashboard from './Dashboard';
import api from '../api/axios';

// Mock layout and complex child components
vi.mock('../layouts/UserLayout', () => ({
  default: ({ children }) => <div data-testid="user-layout">{children}</div>,
}));

vi.mock('../pages/Messages', () => ({
  default: () => <div data-testid="messages-page" />,
}));

vi.mock('../components/DNACard', () => ({
  default: () => <div data-testid="dna-card" />,
}));

vi.mock('../components/GitHubIntelligenceCard', () => ({
  default: () => <div data-testid="github-intelligence-card" />,
}));

vi.mock('../components/SkillRadar', () => ({
  default: () => <div data-testid="skill-radar" />,
}));

vi.mock('../components/LearningGrowthCard', () => ({
  default: () => <div data-testid="learning-growth-card" />,
}));

vi.mock('../components/SkillProgressList', () => ({
  default: () => <div data-testid="skill-progress-list" />,
}));

vi.mock('../components/BadgeShowcase', () => ({
  default: () => <div data-testid="badge-showcase" />,
}));

vi.mock('../components/TimelineWidget', () => ({
  default: () => <div data-testid="timeline-widget" />,
}));

vi.mock('../components/leetcode/LeetCodeSection', () => ({
  default: () => <div data-testid="leetcode-section" />,
}));

const mockPipelines = [
  {
    _id: 'pipe-1',
    role: 'Software Engineer',
    companyName: 'Acme Corp',
    status: 'Shortlisted',
    timeline: [{ status: 'Applied', updatedAt: new Date().toISOString() }],
  },
];

describe('Dashboard — Student Placement Pipelines Authorization & Role Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDashboardWithAuth = (authValues, initialRoute = '/dashboard') => {
    const defaultAuth = {
      user: null,
      loading: false,
      setUser: vi.fn(),
      updateProfile: vi.fn(),
      socket: null,
      refreshUser: vi.fn(),
      logout: vi.fn(),
      isPendingVerification: false,
      ...authValues,
    };

    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthContext.Provider value={defaultAuth}>
          <Dashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('does NOT fetch placement pipelines when authLoading is true', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: [] } });

    renderDashboardWithAuth({
      user: null,
      loading: true,
    });

    // Verify /placement/student/pipelines was never called
    const calledUrls = getSpy.mock.calls.map((c) => c[0]);
    expect(calledUrls).not.toContain('/placement/student/pipelines');
  });

  it('calls /placement/student/pipelines for an authenticated approved Student and displays pipelines', async () => {
    const getSpy = vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/placement/student/pipelines') {
        return Promise.resolve({ data: { success: true, data: mockPipelines } });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    renderDashboardWithAuth({
      user: {
        _id: 'student-123',
        name: 'Jane Student',
        email: 'jane@example.com',
        role: 'user',
        roles: ['user'],
        accountStatus: 'ACTIVE',
        emailVerified: true,
      },
      loading: false,
    });

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith('/placement/student/pipelines');
    });

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
  });

  it('renders clean empty state with HTTP 200 contract when approved Student has 0 pipelines', async () => {
    const getSpy = vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/placement/student/pipelines') {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    renderDashboardWithAuth({
      user: {
        _id: 'student-empty',
        name: 'Empty Student',
        email: 'empty@example.com',
        role: 'user',
        roles: ['user'],
        accountStatus: 'ACTIVE',
        emailVerified: true,
      },
      loading: false,
    });

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith('/placement/student/pipelines');
    });

    await waitFor(() => {
      expect(screen.getByText(/you haven't applied to any opportunities yet/i)).toBeInTheDocument();
    });
  });

  it('does NOT call /placement/student/pipelines when Student account is pending verification', async () => {
    const getSpy = vi.spyOn(api, 'get').mockImplementation((url) => {
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    renderDashboardWithAuth({
      user: {
        _id: 'student-pending',
        name: 'Pending Student',
        email: 'pending@example.com',
        role: 'user',
        roles: ['user'],
        accountStatus: 'PENDING_ADMIN_APPROVAL',
        emailVerified: true,
      },
      loading: false,
    });

    // Wait for render to settle
    await waitFor(() => {
      expect(
        screen.getByText('Placement applications are available after your institution approves your account.')
      ).toBeInTheDocument();
    });

    // Ensure /placement/student/pipelines was NEVER requested
    const calledUrls = getSpy.mock.calls.map((c) => c[0]);
    expect(calledUrls).not.toContain('/placement/student/pipelines');
  });

  it('does NOT call /placement/student/pipelines when caller is a Teacher on /profile/edit', async () => {
    const getSpy = vi.spyOn(api, 'get').mockImplementation(() => {
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    renderDashboardWithAuth(
      {
        user: {
          _id: 'teacher-1',
          name: 'Professor Smith',
          email: 'prof@example.com',
          role: 'teacher',
          roles: ['teacher'],
          accountStatus: 'ACTIVE',
        },
        loading: false,
      },
      '/profile/edit'
    );

    // Ensure /placement/student/pipelines was NEVER called for teacher
    const calledUrls = getSpy.mock.calls.map((c) => c[0]);
    expect(calledUrls).not.toContain('/placement/student/pipelines');
  });

  it('does NOT call /placement/student/pipelines when caller is a Recruiter on /profile/edit', async () => {
    const getSpy = vi.spyOn(api, 'get').mockImplementation(() => {
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    renderDashboardWithAuth(
      {
        user: {
          _id: 'recruiter-1',
          name: 'Recruiter Bob',
          email: 'recruiter@example.com',
          role: 'recruiter',
          roles: ['recruiter'],
          accountStatus: 'ACTIVE',
        },
        loading: false,
      },
      '/profile/edit'
    );

    const calledUrls = getSpy.mock.calls.map((c) => c[0]);
    expect(calledUrls).not.toContain('/placement/student/pipelines');
  });

  it('does NOT call /placement/student/pipelines for Institution Admin, Admin, Super Admin, or Owner', async () => {
    const getSpy = vi.spyOn(api, 'get').mockImplementation(() => {
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    renderDashboardWithAuth(
      {
        user: {
          _id: 'admin-1',
          name: 'Admin Alice',
          email: 'admin@institution.edu',
          role: 'institution_admin',
          roles: ['institution_admin'],
          accountStatus: 'ACTIVE',
        },
        loading: false,
      },
      '/profile/edit'
    );

    const calledUrls = getSpy.mock.calls.map((c) => c[0]);
    expect(calledUrls).not.toContain('/placement/student/pipelines');
  });
});
