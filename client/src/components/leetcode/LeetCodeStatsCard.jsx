import React from 'react';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';

const LeetCodeStatsCard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" alt="LeetCode" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} />
        LeetCode Overview
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <Trophy size={16} color="var(--accent-gold, #fbbf24)" />
            <span>Global Ranking</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.ranking ? `#${data.ranking.toLocaleString()}` : 'N/A'}</div>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} color="var(--accent-blue, #3b82f6)" />
            <span>Contest Rating</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.contestRating ? Math.round(data.contestRating) : 'N/A'}</div>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <Star size={16} color="var(--accent-purple, #8b5cf6)" />
            <span>Reputation</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.reputation || 0}</div>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <Award size={16} color="var(--accent-green, #10b981)" />
            <span>Total Solved</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.totalSolved || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default LeetCodeStatsCard;
