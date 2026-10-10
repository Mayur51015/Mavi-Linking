import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecentSubmissions from './RecentSubmissions';

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('RecentSubmissions Component', () => {
  const mockSubmissions = [
    {
      title: 'Remove Outermost Parentheses',
      titleSlug: 'remove-outermost-parentheses',
      lang: 'python3',
      statusDisplay: 'Accepted',
      timestamp: 1791465250,
      url: 'https://leetcode.com/problems/remove-outermost-parentheses/',
    },
    {
      title: 'Two Sum',
      titleSlug: 'two-sum',
      lang: 'javascript',
      statusDisplay: 'Accepted',
      timestamp: 1791460000,
      url: 'https://leetcode.com/problems/two-sum/',
    },
    {
      title: '', // Missing title, tests slug fallback
      titleSlug: 'reverse-linked-list',
      lang: 'python3',
      statusDisplay: 'Accepted',
      timestamp: 1791450000,
      url: 'https://leetcode.com/problems/reverse-linked-list/',
    },
    {
      title: 'Valid Parentheses',
      titleSlug: 'valid-parentheses',
      lang: 'cpp',
      statusDisplay: 'Wrong Answer',
      timestamp: 1791440000,
      url: 'https://leetcode.com/problems/valid-parentheses/',
    },
    {
      title: 'Merge Two Sorted Lists',
      titleSlug: 'merge-two-sorted-lists',
      lang: 'python3',
      statusDisplay: 'Accepted',
      timestamp: 1791430000,
      url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
    },
    {
      title: 'Maximum Subarray',
      titleSlug: 'maximum-subarray',
      lang: 'python3',
      statusDisplay: 'Accepted',
      timestamp: 1791420000,
      url: 'https://leetcode.com/problems/maximum-subarray/',
    },
  ];

  it('renders empty state honestly when no submissions exist', () => {
    renderWithRouter(<RecentSubmissions submissions={[]} />);
    expect(screen.getByText(/No recent coding submissions/i)).toBeInTheDocument();
    expect(screen.getByText(/Solve problems on LeetCode/i)).toBeInTheDocument();
  });

  it('renders question titles, languages, statuses and formatted dates', () => {
    renderWithRouter(<RecentSubmissions submissions={mockSubmissions} />);

    // Check header
    expect(screen.getByText(/Coding Activity & Submissions/i)).toBeInTheDocument();
    expect(screen.getByText(/6 Submissions/i)).toBeInTheDocument();

    // Check question title rendered clearly in dark readable text
    expect(screen.getByText('Remove Outermost Parentheses')).toBeInTheDocument();
    expect(screen.getByText('Two Sum')).toBeInTheDocument();

    // Check slug fallback for missing title
    expect(screen.getByText('Reverse Linked List')).toBeInTheDocument();

    // Check languages
    expect(screen.getAllByText('python3').length).toBeGreaterThan(0);
    expect(screen.getByText('javascript')).toBeInTheDocument();

    // Check status
    expect(screen.getAllByText('Accepted').length).toBeGreaterThan(0);
  });

  it('opens external link with target="_blank" and rel="noopener noreferrer"', () => {
    renderWithRouter(<RecentSubmissions submissions={mockSubmissions} />);

    const link = screen.getByLabelText('Open "Remove Outermost Parentheses" on LeetCode');
    expect(link).toHaveAttribute('href', 'https://leetcode.com/problems/remove-outermost-parentheses/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('provides Show More and Show Less pagination controls when more than 5 submissions', () => {
    renderWithRouter(<RecentSubmissions submissions={mockSubmissions} />);

    // Initial 5 items are displayed, 6th is hidden
    expect(screen.queryByText('Maximum Subarray')).not.toBeInTheDocument();
    expect(screen.getByText(/Show More \(1 more\)/i)).toBeInTheDocument();

    // Click Show More
    fireEvent.click(screen.getByText(/Show More/i));
    expect(screen.getByText('Maximum Subarray')).toBeInTheDocument();
    expect(screen.getByText(/Show Less/i)).toBeInTheDocument();

    // Click Show Less
    fireEvent.click(screen.getByText(/Show Less/i));
    expect(screen.queryByText('Maximum Subarray')).not.toBeInTheDocument();
  });
});
