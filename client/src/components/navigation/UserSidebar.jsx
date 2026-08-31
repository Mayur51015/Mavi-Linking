import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, X, BadgeCheck } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { userNavItems, userQuickActions } from '../../navigation/userNavigation.jsx';

const UserSidebar = ({ sidebarOpen, setSidebarOpen, onOpenVerify }) => {
  const { user } = useContext(AuthContext);
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const publicUsername = user?.username || user?.platforms?.github?.username;
  const maviIdDisplay = user?.maviId || (user?._id ? `MAVI-${user._id.slice(-8).toUpperCase()}` : '');


  return (
    <aside className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={24} className="text-gradient" />
          <span className="text-gradient">MaVi Linking</span>
        </Link>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <X size={22} />
        </button>
      </div>

      {/* Normal User Profile Card */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px',
        marginBottom: '1.5rem', border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar-gradient" style={{ width: '38px', height: '38px', fontSize: '0.9rem', flexShrink: 0 }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</span>
              {user?.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.15rem' }}>
              {publicUsername && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{publicUsername}</span>
              )}
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.125rem 0.5rem', textTransform: 'capitalize' }}>
                {user?.role === 'user' ? 'Student' : user?.role || 'Student'}
              </span>
            </div>
            {maviIdDisplay && (
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 'bold', marginTop: '0.2rem' }}>
                {maviIdDisplay}
              </div>
            )}
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {userNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.badge && unreadCount > 0;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                padding: '0.625rem 1rem', borderRadius: '10px',
                background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: isActive ? '3px solid var(--accent-purple)' : '3px solid transparent',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '400',
                textDecoration: 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {item.icon} {item.name}
              </span>
              {showBadge && (
                <span
                  style={{
                    background: 'var(--accent-purple)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.68rem',
                    padding: '0.125rem 0.45rem',
                    borderRadius: '999px',
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


        {/* Quick Actions */}
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
            Quick Actions
          </div>
          {!user?.isVerified && (
            <button
              onClick={() => { setSidebarOpen(false); navigate(`/verify/${user?.maviId || 'account'}`); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 1rem', borderRadius: '10px',
                background: 'transparent', color: 'var(--accent-cyan)',
                border: 'none', cursor: 'pointer', fontSize: '0.9rem', width: '100%', textAlign: 'left',
              }}
            >
              <BadgeCheck size={20} /> Get Verified
            </button>
          )}
          {publicUsername && (
            <Link
              to={`/u/${publicUsername}`}
              target="_blank"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 1rem', borderRadius: '10px',
                color: 'var(--text-secondary)', fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              {userQuickActions[0].icon} {userQuickActions[0].name}
            </Link>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default UserSidebar;
