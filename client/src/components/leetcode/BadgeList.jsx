import React from 'react';
import { Award } from 'lucide-react';

const BadgeList = ({ badges }) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={20} color="var(--accent-gold)" />
        Earned Badges
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {badges.map((badge, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', minWidth: '100px' }}>
            {badge.icon.startsWith('/') ? (
              <img src={`https://leetcode.com${badge.icon}`} alt={badge.displayName} style={{ width: '48px', height: '48px' }} />
            ) : (
              <img src={badge.icon} alt={badge.displayName} style={{ width: '48px', height: '48px' }} />
            )}
            <span style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{badge.displayName || badge.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeList;
