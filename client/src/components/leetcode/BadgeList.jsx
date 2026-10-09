import React from 'react';
import { Award } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const BadgeList = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return (
      <EmptyState
        icon={<Award size={28} color="#D97706" />}
        iconColor="#D97706"
        title="No LeetCode badges yet"
        description="Solve problems and participate in LeetCode contests to earn badges that will appear here."
        size="sm"
      />
    );
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '1.25rem 1.4rem',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
              flexShrink: 0,
            }}
          >
            <Award size={16} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 700,
              color: '#111111',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Earned Badges
          </h3>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#4B5563',
            background: '#F3F4F6',
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            border: '1px solid #E5E7EB',
          }}
        >
          {badges.length} {badges.length === 1 ? 'Badge' : 'Badges'}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {badges.map((badge, idx) => {
          const iconUrl = badge.icon
            ? (badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`)
            : null;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#F8F9FA',
                border: '1px solid #E5E7EB',
                padding: '0.85rem 0.75rem',
                borderRadius: '8px',
                minWidth: '105px',
                flex: '1 0 calc(25% - 0.75rem)',
                maxWidth: '135px',
                textAlign: 'center',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={badge.displayName || badge.name}
                  style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                />
              ) : (
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                  }}
                >
                  <Award size={24} />
                </div>
              )}
              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#111111',
                  fontWeight: 600,
                  lineHeight: 1.25,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {badge.displayName || badge.name || 'LeetCode Badge'}
              </span>
              {badge.category && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: '#6B7280',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    padding: '0.1rem 0.35rem',
                    fontWeight: 500,
                  }}
                >
                  {badge.category}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeList;
