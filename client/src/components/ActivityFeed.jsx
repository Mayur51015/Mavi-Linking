import { AnimatePresence, motion } from 'framer-motion';
import { Activity as ActivityIcon, Code2, GitBranch, FileText, Award, User, Milestone } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import EmptyState from './ui/EmptyState';
import { SkeletonCard } from './ui/Skeleton';

const getActivityIcon = (type, platform) => {
  if (platform === 'leetcode' || type === 'LeetCode') return <Code2 size={16} color="var(--accent-amber)" />;
  if (platform === 'github' || type === 'Commit' || type === 'Repository') return <GitBranch size={16} color="var(--accent-purple)" />;
  if (type === 'Document') return <FileText size={16} color="var(--accent-cyan)" />;
  if (type === 'Certificate' || type === 'Milestone') return <Award size={16} color="#fbbf24" />;
  if (type === 'Profile') return <User size={16} color="var(--accent-blue)" />;
  return <ActivityIcon size={16} color="var(--accent-emerald)" />;
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

const ActivityFeed = () => {
  const { user, socket } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    api.get('/ai/activities')
      .then(res => {
        setActivities(res.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity) => {
      setActivities(prev => {
        // Deduplicate identical items in memory
        const exists = prev.some(a => a._id === activity._id || (a.title === activity.title && a.description === activity.description && Math.abs(new Date(a.date) - new Date(activity.date)) < 60000));
        if (exists) return prev;
        return [activity, ...prev].slice(0, 50);
      });
    };

    socket.on('new_activity', handleNewActivity);

    return () => {
      socket.off('new_activity', handleNewActivity);
    };
  }, [socket]);

  return (
    <div className="glass-card" style={{ padding: '2rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ActivityIcon size={24} color="#10b981" />
        Real-time Activity Feed
      </h3>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <SkeletonCard lines={2} height="60px" />
            <SkeletonCard lines={2} height="60px" />
            <SkeletonCard lines={2} height="60px" />
          </div>
        ) : (
          <AnimatePresence style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.length === 0 ? (
              <EmptyState
                icon={<ActivityIcon size={26} color="var(--accent-emerald)" />}
                iconColor="var(--accent-emerald)"
                title="No activity yet"
                description="Your feed will populate in real-time as you commit code, solve LeetCode problems, and update your profile."
                size="sm"
                style={{ height: '100%', minHeight: '200px' }}
              />
            ) : (
              activities.map((act) => (
                <motion.div
                  key={act._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    marginBottom: '0.75rem',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ marginTop: '0.2rem', padding: '0.35rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    {getActivityIcon(act.type, act.platform)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                      <strong style={{ color: 'white', fontSize: '0.9rem' }}>{act.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }} title={new Date(act.date).toLocaleString()}>
                        {formatRelativeTime(act.date)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{act.description}</div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
