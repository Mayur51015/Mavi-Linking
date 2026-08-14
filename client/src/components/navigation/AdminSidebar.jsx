import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building, X, Shield, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { adminNavItems } from '../../navigation/adminNavigation.jsx';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const currentTab = activeTab || new URLSearchParams(location.search).get('tab') || 'overview';
  const instName = user?.institutionId?.name || user?.university?.name || 'Institution Administration';
  const adminIdDisplay = user?.adminId || user?.adminLoginId || '';
  const tenantIdDisplay = user?.tenantId || user?.institutionId?.tenantId || '';

  const checkIsActive = (item) => {
    const path = location.pathname;
    if (item.path === '/admin') {
      return path === '/admin' || path === '/admin/' || path === '/admin/dashboard';
    }
    if (item.id === 'audit-logs' || item.path.includes('audit')) {
      return path.includes('/audit');
    }
    return path === item.path || path.startsWith(item.path + '/');
  };

  return (
    <aside className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{ borderRight: '1px solid rgba(139, 92, 246, 0.2)' }}>
      {/* Institution Header Branding */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/admin" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Building size={24} style={{ color: 'var(--accent-purple)' }} />
          <span style={{ fontSize: '1.1rem', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Institution Admin
          </span>
        </Link>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <X size={22} />
        </button>
      </div>

      {/* Institution Admin Profile Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.04) 100%)',
        padding: '1rem', borderRadius: '12px',
        marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.25)',
      }}>
        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {instName}
        </div>
        {tenantIdDisplay && (
          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 'bold', marginTop: '0.15rem' }}>
            Tenant: {tenantIdDisplay}
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '0.6rem 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.85rem', flexShrink: 0, background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {user?.designation || 'Academic Administrator'}
            </div>
            {adminIdDisplay && (
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 'bold', marginTop: '0.1rem' }}>
                Admin ID: {adminIdDisplay}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
        {adminNavItems.map((item) => {
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
                background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: isActive ? '3px solid var(--accent-purple)' : '3px solid transparent',
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
              color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer',
              fontSize: '0.875rem', width: '100%', fontWeight: '600',
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
