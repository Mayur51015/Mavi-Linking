import React from 'react';

/** Base shimmer block. Reuses the existing `.skeleton` class from index.css. */
export const Skeleton = ({ width = '100%', height = '1rem', radius = 'var(--radius-md)', style = {} }) => (
  <div
    className="skeleton"
    role="status"
    aria-label="Loading"
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

/** A few lines of shimmering text placeholders. */
export const SkeletonText = ({ lines = 1, lastLineWidth = '60%' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} role="status" aria-label="Loading text">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="0.9rem" width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'} />
    ))}
  </div>
);

/** A circular placeholder, e.g. for avatars. */
export const SkeletonCircle = ({ size = '48px' }) => (
  <Skeleton width={size} height={size} radius="50%" />
);

/** A card-shaped placeholder that mirrors `.glass-card` so real content doesn't shift layout on load. */
export const SkeletonCard = ({ lines = 3, showAvatar = false, height }) => (
  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height }}>
    {showAvatar && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <SkeletonCircle size="44px" />
        <div style={{ flex: 1 }}><SkeletonText lines={2} /></div>
      </div>
    )}
    <SkeletonText lines={lines} />
  </div>
);

/** A grid of SkeletonCards, for listing pages (projects, search results, etc). */
export const SkeletonGrid = ({ count = 3, columns = 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', cardProps = {} }) => (  <div style={{ display: 'grid', gridTemplateColumns: columns, gap: '1.5rem' }}>
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} {...cardProps} />)}
  </div>
);

export default Skeleton;