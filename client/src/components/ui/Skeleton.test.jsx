import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonGrid } from './Skeleton';

describe('Skeleton components', () => {
  it('renders a single shimmer block with a loading status role', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders the requested number of text lines', () => {
    render(<SkeletonText lines={3} />);
    expect(screen.getByRole('status', { name: /loading text/i }).children).toHaveLength(3);
  });

  it('renders an avatar placeholder when showAvatar is true', () => {
    const { container } = render(<SkeletonCard showAvatar lines={2} />);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(2);
  });

  it('renders the requested number of cards in a grid', () => {
    const { container } = render(<SkeletonGrid count={4} />);
    expect(container.querySelectorAll('.glass-card').length).toBe(4);
  });
});