import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Terminal,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Search,
  Settings,
  Edit2,
  ExternalLink,
  Shield,
  BadgeCheck,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Sparkles,
  Command,
  HelpCircle,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from '../NotificationBell';
import ThemeToggle from '../ThemeToggle';
import VerificationStatusBanner from '../VerificationStatusBanner';
import VerificationModal from '../VerificationModal';

/**
 * AppShell — Enterprise B2B SaaS Application Shell
 * Standardized across all roles: Student, Teacher, Recruiter, Admin, Super Admin, Platform Owner
 */
const AppShell = ({
  children,
  title,
  navItems = [],
  quickActions = [],
  roleBadge = null,
}) => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('mavi_sidebar_collapsed') === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchModalOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchModalOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('mavi_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const publicUsername = user?.username || user?.platforms?.github?.username;
  const maviIdDisplay = user?.maviId || (user?._id ? `MAVI-${user._id.slice(-8).toUpperCase()}` : '');

  // Filter navigation items for search palette
  const filteredNavItems = searchQuery.trim()
    ? navItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : navItems.slice(0, 8);

  const getEffectiveRoleBadge = () => {
    if (roleBadge) return roleBadge;
    switch (user?.role) {
      case 'platform_owner':
      case 'owner':
        return { label: 'Platform Owner', color: 'badge-purple' };
      case 'super_admin':
        return { label: 'Super Admin', color: 'badge-purple' };
      case 'institution_admin':
      case 'admin':
        return { label: 'Institution Admin', color: 'badge-primary' };
      case 'department_admin':
        return { label: 'Department Admin', color: 'badge-cyan' };
      case 'teacher':
      case 'professor':
        return { label: 'Teacher', color: 'badge-emerald' };
      case 'recruiter':
        return { label: 'Recruiter', color: 'badge-amber' };
      default:
        return { label: 'Student', color: 'badge-primary' };
    }
  };

  const currentRole = getEffectiveRoleBadge();

  return (
    <div className="dashboard-shell" style={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        style={{
          display: sidebarOpen ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 90,
        }}
      />

      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}
        style={{
          width: collapsed ? '76px' : '260px',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          padding: '1.25rem 0.85rem',
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            marginBottom: '1.5rem',
            padding: '0 0.5rem',
            minHeight: '36px',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <Terminal size={18} />
            </div>
            {!collapsed && (
              <span
                style={{
                  fontFamily: 'Outfit, Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                MAVI <span style={{ color: 'var(--brand-blue)', fontWeight: 600 }}>Linking</span>
              </span>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapsed}
            className="hide-mobile"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '6px',
              display: collapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <PanelLeftClose size={18} />
          </button>

          {/* Mobile Close Button */}
          <button
            className="mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            style={{ display: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Identity Mini Card (when expanded) */}
        {!collapsed && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--brand-blue-light)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--brand-blue)',
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</span>
                {user?.isVerified && <BadgeCheck size={14} style={{ color: 'var(--brand-blue)', flexShrink: 0 }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                <span className={`badge ${currentRole.color}`} style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>
                  {currentRole.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation List — Grouped by ERP Category */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            flex: 1,
            overflowY: 'auto',
            paddingRight: '2px',
          }}
        >
          {(() => {
            // Group items by category (preserving insertion order)
            const groups = [];
            const groupMap = new Map();

            navItems.forEach((item) => {
              const cat = item.category || 'General';
              if (!groupMap.has(cat)) {
                const groupObj = { category: cat, items: [] };
                groupMap.set(cat, groupObj);
                groups.push(groupObj);
              }
              groupMap.get(cat).items.push(item);
            });

            return groups.map((group, groupIdx) => (
              <div key={group.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {/* Category Header (shown when expanded, except single default group) */}
                {!collapsed && (
                  <div
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '0.65rem 0.5rem 0.25rem 0.5rem',
                      marginTop: groupIdx > 0 ? '0.5rem' : '0.15rem',
                    }}
                  >
                    {group.category}
                  </div>
                )}

                {/* Category Links */}
                {group.items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/dashboard' && item.path !== '/admin' && location.pathname.startsWith(item.path));
                  const hasBadge = item.badge && unreadCount > 0;

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={collapsed ? item.name : undefined}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        gap: '0.65rem',
                        padding: collapsed ? '0.65rem' : '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: isActive ? '#172554' : 'transparent',
                        color: isActive ? '#60A5FA' : 'var(--text-secondary)',
                        borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        transition: 'background var(--transition-fast), color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--bg-card-hover)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ color: isActive ? '#3B82F6' : 'var(--text-secondary)', display: 'flex' }}>
                          {item.icon}
                        </span>
                        {!collapsed && <span>{item.name}</span>}
                      </div>

                      {!collapsed && hasBadge && (
                        <span
                          style={{
                            background: '#3B82F6',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-full)',
                            minWidth: '18px',
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ));
          })()}

          {/* Quick Actions (if any) */}
          {!collapsed && quickActions.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  padding: '0 0.5rem 0.4rem',
                }}
              >
                Quick Actions
              </div>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.65rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {action.icon} {action.name}
                </button>
              ))}
            </div>
          )}

          {/* Help & Support Link */}
          {!collapsed && (
            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.5rem',
                  color: '#9CA3AF',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F5F7FA';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9CA3AF';
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => window.open('https://github.com/Mayur51015/Mavi-Linking', '_blank')}
              >
                <HelpCircle size={15} />
                <span>Help & Support</span>
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Footer — Expand button if collapsed */}
        {collapsed && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={toggleCollapsed}
              title="Expand sidebar"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '6px',
                display: 'flex',
              }}
            >
              <PanelLeft size={20} />
            </button>
          </div>
        )}
      </aside>

      {/* ─── Main Viewport ─────────────────────────────────────────────────── */}
      <div className="dashboard-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Navigation Bar */}
        <header
          className="dashboard-header"
          style={{
            height: '60px',
            minHeight: '60px',
            padding: '0 1.5rem',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            zIndex: 40,
          }}
        >
          {/* Left: Mobile Menu & ERP Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <Menu size={20} />
            </button>

            {/* Desktop ERP Breadcrumb Path */}
            <nav aria-label="Breadcrumb" className="breadcrumb hide-mobile">
              <span className="breadcrumb-item">
                {user?.institutionId?.name || user?.collegeName || 'MAVI Linking'}
              </span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-item">
                {currentRole.label}
              </span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">
                {title || 'Overview'}
              </span>
            </nav>

            {/* Mobile View Title */}
            <h1
              className="show-mobile"
              style={{
                display: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title || currentRole.label}
            </h1>
          </div>

          {/* Center / Search Trigger Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.85rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              maxWidth: '320px',
              width: '100%',
              transition: 'border-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <Search size={14} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search anything...</span>
            <kbd
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '0.1rem 0.35rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              ⌘ K
            </kbd>
          </button>

          {/* Right: Controls & User Avatar Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ThemeToggle />
            <NotificationBell />

            {/* User Dropdown */}
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.2rem 0.4rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    flexShrink: 0,
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'M'}
                </div>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', lineHeight: 1.2 }} className="hide-mobile">
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F5F7FA' }}>
                    {user?.name || 'Mayur S.'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                    {currentRole.label || 'Student'}
                  </span>
                </div>
                <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.5rem',
                    zIndex: 120,
                  }}
                >
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email}
                    </div>
                    {maviIdDisplay && (
                      <div style={{ fontFamily: 'monospace', fontSize: '0.675rem', color: 'var(--brand-blue)', marginTop: '0.25rem', fontWeight: 600 }}>
                        {maviIdDisplay}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', paddingTop: '0.25rem' }}>
                    {/* View Profile */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        const publicUser = user?.username || user?.platforms?.github?.username;
                        if (publicUser) {
                          navigate(`/u/${publicUser}`);
                        } else if (user?._id) {
                          navigate(`/portfolio/${user._id}`);
                        } else {
                          navigate('/dashboard?edit=true');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <User size={15} style={{ color: 'var(--text-secondary)' }} />
                      <span>View Profile</span>
                    </button>

                    {/* Edit Profile */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/dashboard?edit=true');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Edit2 size={15} style={{ color: 'var(--brand-blue)' }} />
                      <span>Edit Profile</span>
                    </button>

                    {/* Account Settings */}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (user?.role === 'admin') {
                          navigate('/admin/settings');
                        } else if (user?.role === 'super_admin') {
                          navigate('/super-admin/settings');
                        } else if (user?.role === 'owner' || user?.role === 'platform_owner') {
                          navigate('/owner/settings');
                        } else {
                          navigate('/dashboard/link');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Settings size={15} style={{ color: 'var(--text-secondary)' }} />
                      <span>Account Settings</span>
                    </button>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.3rem 0.25rem' }} />

                    {/* Log Out */}
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.8125rem',
                        color: 'var(--accent-red)',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="dashboard-content" style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '1.5rem 2rem' }}>
          {/* Institutional Account Verification Status Banner */}
          <VerificationStatusBanner />

          {/* Role Status Notification */}
          {user?.roleStatus === 'pending' && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#fde047',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
              }}
            >
              <strong>Role Verification Pending ({user.requestedRole?.toUpperCase()})</strong>: Your application is under administrative review.
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Quick Search / Command Palette Modal */}
      {searchModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setSearchModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '15vh',
            zIndex: 250,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search platform modules or pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                }}
              />
              <kbd
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '0.1rem 0.35rem',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                }}
              >
                ESC
              </kbd>
            </div>

            <div style={{ padding: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, padding: '0.4rem 0.5rem', textTransform: 'uppercase' }}>
                Navigation
              </div>
              {filteredNavItems.map((item) => (
                <div
                  key={item.name}
                  onClick={() => {
                    setSearchModalOpen(false);
                    navigate(item.path);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: '#3B82F6', display: 'flex' }}>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              ))}
              {filteredNavItems.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No matching items found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVerifyModal && <VerificationModal onClose={() => setShowVerifyModal(false)} />}
    </div>
  );
};

export default AppShell;
