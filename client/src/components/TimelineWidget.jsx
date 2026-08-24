import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import {
  Calendar,
  Briefcase,
  FileText,
  Code2,
  GitMerge,
  GitPullRequest,
  FolderGit2,
  CheckCircle,
  Award,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const iconMap = {
  PROJECT: <Briefcase size={20} />,
  DOCUMENT: <FileText size={20} />,
  GITHUB: <GitMerge size={20} />,
  LEETCODE: <Code2 size={20} />,
  BADGE: <Award size={20} />,
  ACCOUNT: <CheckCircle size={20} />,
  CERTIFICATE: <FileText size={20} />,
  ACHIEVEMENT: <Award size={20} />,
  COMMIT: <GitMerge size={20} />,
  'PULL REQUEST': <GitPullRequest size={20} />,
  REPOSITORY: <FolderGit2 size={20} />,
};

const TimelineWidget = ({ userId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);
        setPage(1);

        const params = {
          page: 1,
          limit: 20,
          type: typeFilter,
          range: dateFilter,
        };

        if (userId) params.userId = userId;

        const response = await api.get('/career/timeline', { params });

        if (!cancelled) {
          const data = response.data?.data || [];
          setEvents(Array.isArray(data) ? data : []);
          setHasMore(response.data?.pagination?.hasMore || false);
        }
      } catch (err) {
        console.error('Failed to fetch developer timeline:', err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              'Unable to load developer activity timeline.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTimeline();

    return () => {
      cancelled = true;
    };
  }, [userId, typeFilter, dateFilter]);

  if (loading) {
    return (
      <div
        className="glass-card"
        style={{
          minHeight: '300px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: '30px',
            height: '30px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--accent-blue)',
            borderRadius: '50%',
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="glass-card"
        style={{
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text-muted)',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <AlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.6 }} />
        <p style={{ color: 'var(--text-primary)' }}>
          Unable to load activity timeline.
        </p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text-muted)',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <Calendar size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p>No developer activity yet.</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
          GitHub, LeetCode, projects and profile activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        maxHeight: '600px',
        overflowY: 'auto',
        padding: '1.5rem',
      }}
    >
      <h3
        style={{
          fontSize: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Calendar size={24} color="var(--accent-blue)" />
        Developer Activity
      </h3>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-dark)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="all">All Activities</option>
          <option value="commits">Commits</option>
          <option value="pull_requests">Pull Requests</option>
          <option value="issues">Issues</option>
          <option value="repositories">Repositories</option>
          <option value="releases">Releases</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-dark)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="3months">Last 3 Months</option>
        </select>
      </div>

      <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '7px',
            width: '2px',
            background:
              'linear-gradient(to bottom, var(--accent-blue), var(--accent-purple), transparent)',
            opacity: 0.3,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {events.map((event, index) => {
            const icon =
              iconMap[event.type] ||
              iconMap[event.type?.toUpperCase()] || (
                <CheckCircle size={20} />
              );

            return (
              <motion.div
                key={`${event._id}-${index}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                style={{ position: 'relative' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.5rem',
                    top: '0.35rem',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--bg-card)',
                    border: '2px solid var(--accent-blue)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--accent-blue)',
                    }}
                  />
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginLeft: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                    }}
                  >
                    <div
                      style={{
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
                        padding: '0.5rem',
                        background: 'var(--bg-dark)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-blue)',
                      }}
                    >
                      {icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <h4
                          style={{
                            flex: 1,
                            minWidth: 0,
                            overflowWrap: 'anywhere',
                            fontWeight: '600',
                            fontSize: '1rem',
                            margin: 0,
                          }}
                        >
                          {event.title}
                        </h4>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {new Date(event.timestamp).toLocaleDateString(
                            undefined,
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      </div>

                      {event.description && (
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                            margin: '0.25rem 0 0',
                          }}
                        >
                          {event.description}
                        </p>
                      )}

                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            marginTop: '0.5rem',
                            fontSize: '0.8rem',
                            color: 'var(--accent-blue)',
                            textDecoration: 'none',
                          }}
                        >
                          View activity
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {hasMore && (
        <button
          onClick={async () => {
            try {
              setLoadingMore(true);

              const nextPage = page + 1;
              const params = {
                page: nextPage,
                limit: 20,
                type: typeFilter,
                range: dateFilter,
              };

              if (userId) params.userId = userId;

              const response = await api.get('/career/timeline', { params });
              const data = response.data?.data || [];

              setEvents((prev) => [...prev, ...data]);
              setPage(nextPage);
              setHasMore(response.data?.pagination?.hasMore || false);
            } catch (err) {
              setError(
                err.response?.data?.message ||
                  'Unable to load more activity.'
              );
            } finally {
              setLoadingMore(false);
            }
          }}
          disabled={loadingMore}
          style={{
            display: 'block',
            margin: '1.5rem auto 0',
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-dark)',
            color: 'var(--text-primary)',
            cursor: loadingMore ? 'wait' : 'pointer',
          }}
        >
          {loadingMore ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default TimelineWidget;
