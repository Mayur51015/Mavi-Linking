import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DepartmentAdminManager from './DepartmentAdminManager';
import UserLifecycleTable from './UserLifecycleTable';
import api from '../../api/axios';
import { ToastProvider } from '../../context/ToastContext';

// Mock API
vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Admin Resend Invite & Rate Limit UI Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DepartmentAdminManager Component', () => {
    const mockAdmins = [
      {
        _id: 'dept-admin-1',
        name: 'Dr. Invited Head',
        email: 'invited_dept@test.edu',
        accountStatus: 'INVITED',
        status: 'invited',
        etxId: 'ETX-DEPT-001',
        departmentId: { _id: 'dept-101', name: 'Computer Science' },
      },
    ];

    it('renders single resend endpoint button and invokes /admin/department-admins/:id/resend-invite without fallback', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/admin/department-admins') {
          return Promise.resolve({ data: { success: true, data: mockAdmins } });
        }
        if (url === '/admin/departments') {
          return Promise.resolve({ data: { success: true, data: [{ _id: 'dept-101', name: 'Computer Science' }] } });
        }
        return Promise.resolve({ data: { success: true, data: [] } });
      });

      api.post.mockResolvedValueOnce({
        data: { success: true, message: 'New 24-hour invitation email resent successfully!' },
      });

      render(
        <ToastProvider>
          <DepartmentAdminManager />
        </ToastProvider>
      );

      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByText('Dr. Invited Head')).toBeInTheDocument();
      });

      const resendBtn = screen.getByRole('button', { name: /Resend Invite/i });
      expect(resendBtn).toBeInTheDocument();
      expect(resendBtn).not.toBeDisabled();

      // Click Resend Invite
      fireEvent.click(resendBtn);

      // Verify exact single endpoint called
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(1);
        expect(api.post).toHaveBeenCalledWith('/admin/department-admins/dept-admin-1/resend-invite');
      });

      // Verify it NEVER called /admin/users/:id/resend-invitation
      expect(api.post).not.toHaveBeenCalledWith(expect.stringContaining('/admin/users/'));
    });

    it('handles 429 rate limit response gracefully, disables button, and displays cooldown', async () => {
      api.get.mockImplementation((url) => {
        if (url === '/admin/department-admins') {
          return Promise.resolve({ data: { success: true, data: mockAdmins } });
        }
        if (url === '/admin/departments') {
          return Promise.resolve({ data: { success: true, data: [] } });
        }
        return Promise.resolve({ data: { success: true, data: [] } });
      });

      // Mock 429 response
      api.post.mockRejectedValueOnce({
        response: {
          status: 429,
          headers: { 'retry-after': '45' },
          data: {
            success: false,
            code: 'RATE_LIMITED',
            message: 'Rate limit active: please wait 45s before retrying.',
            data: { retryAfter: 45 },
          },
        },
      });

      render(
        <ToastProvider>
          <DepartmentAdminManager />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. Invited Head')).toBeInTheDocument();
      });

      const resendBtn = screen.getByRole('button', { name: /Resend Invite/i });
      fireEvent.click(resendBtn);

      // Button should now be disabled and reflect cooldown
      await waitFor(() => {
        expect(resendBtn).toBeDisabled();
        expect(resendBtn).toHaveTextContent(/Wait/i);
      });
    });
  });

  describe('UserLifecycleTable Component', () => {
    const mockUsers = [
      {
        _id: 'user-dept-admin-1',
        name: 'Dept Admin Candidate',
        email: 'dept_admin_user@test.edu',
        role: 'department_admin',
        accountStatus: 'INVITED',
        status: 'active',
      },
      {
        _id: 'user-student-1',
        name: 'Invited Student',
        email: 'invited_student@test.edu',
        role: 'user',
        accountStatus: 'INVITED',
        status: 'active',
      },
    ];

    it('routes department_admin strictly to /admin/department-admins/:id/resend-invite', async () => {
      window.alert = vi.fn();
      api.post.mockResolvedValueOnce({
        data: { success: true, message: 'Invitation email dispatched' },
      });

      render(
        <UserLifecycleTable
          users={[mockUsers[0]]}
          currentUserRole="institution_admin"
          onRefresh={vi.fn()}
        />
      );

      const resendBtn = screen.getByRole('button', { name: /Resend Mail|Resend Invite/i });
      fireEvent.click(resendBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(1);
        expect(api.post).toHaveBeenCalledWith('/admin/department-admins/user-dept-admin-1/resend-invite');
      });

      // Ensure no fallback chaining occurred
      expect(api.post).not.toHaveBeenCalledWith(expect.stringContaining('/admin/users/user-dept-admin-1'));
    });

    it('routes standard user strictly to /admin/users/:id/resend-invitation', async () => {
      window.alert = vi.fn();
      api.post.mockResolvedValueOnce({
        data: { success: true, message: 'Invitation email dispatched' },
      });

      render(
        <UserLifecycleTable
          users={[mockUsers[1]]}
          currentUserRole="institution_admin"
          onRefresh={vi.fn()}
        />
      );

      const resendBtn = screen.getByRole('button', { name: /Resend Mail|Resend Invite/i });
      fireEvent.click(resendBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(1);
        expect(api.post).toHaveBeenCalledWith('/admin/users/user-student-1/resend-invitation');
      });

      // Ensure no fallback chaining occurred
      expect(api.post).not.toHaveBeenCalledWith(expect.stringContaining('/admin/department-admins/'));
    });
  });
});
