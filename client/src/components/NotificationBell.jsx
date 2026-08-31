import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { NOTIFICATION_TYPES } from '../constants/placementConstants';
import { useNotifications } from '../context/NotificationContext';

/**
 * NotificationBell — dropdown notification center for all layouts.
 * Uses React Portal to render the dropdown at document body level,
 * escaping any container overflow or stacking contexts.
 */
const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        bellRef.current &&
        !bellRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on scroll / resize
  useEffect(() => {
    if (!open) return;
    const handleClose = () => setOpen(false);
    window.addEventListener('resize', handleClose);
    return () => window.removeEventListener('resize', handleClose);
  }, [open]);

  const handleOpen = () => {
    if (!open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
      fetchNotifications({ page: 1, limit: 10 });
    }
    setOpen(!open);
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n._id);
    }
    const destination = n.link || n.metadata?.link;
    if (destination) {
      setOpen(false);
      if (destination.startsWith('http')) {
        window.open(destination, '_blank', 'noopener,noreferrer');
      } else {
        navigate(destination);
      }
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/dashboard/notifications');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Preview latest 8 notifications
  const previewList = notifications.slice(0, 8);

  const dropdown = open
    ? ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            right: `${dropdownPos.right}px`,
            width: '380px',
            maxHeight: '520px',
            background: 'var(--bg-secondary, #18181b)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            borderRadius: 'var(--radius-lg, 14px)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.875rem 1.25rem',
              borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              background: 'rgba(18, 18, 28, 0.85)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--accent-purple, #8b5cf6)',
                    color: 'white',
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan, #06b6d4)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '360px' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading notifications...
              </div>
            ) : previewList.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>No notifications yet</p>
              </div>
            ) : (
              previewList.map((n) => {
                const typeConfig = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.general;
                const dotColor = typeConfig.color || 'var(--accent-purple)';

                return (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.05))',
                      cursor: 'pointer',
                      background: n.isRead ? 'transparent' : 'rgba(139, 92, 246, 0.04)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = n.isRead
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(139, 92, 246, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = n.isRead
                        ? 'transparent'
                        : 'rgba(139, 92, 246, 0.04)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: n.isRead ? 'rgba(255, 255, 255, 0.2)' : dotColor,
                              boxShadow: n.isRead ? 'none' : `0 0 6px ${dotColor}`,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontWeight: n.isRead ? '500' : '600',
                              fontSize: '0.85rem',
                              color: n.isRead ? 'var(--text-secondary)' : 'white',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {n.title}
                          </span>
                        </div>
                        <p
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.78rem',
                            margin: 0,
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {n.message}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link to Dedicated Page */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              background: 'rgba(18, 18, 28, 0.95)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={handleViewAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-purple, #8b5cf6)',
                fontSize: '0.825rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#c084fc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--accent-purple, #8b5cf6)'; }}
            >
              <span>View All Notifications</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          background: open ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '8px',
          color: open ? 'var(--accent-purple)' : 'var(--text-secondary)',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = 'var(--text-secondary)'; }}
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '999px',
              background: 'var(--accent-red, #ef4444)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {dropdown}
    </div>
  );
};

export default NotificationBell;
