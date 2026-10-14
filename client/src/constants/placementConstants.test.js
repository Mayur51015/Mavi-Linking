import { describe, it, expect } from 'vitest';
import {
  PLACEMENT_STATUSES,
  PIPELINE_STATUSES,
  STATUS_BADGE_MAP,
  NOTIFICATION_TYPES,
} from './placementConstants';

describe('placementConstants', () => {
  it('defines unique candidate lifecycle statuses', () => {
    expect(PLACEMENT_STATUSES.length).toBeGreaterThan(0);
    const unique = new Set(PLACEMENT_STATUSES);
    expect(unique.size).toBe(PLACEMENT_STATUSES.length);
    expect(PLACEMENT_STATUSES).toContain('Available for Hiring');
    expect(PLACEMENT_STATUSES).toContain('Placed / Hired');
  });

  it('defines unique pipeline statuses', () => {
    expect(PIPELINE_STATUSES.length).toBeGreaterThan(0);
    const unique = new Set(PIPELINE_STATUSES);
    expect(unique.size).toBe(PIPELINE_STATUSES.length);
    expect(PIPELINE_STATUSES).toContain('Applied');
    expect(PIPELINE_STATUSES).toContain('Selected');
    expect(PIPELINE_STATUSES).toContain('Rejected');
  });

  it('provides color, bg, and icon styling for all statuses in STATUS_BADGE_MAP', () => {
    Object.entries(STATUS_BADGE_MAP).forEach(([status, style]) => {
      expect(typeof status).toBe('string');
      expect(style).toHaveProperty('color');
      expect(style).toHaveProperty('bg');
      expect(style).toHaveProperty('icon');
      expect(style.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(style.bg).toContain('rgba');
    });
  });

  it('provides label and valid hex color for all NOTIFICATION_TYPES', () => {
    Object.entries(NOTIFICATION_TYPES).forEach(([typeKey, notif]) => {
      expect(typeof typeKey).toBe('string');
      expect(notif).toHaveProperty('label');
      expect(notif).toHaveProperty('color');
      expect(notif.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
