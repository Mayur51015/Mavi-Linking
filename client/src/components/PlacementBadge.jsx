import React from 'react';
import { STATUS_BADGE_MAP } from '../constants/placementConstants';

/**
 * PlacementBadge — reusable placement/recruitment status badge
 * with icon, color, and optional company name for placed students.
 */
const PlacementBadge = ({ status, company, size = 'md', showIcon = true, style = {} }) => {
  const config = STATUS_BADGE_MAP[status] || STATUS_BADGE_MAP['Available for Hiring'];

  const sizes = {
    sm: { fontSize: '0.7rem', padding: '0.15rem 0.5rem', gap: '0.2rem' },
    md: { fontSize: '0.8rem', padding: '0.25rem 0.75rem', gap: '0.3rem' },
    lg: { fontSize: '0.9rem', padding: '0.375rem 1rem', gap: '0.4rem' },
  };

  const sizeStyle = sizes[size] || sizes.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeStyle.gap,
        padding: sizeStyle.padding,
        borderRadius: '9999px',
        fontSize: sizeStyle.fontSize,
        fontWeight: '600',
        letterSpacing: '0.02em',
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}22`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{status}</span>
      {company && status === 'Placed / Hired' && (
        <span style={{ opacity: 0.8, fontWeight: 500 }}>@ {company}</span>
      )}
    </span>
  );
};

export default PlacementBadge;
