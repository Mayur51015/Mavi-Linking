import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { AuthContext } from '../context/AuthContext';

const renderWithAuth = (ui, authContextValue, initialEntries = ['/protected']) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/change-password" element={<div data-testid="change-password-page">Change Password</div>} />
          <Route path="/pending-approval" element={<div data-testid="pending-approval-page">Pending Approval</div>} />
          <Route path="/verify/:id" element={<div data-testid="verify-account-page">Verify Account</div>} />
          <Route path="/dashboard" element={<div data-testid="user-dashboard">User Dashboard</div>} />
          <Route path="/teacher/dashboard" element={<div data-testid="teacher-dashboard">Teacher Dashboard</div>} />
          <Route path="/protected" element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute Component & Role Authorization Guard', () => {
  it('renders loading spinner and does not redirect while auth state is loading', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="secret-content">Secret Content</div>
      </ProtectedRoute>,
      { user: null, loading: true }
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated visitor to /login by default', () => {
    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="secret-content">Secret Content</div>
      </ProtectedRoute>,
      { user: null, loading: false }
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
  });

  it('redirects user with mustChangePassword flag to /change-password', () => {
    const user = {
      _id: 'user-1',
      name: 'Temp Password User',
      role: 'user',
      roles: ['user'],
      mustChangePassword: true,
      accountStatus: 'ACTIVE',
      emailVerified: true,
    };

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="secret-content">Secret Content</div>
      </ProtectedRoute>,
      { user, loading: false }
    );

    expect(screen.getByTestId('change-password-page')).toBeInTheDocument();
    expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
  });

  it('blocks suspended accounts and displays suspension notice', () => {
    const user = {
      _id: 'user-2',
      name: 'Suspended User',
      role: 'user',
      roles: ['user'],
      status: 'suspended',
    };

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="secret-content">Secret Content</div>
      </ProtectedRoute>,
      { user, loading: false }
    );

    expect(screen.getByText(/account suspended/i)).toBeInTheDocument();
    expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
  });

  it('redirects unverified student email to /verify/account', () => {
    const user = {
      _id: 'user-unverified',
      name: 'Unverified Student',
      role: 'user',
      roles: ['user'],
      emailVerified: false,
      etxId: 'ETX-TEST-01',
    };

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="secret-content">Secret Content</div>
      </ProtectedRoute>,
      { user, loading: false }
    );

    expect(screen.getByTestId('verify-account-page')).toBeInTheDocument();
    expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
  });

  it('redirects rejected student accounts to /pending-approval', () => {
    const user = {
      _id: 'user-3',
      name: 'Rejected Student',
      role: 'user',
      roles: ['user'],
      emailVerified: true,
      accountStatus: 'REJECTED',
    };

    renderWithAuth(
      <ProtectedRoute>
        <div data-testid="secret-content">Secret Content</div>
      </ProtectedRoute>,
      { user, loading: false }
    );

    expect(screen.getByTestId('pending-approval-page')).toBeInTheDocument();
    expect(screen.queryByTestId('secret-content')).not.toBeInTheDocument();
  });

  it('redirects unauthorized student away from teacher route to their user dashboard', () => {
    const studentUser = {
      _id: 'student-1',
      name: 'Student User',
      role: 'user',
      roles: ['user'],
      emailVerified: true,
      accountStatus: 'ACTIVE',
      status: 'active',
    };

    // Protected route restricted strictly to 'teacher' or 'admin'
    renderWithAuth(
      <ProtectedRoute roles={['teacher', 'admin']}>
        <div data-testid="teacher-only-content">Teacher Dashboard</div>
      </ProtectedRoute>,
      { user: studentUser, loading: false }
    );

    // Student should be redirected to user dashboard, not allowed into teacher content
    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('teacher-only-content')).not.toBeInTheDocument();
  });

  it('renders protected child component for authorized user with matching role', () => {
    const teacherUser = {
      _id: 'teacher-1',
      name: 'Teacher User',
      role: 'teacher',
      roles: ['teacher'],
      accountStatus: 'ACTIVE',
      status: 'active',
      emailVerified: true,
    };

    renderWithAuth(
      <ProtectedRoute roles={['teacher', 'admin']}>
        <div data-testid="teacher-only-content">Teacher Dashboard Content</div>
      </ProtectedRoute>,
      { user: teacherUser, loading: false }
    );

    expect(screen.getByTestId('teacher-only-content')).toBeInTheDocument();
  });
});
