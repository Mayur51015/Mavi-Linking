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

  useEffect(() => {
    let cancelled = false;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = userId ? { params: { userId } } : {};
        const response = await api.get('/career/timeline', config);

        if (!cancelled) {
          const data = response.data?.data || [];
          setEvents(Array.isArray(data) ? data : []);
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
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTimeline();

    return () => {
      cancelled = true;
    };
  }, [userId]);

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
    </div>
  );
};

export default TimelineWidget;
