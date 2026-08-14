import { Trophy, Medal } from 'lucide-react';
import { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import EmptyState from './ui/EmptyState';
import { SkeletonCard } from './ui/Skeleton';

const renderMedalBadge = (medal) => {
  if (medal === 'GOLD') {
    return (
      <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid #fbbf24', fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
        🥇 Gold
      </span>
    );
  }
  if (medal === 'SILVER') {
    return (
      <span className="badge" style={{ background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: '1px solid #9ca3af', fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
        🥈 Silver
      </span>
    );
  }
  if (medal === 'BRONZE') {
    return (
      <span className="badge" style={{ background: 'rgba(180, 83, 9, 0.15)', color: '#f59e0b', border: '1px solid #b45309', fontSize: '0.75rem', padding: '0.15rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
        🥉 Bronze
      </span>
    );
  }
  return null;
};

const getScoreTierColor = (scoreTier) => {
  switch (scoreTier) {
    case 'Exceptional': return '#ec4899';
    case 'Expert': return '#a855f7';
    case 'Advanced': return '#38bdf8';
    case 'Intermediate': return '#34d399';
    case 'Developing': return '#fbbf24';
    case 'Beginner': return '#9ca3af';
    default: return '#9ca3af';
  }
};

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
            const userObj = item.user || item.userId || {};
            const rank = item.rank || (index + 1);
            const medal = item.medal || (rank === 1 ? 'GOLD' : rank === 2 ? 'SILVER' : rank === 3 ? 'BRONZE' : null);
            const scoreTier = item.scoreTier || item.tier || 'Beginner';
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: rank <= 3 ? '#fbbf24' : 'var(--text-secondary)', width: '24px', textAlign: 'center' }}>
                    #{rank}
                  </span>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isSelf ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', color: 'white' }}>
                    {userObj.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: isSelf ? 'var(--accent-purple)' : 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span>{userObj.name || 'Developer'}</span>
                      {userObj.maviId && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          ({userObj.maviId})
                        </span>
                      )}
                      {isSelf && <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>You</span>}
                      {renderMedalBadge(medal)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: getScoreTierColor(scoreTier), fontWeight: '600', marginTop: '0.1rem' }}>
                      Tier: {scoreTier}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-cyan)', fontSize: '1rem' }}>{item.score || 0}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeaderboardWidget;
