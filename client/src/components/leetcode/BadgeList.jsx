import React from 'react';
import { Award } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const BadgeList = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return (
      <EmptyState
        icon={<Award size={28} color="var(--accent-amber)" />}
        iconColor="var(--accent-amber)"
        title="No LeetCode badges yet"
        description="Keep solving problems and participating in LeetCode contests to earn badges that will appear here."
        size="sm"
      />
    );
  }

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={20} color="var(--accent-gold)" />
        Earned Badges
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {badges.map((badge, idx) => {
          const iconUrl = badge.icon
            ? (badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`)
            : null;

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', minWidth: '110px', flex: '1 0 calc(25% - 1rem)', maxWidth: '140px' }}>
              {iconUrl ? (
                <img src={iconUrl} alt={badge.displayName || badge.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              ) : (
                <Award size={48} color="#fbbf24" />
              )}
              <span style={{ fontSize: '0.8rem', textAlign: 'center', color: 'white', fontWeight: '600' }}>{badge.displayName || badge.name || 'LeetCode Badge'}</span>
              {badge.category && (
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{badge.category}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeList;
