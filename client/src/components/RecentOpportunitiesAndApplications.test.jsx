import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import RecentOpportunitiesTable from './RecentOpportunitiesTable';
import RecentApplicationsCard from './RecentApplicationsCard';

const mockJobs = [
  {
    _id: 'job-101',
    title: 'Frontend React Developer',
    description: 'Work with React, Vite, and Tailwind.',
    type: 'Full-time',
    workMode: 'Remote',
    location: 'Remote, India',
    package: '12 LPA',
    deadline: new Date(Date.now() + 864000000).toISOString(),
    skills: ['React', 'JavaScript'],
    companyId: { name: 'Acme Software', logo: '' },
    hasApplied: false,
    matchScore: 90,
  },
  {
    _id: 'job-102',
    title: 'Backend Node Intern',
    description: 'Build microservices with Node.js and MongoDB.',
    type: 'Internship',
    workMode: 'On-site',
    location: 'Pune',
    stipend: '₹25,000/month',
    deadline: new Date(Date.now() + 500000000).toISOString(),
    skills: ['Node.js', 'MongoDB'],
    companyId: { name: 'Beta Innovations', logo: '' },
    hasApplied: true,
    applicationStatus: 'Shortlisted',
    matchScore: 80,
  },
];

const mockPipelines = [
  {
    _id: 'pipe-201',
    role: 'Frontend React Developer',
    companyName: 'Acme Software',
    status: 'Shortlisted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recruiterMessage: 'Looking forward to the technical discussion.',
    timeline: [
      { status: 'Applied', updatedAt: new Date().toISOString(), note: 'Applied online' },
      { status: 'Shortlisted', updatedAt: new Date().toISOString(), note: 'Profile matched' },
    ],
  },
];

describe('RecentOpportunitiesTable Component', () => {
  it('renders loading state properly without mock fallback', () => {
    render(
      <BrowserRouter>
        <RecentOpportunitiesTable jobs={[]} loading={true} />
      </BrowserRouter>
    );
    expect(screen.getByText(/loading opportunities/i)).toBeInTheDocument();
  });

  it('renders empty state when no opportunities exist', () => {
    render(
      <BrowserRouter>
        <RecentOpportunitiesTable jobs={[]} loading={false} />
      </BrowserRouter>
    );
    expect(screen.getByText(/no active opportunities available right now/i)).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const handleRetry = vi.fn();
    render(
      <BrowserRouter>
        <RecentOpportunitiesTable jobs={[]} error={true} onRetry={handleRetry} />
      </BrowserRouter>
    );
    expect(screen.getByText(/unable to load opportunities/i)).toBeInTheDocument();
    const retryBtn = screen.getByText(/retry/i);
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders live database opportunities correctly', () => {
    render(
      <BrowserRouter>
        <RecentOpportunitiesTable jobs={mockJobs} loading={false} />
      </BrowserRouter>
    );
    expect(screen.getByText('Frontend React Developer')).toBeInTheDocument();
    expect(screen.getByText('Backend Node Intern')).toBeInTheDocument();
    expect(screen.getByText('12 LPA')).toBeInTheDocument();
    expect(screen.getByText('₹25,000/month')).toBeInTheDocument();
    expect(screen.getByText(/90% Match/i)).toBeInTheDocument();
  });

  it('filters by search keyword', () => {
    render(
      <BrowserRouter>
        <RecentOpportunitiesTable jobs={mockJobs} loading={false} />
      </BrowserRouter>
    );
    const searchInput = screen.getByPlaceholderText(/search role, skill, company/i);
    fireEvent.change(searchInput, { target: { value: 'Node' } });
    expect(screen.queryByText('Frontend React Developer')).not.toBeInTheDocument();
    expect(screen.getByText('Backend Node Intern')).toBeInTheDocument();
  });

  it('filters by type pill (Internship)', () => {
    render(
      <BrowserRouter>
        <RecentOpportunitiesTable jobs={mockJobs} loading={false} />
      </BrowserRouter>
    );
    const internshipPill = screen.getByRole('button', { name: 'Internship' });
    fireEvent.click(internshipPill);
    expect(screen.queryByText('Frontend React Developer')).not.toBeInTheDocument();
    expect(screen.getByText('Backend Node Intern')).toBeInTheDocument();
  });

  it('opens details modal when clicking View Details', () => {
    render(
      <BrowserRouter>
        <RecentOpportunitiesTable jobs={mockJobs} loading={false} />
      </BrowserRouter>
    );
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[0]);
    expect(screen.getByText('About the Role')).toBeInTheDocument();
    expect(screen.getByText('Work with React, Vite, and Tailwind.')).toBeInTheDocument();
  });
});

describe('RecentApplicationsCard Component', () => {
  it('renders loading state properly', () => {
    render(
      <BrowserRouter>
        <RecentApplicationsCard pipelines={[]} loading={true} />
      </BrowserRouter>
    );
    expect(screen.getByText(/loading applications/i)).toBeInTheDocument();
  });

  it('renders empty state when student has no applications', () => {
    render(
      <BrowserRouter>
        <RecentApplicationsCard pipelines={[]} loading={false} />
      </BrowserRouter>
    );
    expect(screen.getByText(/you haven't applied to any opportunities yet/i)).toBeInTheDocument();
  });

  it('renders real student applications with live status badge', () => {
    render(
      <BrowserRouter>
        <RecentApplicationsCard pipelines={mockPipelines} loading={false} />
      </BrowserRouter>
    );
    expect(screen.getByText('Frontend React Developer')).toBeInTheDocument();
    expect(screen.getByText('Acme Software')).toBeInTheDocument();
    expect(screen.getByText('Shortlisted')).toBeInTheDocument();
  });

  it('opens application timeline details modal', () => {
    render(
      <BrowserRouter>
        <RecentApplicationsCard pipelines={mockPipelines} loading={false} />
      </BrowserRouter>
    );
    const viewBtn = screen.getByText('View Details');
    fireEvent.click(viewBtn);
    expect(screen.getByText(/application lifecycle timeline/i)).toBeInTheDocument();
    expect(screen.getByText('Looking forward to the technical discussion.')).toBeInTheDocument();
  });
});
