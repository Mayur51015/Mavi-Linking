import React from 'react';

const SIZES = { sm: 14, md: 24, lg: 40 };

/** Reusable spinner for inline/API-request loading states (e.g. inside buttons). */
const Spinner = ({ size = 'md', label, color = 'currentColor', inline = false }) => {
  const px = SIZES[size] || size;
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
      style={{ display: inline ? 'inline-flex' : 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <span
        className="animate-spin"
        style={{
          display: 'inline-block',
          width: `${px}px`,
          height: `${px}px`,
          border: '2px solid rgba(255,255,255,0.25)',
          borderTopColor: color,
          borderRadius: '50%',
        }}
      />
      {label && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>}
    </span>
  );
};

export default Spinner;