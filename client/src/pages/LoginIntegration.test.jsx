import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';
import { AuthContext } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component & Auth Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = (authOverrides = {}) => {
    const defaultAuth = {
      login: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      linkAccountWithSupabase: vi.fn(),
      needsAccountLinking: false,
      user: null,
      loading: false,
      ...authOverrides,
    };

    return {
      ...render(
        <ToastProvider>
          <AuthContext.Provider value={defaultAuth}>
            <BrowserRouter>
              <Login />
            </BrowserRouter>
          </AuthContext.Provider>
        </ToastProvider>
      ),
      auth: defaultAuth,
    };
  };

  it('renders login form elements (identifier, password, submit button, forgot password link)', () => {
    renderLogin();

    expect(screen.getByPlaceholderText(/e\.g\. rollno@college\.edu or ETX-1024/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument();
  });

  it('validates empty inputs and blocks submission with descriptive errors', async () => {
    const { auth } = renderLogin();

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    fireEvent.submit(form);

    expect(await screen.findByText(/please enter your email, etx id, or prn/i)).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();

    // Fill identifier, leave password blank
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. rollno@college\.edu or ETX-1024/i), {
      target: { value: 'student@example.edu' },
    });
    fireEvent.submit(form);

    expect(await screen.findByText(/please enter your password/i)).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('executes successful student login and navigates to /dashboard', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      user: {
        _id: 'usr-101',
        email: 'student@example.edu',
        role: 'user',
        roles: ['user'],
        mustChangePassword: false,
      },
    });

    renderLogin({ login: mockLogin });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. rollno@college\.edu or ETX-1024/i), {
      target: { value: 'student@example.edu' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'SecurePass@123' },
    });

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('student@example.edu', 'SecurePass@123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects to /change-password if user mustChangePassword flag is true', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      user: {
        _id: 'usr-102',
        email: 'newuser@example.edu',
        role: 'user',
        roles: ['user'],
        mustChangePassword: true,
      },
    });

    renderLogin({ login: mockLogin });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. rollno@college\.edu or ETX-1024/i), {
      target: { value: 'newuser@example.edu' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'TempPassword@1' },
    });

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/change-password');
    });
  });

  it('redirects teacher role to /dashboard/teacher and admin role to /admin', async () => {
    const mockLoginTeacher = vi.fn().mockResolvedValue({
      user: {
        _id: 'teacher-101',
        role: 'teacher',
        roles: ['teacher'],
      },
    });

    const { unmount } = renderLogin({ login: mockLoginTeacher });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. rollno@college\.edu or ETX-1024/i), {
      target: { value: 'teacher@example.edu' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'TeacherPass@123' },
    });

    let form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/teacher');
    });

    unmount();

    // Test Admin
    const mockLoginAdmin = vi.fn().mockResolvedValue({
      user: {
        _id: 'admin-101',
        role: 'admin',
        roles: ['admin'],
      },
    });

    renderLogin({ login: mockLoginAdmin });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. rollno@college\.edu or ETX-1024/i), {
      target: { value: 'admin@example.edu' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'AdminPass@123' },
    });

    form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('displays error banner when authentication fails with 401 invalid credentials', async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid email or password.' },
      },
    });

    renderLogin({ login: mockLogin });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. rollno@college\.edu or ETX-1024/i), {
      target: { value: 'wrong@example.edu' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'WrongPass' },
    });

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('opens and closes the Forgot Password recovery modal', async () => {
    renderLogin();

    const forgotBtn = screen.getByText(/forgot password\?/i);
    fireEvent.click(forgotBtn);

    expect(await screen.findByText(/account recovery/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@institution.edu')).toBeInTheDocument();

    // Close modal by clicking the X button
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find((btn) => btn.querySelector('svg.lucide-x'));
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/account recovery/i)).not.toBeInTheDocument();
    });
  });
});
