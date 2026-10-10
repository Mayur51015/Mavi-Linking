import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
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
import RoleBasedDashboardLayout from '../components/shell/RoleBasedDashboardLayout';
import { useNotifications } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import { getUserPrimaryRole, getRoleDisplayInfo, getRoleCategoryTabs } from '../utils/roleRouting';


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
  const { user } = useContext(AuthContext);
  const userRole = getUserPrimaryRole(user);
  const roleDisplay = getRoleDisplayInfo(user);

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

  // Role-scoped category tabs
  const categoryTabs = useMemo(() => {
    const rawTabs = getRoleCategoryTabs(userRole);
    return rawTabs.map((tab) => {
      let icon = <Filter size={15} />;
      if (tab.id === 'unread') icon = <Bell size={15} />;
      else if (tab.id === 'account') icon = <ShieldCheck size={15} />;
      else if (tab.id === 'institution') icon = <Building2 size={15} />;
      else if (tab.id === 'career') icon = <Compass size={15} />;
      else if (tab.id === 'platform') icon = <GitBranch size={15} />;
      else if (tab.id === 'placement') icon = <Briefcase size={15} />;
      else if (tab.id === 'system') icon = <Info size={15} />;
      return { ...tab, icon };
    });
  }, [userRole]);

  // Role-tailored subtitle
  const subtitle = useMemo(() => {
    switch (userRole) {
      case 'owner':
        return 'Platform-wide security events, institutional tenant alerts, licensing, and system audit logs.';
      case 'super_admin':
        return 'Multi-tenant alerts, institution verifications, license allocations, and governance notifications.';
      case 'institution_admin':
        return 'Institution operations, faculty and department updates, placement drives, and compliance notices.';
      case 'department_admin':
        return 'Department verifications, student approvals, drive participation, and academic notices.';
      case 'teacher':
        return 'Student verification requests, placement drive updates, department notices, and student readiness alerts.';
      case 'recruiter':
        return 'Candidate job applications, shortlisted talent, interview requests, and placement drive schedules.';
      case 'student':
      default:
        return 'Stay updated with your applications, drive invitations, career milestones, and verified credentials.';
    }
  }, [userRole]);

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
    <RoleBasedDashboardLayout>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
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
              <span
                className={`badge ${roleDisplay.badgeColor || 'badge-primary'}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                }}
              >
                {roleDisplay.badgeLabel}
              </span>
              {unreadCount > 0 && (
                <span
                  className="badge badge-primary"
                  style={{
                    background: 'var(--brand-blue, #2563EB)',
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
              {subtitle}
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
                <CheckCheck size={16} style={{ color: 'var(--brand-blue, #2563EB)' }} />
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
                borderColor: 'var(--border-color)',
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
            background: 'var(--bg-card, #FFFFFF)',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--border-color, #E5E7EB)',
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
                borderRadius: 'var(--radius-sm, 6px)',
                background: 'var(--bg-input, #FFFFFF)',
                border: '1px solid var(--border-color, #E5E7EB)',
                color: 'var(--text-primary)',
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
            {categoryTabs.map((tab) => {
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
                      ? 'var(--brand-blue-light, #EFF6FF)'
                      : 'var(--bg-card, #FFFFFF)',
                    color: isActive ? 'var(--brand-blue, #2563EB)' : 'var(--text-secondary)',
                    border: isActive
                      ? '1px solid var(--brand-blue, #2563EB)'
                      : '1px solid var(--border-color, #E5E7EB)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
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
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
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
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-color)',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--brand-blue-light, #EFF6FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--brand-blue, #2563EB)',
              }}
            >
              <BellOff size={28} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: '600' }}>
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
                          borderRadius: 'var(--radius-md, 8px)',
                          background: item.isRead
                            ? 'var(--bg-card, #FFFFFF)'
                            : 'var(--bg-subtle, #F8F9FA)',
                          border: item.isRead
                            ? '1px solid var(--border-color, #E5E7EB)'
                            : '1px solid var(--border-hover, #D1D5DB)',
                          boxShadow: 'none',
                          cursor: hasLink || !item.isRead ? 'pointer' : 'default',
                          transition: 'border-color 0.15s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--brand-blue, #2563EB)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = item.isRead
                            ? 'var(--border-color, #E5E7EB)'
                            : 'var(--border-hover, #D1D5DB)';
                        }}
                      >
                        {/* Category Icon */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
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
                                    background: 'var(--brand-blue, #2563EB)',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              <h4
                                style={{
                                  fontSize: '0.925rem',
                                  fontWeight: item.isRead ? '500' : '600',
                                  color: item.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
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
                                color: 'var(--brand-blue, #2563EB)',
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
    </RoleBasedDashboardLayout>
  );
};

export default Notifications;
