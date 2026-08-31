import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CheckCheck,
  Search,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Building2,
  Compass,
  GitBranch,
  Briefcase,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
  Filter,
  RotateCw,
} from 'lucide-react';
import UserLayout from '../layouts/UserLayout';
import { useNotifications } from '../context/NotificationContext';

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: <Filter size={15} /> },
  { id: 'unread', label: 'Unread', icon: <Bell size={15} /> },
  { id: 'account', label: 'Account', icon: <ShieldCheck size={15} /> },
  { id: 'institution', label: 'Institution', icon: <Building2 size={15} /> },
  { id: 'career', label: 'Career', icon: <Compass size={15} /> },
  { id: 'platform', label: 'Platform', icon: <GitBranch size={15} /> },
  { id: 'placement', label: 'Placement', icon: <Briefcase size={15} /> },
  { id: 'system', label: 'System', icon: <Info size={15} /> },
];

const getCategoryIcon = (category, type) => {
  switch (category) {
    case 'account':
      return { icon: <ShieldCheck size={18} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    case 'institution':
      return { icon: <Building2 size={18} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    case 'career':
      return { icon: <Compass size={18} />, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
    case 'platform':
      return { icon: <GitBranch size={18} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    case 'placement':
      return { icon: <Briefcase size={18} />, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' };
    case 'system':
      return { icon: <Sparkles size={18} />, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
    default:
      return { icon: <Bell size={18} />, color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.15)' };
  }
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDateGroup = (dateStr) => {
  if (!dateStr) return 'Earlier';
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfWeek = startOfToday - 6 * 86400000;
  const timestamp = d.getTime();

  if (timestamp >= startOfToday) return 'Today';
  if (timestamp >= startOfYesterday) return 'Yesterday';
  if (timestamp >= startOfWeek) return 'This Week';
  return 'Earlier';
};

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch when tab, search, or page changes
  const loadData = useCallback(
    (targetPage = 1, append = false) => {
      fetchNotifications({
        page: targetPage,
        limit: 20,
        category: activeTab === 'unread' ? 'all' : activeTab,
        unreadOnly: activeTab === 'unread',
        search: debouncedSearch,
        append,
      });
    },
    [activeTab, debouncedSearch, fetchNotifications]
  );

  useEffect(() => {
    setPage(1);
    loadData(1, false);
  }, [activeTab, debouncedSearch, loadData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleLoadMore = () => {
    if (page < pagination.pages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage, true);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    const destination = notification.link || notification.metadata?.link;
    if (destination) {
      if (destination.startsWith('http')) {
        window.open(destination, '_blank', 'noopener,noreferrer');
      } else {
        navigate(destination);
      }
    }
  };

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Earlier: [],
    };

    notifications.forEach((item) => {
      const groupKey = getDateGroup(item.createdAt);
      if (groups[groupKey]) {
        groups[groupKey].push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [notifications]);

  return (
    <UserLayout>
      <div className="notifications-container" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                }}
              >
                <Bell size={20} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', margin: 0 }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span
                  className="badge badge-primary"
                  style={{
                    background: 'var(--accent-purple)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Stay updated with your account, career progress, platform activity, and important MAVI updates.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  padding: '0.5rem 0.9rem',
                }}
              >
                <CheckCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>Mark all as read</span>
              </button>
            )}
            <button
              onClick={clearRead}
              className="btn btn-outline"
              title="Clear read notifications"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                padding: '0.5rem 0.9rem',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <Trash2 size={15} />
              <span className="hide-mobile">Clear read</span>
            </button>
          </div>
        </div>

        {/* Controls: Category Filter Tabs & Search Bar */}
        <div
          style={{
            background: 'var(--bg-card, rgba(24, 24, 27, 0.7))',
            borderRadius: '16px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search notifications by title or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 1rem 0.625rem 2.5rem',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
            }}
          >
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? '600' : '400',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(236, 72, 153, 0.25) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: isActive
                      ? '1px solid var(--accent-purple)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        {loading && notifications.length === 0 ? (
          /* Skeleton Loading State */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: '84px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
            }}
          >
            <AlertCircle size={44} style={{ color: 'var(--accent-red, #ef4444)', margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Unable to load notifications
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {error}
            </p>
            <button
              onClick={() => loadData(1, false)}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
            >
              <RotateCw size={16} /> Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div
            style={{
              padding: '4rem 1.5rem',
              textAlign: 'center',
              background: 'var(--bg-card, rgba(24, 24, 27, 0.5))',
              border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.1))',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--accent-purple)',
              }}
            >
              <BellOff size={28} />
            </div>
            <h3 style={{ color: 'white', fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              You're all caught up!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
              {debouncedSearch
                ? `No notifications found matching "${debouncedSearch}".`
                : activeTab === 'unread'
                ? "You don't have any unread notifications."
                : "You don't have any notifications in this section yet."}
            </p>
          </div>
        ) : (
          /* Notifications List Grouped by Date */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {groupedNotifications.map(([groupName, items]) => (
              <div key={groupName}>
                {/* Date Group Heading */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.75rem',
                    paddingLeft: '0.5rem',
                  }}
                >
                  <Calendar size={13} />
                  <span>{groupName}</span>
                </div>

                {/* Notification Cards in Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {items.map((item) => {
                    const { icon, color, bg } = getCategoryIcon(item.category, item.type);
                    const hasLink = Boolean(item.link || item.metadata?.link);

                    return (
                      <div
                        key={item._id}
                        onClick={() => handleNotificationClick(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          padding: '1rem 1.25rem',
                          borderRadius: '12px',
                          background: item.isRead
                            ? 'rgba(255, 255, 255, 0.02)'
                            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(24, 24, 27, 0.9) 100%)',
                          border: item.isRead
                            ? '1px solid rgba(255, 255, 255, 0.04)'
                            : '1px solid rgba(139, 92, 246, 0.25)',
                          boxShadow: item.isRead
                            ? 'none'
                            : '0 4px 20px rgba(139, 92, 246, 0.05)',
                          cursor: hasLink || !item.isRead ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = item.isRead
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(139, 92, 246, 0.25)';
                        }}
                      >
                        {/* Category Icon */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: bg,
                            color: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '0.1rem',
                          }}
                        >
                          {icon}
                        </div>

                        {/* Text Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              {!item.isRead && (
                                <span
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: 'var(--accent-cyan, #06b6d4)',
                                    boxShadow: '0 0 8px #06b6d4',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              <h4
                                style={{
                                  fontSize: '0.925rem',
                                  fontWeight: item.isRead ? '500' : '600',
                                  color: item.isRead ? 'var(--text-secondary)' : 'white',
                                  margin: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.title}
                              </h4>
                            </div>

                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>

                          <p
                            style={{
                              color: item.isRead ? 'var(--text-muted)' : 'var(--text-secondary)',
                              fontSize: '0.825rem',
                              lineHeight: 1.45,
                              margin: 0,
                            }}
                          >
                            {item.message}
                          </p>

                          {hasLink && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: 'var(--accent-purple)',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                marginTop: '0.4rem',
                              }}
                            >
                              <span>View details</span>
                              <ExternalLink size={12} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {pagination.page < pagination.pages && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.85rem',
                  }}
                >
                  {loading ? 'Loading...' : 'Load more notifications'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Notifications;
