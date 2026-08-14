import { Trophy } from 'lucide-react';
import { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import EmptyState from './ui/EmptyState';
import { SkeletonCard } from './ui/Skeleton';

const LeaderboardWidget = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/ai/ranking/leaderboard')
      .then(res => {
        setLeaderboard(res.data.data || []);
        setError(false);
      })
      .catch(err => {
        console.error('Failed to load leaderboard:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Elite Developer': return 'var(--accent-purple)';
      case 'Diamond': return '#38bdf8';
      case 'Platinum': return '#a855f7';
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
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <SkeletonCard lines={2} height="55px" />
            <SkeletonCard lines={2} height="55px" />
            <SkeletonCard lines={2} height="55px" />
          </div>
        ) : error ? (
          <EmptyState
            icon={<Trophy size={26} color="var(--accent-red)" />}
            iconColor="var(--accent-red)"
            title="Unable to load leaderboard"
            description="Failed to fetch global developer rankings. Please check your network connection."
            size="sm"
            style={{ height: '100%', minHeight: '200px' }}
          />
        ) : leaderboard.length === 0 ? (
          <EmptyState
            icon={<Trophy size={26} color="var(--accent-amber)" />}
            iconColor="var(--accent-amber)"
            title="Leaderboard is empty"
            description="Rankings appear once developers sync their profiles and generate their AI DNA score."
            size="sm"
            style={{ height: '100%', minHeight: '200px' }}
          />
        ) : (
          leaderboard.map((item, index) => {
            const userObj = item.userId || {};
            const isSelf = currentUser && (userObj._id === currentUser._id || userObj.maviId === currentUser.maviId);

            return (
              <div
                key={item._id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: isSelf ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: isSelf ? '1px solid var(--accent-purple)' : '1px solid transparent',
                  marginBottom: '0.5rem',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: index < 3 ? '#fbbf24' : 'var(--text-secondary)', width: '22px', textAlign: 'center' }}>
                    {index + 1}
                  </span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isSelf ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {userObj.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: isSelf ? 'var(--accent-purple)' : 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{userObj.name || 'Developer'}</span>
                      {userObj.maviId && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          ({userObj.maviId})
                        </span>
                      )}
                      {isSelf && <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>You</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: getTierColor(item.tier), fontWeight: '600' }}>{item.tier || 'Developer'}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>{item.score || 0}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
