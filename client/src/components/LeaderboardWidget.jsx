import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import EmptyState from './ui/EmptyState';

const LeaderboardWidget = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    api.get('/ai/ranking/leaderboard')
      .then(res => setLeaderboard(res.data.data))
      .catch(console.error);
  }, []);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Elite Developer': return 'var(--accent-purple)';
      case 'Gold': return '#fbbf24';
      case 'Silver': return '#9ca3af';
      case 'Bronze': return '#b45309';
      default: return '#fff';
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Trophy size={24} color="#fbbf24" />
        Global Leaderboard
      </h3>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
        {leaderboard.length === 0 ? (
          <EmptyState
            icon={<Trophy size={26} color="var(--accent-amber)" />}
            iconColor="var(--accent-amber)"
            title="Leaderboard is empty"
            description="Rankings appear once developers sync their profiles and generate their AI DNA score."
            size="sm"
            style={{ height: '100%', minHeight: '200px' }}
          />
        ) : (
          leaderboard.map((user, index) => (
            <div
              key={user._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: 'rgba(255,255,255,0.02)',
                marginBottom: '0.5rem',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: index < 3 ? '#fbbf24' : 'var(--text-secondary)', width: '20px' }}>
                  {index + 1}
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user.userId?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'white' }}>{user.userId?.name || 'Unknown User'}</div>
                  <div style={{ fontSize: '0.8rem', color: getTierColor(user.tier) }}>{user.tier}</div>
                </div>
              </div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{user.score}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
