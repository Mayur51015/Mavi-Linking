import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, X, LogOut, Shield } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { superAdminNavItems } from '../../navigation/superAdminNavigation.jsx';

const SuperAdminSidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    navigate('/super-admin/login', { replace: true });
  };

  const superAdminIdDisplay = user?.adminId || user?.maviId || `MAVI-SA-${user?._id?.slice(-6).toUpperCase()}`;

  const checkIsActive = (item) => {
    const path = location.pathname;
    if (item.path === '/super-admin') {
      return path === '/super-admin' || path === '/super-admin/' || path === '/super-admin/overview';
    }
    if (item.id === 'institution-admins' || item.path.includes('admins')) {
      return path.includes('/institution-admins') || path.includes('/admins');
    }
    if (item.id === 'verification' || item.path.includes('verification')) {
      return path.includes('/verification');
    }
    if (item.id === 'audit-logs' || item.path.includes('audit')) {
      return path.includes('/audit');
    }
    return path === item.path || path.startsWith(item.path + '/');
  };

  return (
    <aside className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{ borderRight: '1px solid rgba(239, 68, 68, 0.3)' }}>
      {/* Super Admin Header Branding */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/super-admin" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldAlert size={26} style={{ color: '#ef4444' }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'white' }}>MAVI LINKING</div>
            <div style={{ fontSize: '0.65rem', color: '#f87171', letterSpacing: '0.05em', fontWeight: 'bold' }}>SUPER ADMIN CONSOLE</div>
          </div>
        </Link>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <X size={22} />
        </button>
      </div>

      {/* Super Admin Profile Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(236, 72, 153, 0.06) 100%)',
        padding: '1rem', borderRadius: '12px',
        marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar-gradient" style={{ width: '38px', height: '38px', fontSize: '0.9rem', flexShrink: 0, background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' }}>
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name}
            </div>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem', background: '#ef4444', borderColor: '#ef4444' }}>
              Super Admin
            </span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 'bold', marginTop: '0.15rem' }}>
              ID: {superAdminIdDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
        {superAdminNavItems.map((item) => {
          const isActive = checkIsActive(item);
          return (
            <button
              key={item.id}
              onClick={() => {
                if (setActiveTab) setActiveTab(item.id);
                navigate(item.path);
                setSidebarOpen(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 1rem', borderRadius: '10px',
                background: isActive ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: isActive ? '#fca5a5' : 'var(--text-secondary)',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: isActive ? '3px solid #ef4444' : '3px solid transparent',
                transition: 'all 0.2s',
                fontSize: '0.875rem',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {item.icon} {item.name}
            </button>
          );
        })}

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 1rem', borderRadius: '10px',
              color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer',
              fontSize: '0.875rem', width: '100%', fontWeight: '600',
            }}
          >
            <LogOut size={18} /> Exit Console
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default SuperAdminSidebar;
