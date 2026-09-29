import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import api, { getApiBaseUrl, getBackendBaseUrl } from '../api/axios';
import PlacementDrives from '../pages/teacher/PlacementDrives';

// Mock the TeacherLayout to simplify test rendering
vi.mock('../layouts/TeacherLayout', () => ({
  default: ({ children }) => <div data-testid="teacher-layout">{children}</div>,
}));

describe('API URL Configuration & Localhost Prevention', () => {
  it('returns valid API base URL and backend base URL', () => {
    const apiBase = getApiBaseUrl();
    const backendBase = getBackendBaseUrl();

    expect(apiBase).toBeDefined();
    expect(backendBase).toBeDefined();
    expect(apiBase.endsWith('/api')).toBe(true);
    expect(backendBase.endsWith('/api')).toBe(false);
  });
});

describe('PlacementDrives Component - Role & Validation Testing', () => {
  const mockDrives = [
    {
      _id: 'drive-1',
      title: 'Google Placement Drive 2026',
      description: 'Annual campus hiring drive for software roles',
      companyId: {
        _id: 'comp-1',
        name: 'Google LLC',
        location: 'Bangalore',
      },
      date: '2026-11-15T00:00:00.000Z',
      eligibility: {
        minScore: 700,
        departments: ['CSE', 'IT'],
      },
      students: [],
    },
  ];

  const mockCompanies = [
    {
      _id: 'comp-1',
      name: 'Google LLC',
      location: 'Bangalore',
      industry: 'Internet',
    },
    {
      _id: 'comp-2',
      name: 'Microsoft Corporation',
      location: 'Hyderabad',
      industry: 'Software',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /teacher/companies and NEVER calls /recruiter/company', async () => {
    const getSpy = vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/teacher/drives') {
        return Promise.resolve({ data: { success: true, data: mockDrives } });
      }
      if (url.startsWith('/teacher/students')) {
        return Promise.resolve({ data: { success: true, data: { students: [] } } });
      }
      if (url === '/teacher/companies') {
        return Promise.resolve({ data: { success: true, data: mockCompanies } });
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`));
    });

    render(
      <BrowserRouter>
        <PlacementDrives />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Google Placement Drive 2026')).toBeInTheDocument();
    });

    // Verify /teacher/companies was called
    expect(getSpy).toHaveBeenCalledWith('/teacher/companies');

    // Verify /recruiter/company was NEVER called
    const calledUrls = getSpy.mock.calls.map((call) => call[0]);
    expect(calledUrls).not.toContain('/recruiter/company');
  });

  it('validates hosting company selection and blocks invalid submission', async () => {
    window.alert = vi.fn();
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } });

    vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/teacher/drives') {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      if (url.startsWith('/teacher/students')) {
        return Promise.resolve({ data: { success: true, data: { students: [] } } });
      }
      if (url === '/teacher/companies') {
        return Promise.resolve({ data: { success: true, data: mockCompanies } });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    render(
      <BrowserRouter>
        <PlacementDrives />
      </BrowserRouter>
    );

    // Click "Schedule Drive" to open form
    const scheduleBtn = await screen.findByText('Schedule Drive');
    fireEvent.click(scheduleBtn);

    // Form is now visible
    expect(screen.getByText('Schedule Recruitment Drive')).toBeInTheDocument();

    // Verify real companies are populated in the select dropdown
    expect(screen.getByText('Google LLC (Bangalore)')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Corporation (Hyderabad)')).toBeInTheDocument();

    // Fill title but set company to 'mock' (invalid, caught by JS validation)
    fireEvent.change(screen.getByLabelText(/Drive Title \*/i), { target: { value: 'Test Drive' } });
    fireEvent.change(screen.getByLabelText(/Hosting Company \*/i), { target: { value: 'mock' } });

    // Submit the form directly — bypasses JSDOM native constraint validation
    // so we can test the React-level handleSubmit JS validation for invalid company
    const form = screen.getByText('Publish Drive').closest('form');
    fireEvent.submit(form);

    // Should alert and NOT make POST request
    expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/select a valid partner company/i));
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('submits valid placement drive payload when company is selected', async () => {
    window.alert = vi.fn();
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      data: { success: true, data: { _id: 'new-drive-1', title: 'New Valid Drive' } },
    });

    vi.spyOn(api, 'get').mockImplementation((url) => {
      if (url === '/teacher/drives') {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      if (url.startsWith('/teacher/students')) {
        return Promise.resolve({ data: { success: true, data: { students: [] } } });
      }
      if (url === '/teacher/companies') {
        return Promise.resolve({ data: { success: true, data: mockCompanies } });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });

    render(
      <BrowserRouter>
        <PlacementDrives />
      </BrowserRouter>
    );

    const scheduleBtn = await screen.findByText('Schedule Drive');
    fireEvent.click(scheduleBtn);

    // Fill title
    fireEvent.change(screen.getByLabelText(/Drive Title \*/i), { target: { value: 'New Valid Drive' } });

    // Select company
    fireEvent.change(screen.getByLabelText(/Hosting Company \*/i), { target: { value: 'comp-1' } });

    // Fill date
    fireEvent.change(screen.getByLabelText(/Scheduled Date \*/i), { target: { value: '2026-12-01' } });

    // Fill cutoff score
    fireEvent.change(screen.getByLabelText(/Cutoff Score \*/i), { target: { value: '650' } });

    // Fill departments
    fireEvent.change(screen.getByLabelText(/Eligible Departments/i), { target: { value: 'CSE, IT, ECE' } });

    // Fill description
    fireEvent.change(screen.getByLabelText(/Drive Details & Guidelines \*/i), { target: { value: 'Campus drive instructions' } });

    const submitBtn = screen.getByText('Publish Drive');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/teacher/drives', {
        title: 'New Valid Drive',
        companyId: 'comp-1',
        description: 'Campus drive instructions',
        date: '2026-12-01',
        eligibility: {
          minScore: 650,
          departments: ['CSE', 'IT', 'ECE'],
        },
      });
    });
  });
});
