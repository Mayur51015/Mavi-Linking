import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import api from '../api/axios';

const RecentActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ai/activities');
        const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setActivities(list.slice(0, 5));
      } catch (err) {
        console.warn('Failed to load recent activities:', err.message);
        // Fallback default activities if empty
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const getDotColor = (type, title = '') => {
    const lower = `${type || ''} ${title || ''}`.toLowerCase();
    if (lower.includes('github') || lower.includes('sync')) return '#22C55E'; // green
    if (lower.includes('apply') || lower.includes('application')) return '#3B82F6'; // blue
    if (lower.includes('profile') || lower.includes('dna') || lower.includes('ai')) return '#8B5CF6'; // purple
    if (lower.includes('internship') || lower.includes('job')) return '#06B6D4'; // cyan
    return '#3B82F6';
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const defaultActivities = [
    { id: '1', title: 'GitHub profile synced', type: 'github', date: new Date(Date.now() - 1000 * 60 * 35) },
    { id: '2', title: 'Profile skills updated', type: 'profile', date: new Date(Date.now() - 1000 * 60 * 60 * 3) },
    { id: '3', title: 'Application submitted for Frontend Role', type: 'application', date: new Date(Date.now() - 1000 * 60 * 60 * 26) },
    { id: '4', title: 'New internship posted in Zeal Portal', type: 'internship', date: new Date(Date.now() - 1000 * 60 * 60 * 48) },
  ];

  const displayList = activities.length > 0 ? activities : defaultActivities;

  return (
    <div
      style={{
        background: '#15191E',
        border: '1px solid #262C33',
        borderRadius: '10px',
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: '#172554',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}
          >
            <Activity size={15} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#F5F7FA', fontFamily: 'Inter, sans-serif' }}>
            Recent Activity
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>
          Live Stream
        </span>
      </div>

      {/* Feed List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem 0' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '32px', background: '#1C2229', borderRadius: '6px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {displayList.map((item, index) => {
            const dotColor = getDotColor(item.type, item.title || item.action || item.description);
            const title = item.title || item.action || item.description || 'System event recorded';
            const timeAgo = formatTimeAgo(item.date || item.createdAt || item.timestamp);

            return (
              <div
                key={item._id || item.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.35rem 0',
                  borderBottom: index < displayList.length - 1 ? '1px solid #1C2229' : 'none',
                }}
              >
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: dotColor,
                    marginTop: '0.35rem',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: '#F5F7FA',
                      fontWeight: 500,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={10} /> {timeAgo}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivityFeed;
