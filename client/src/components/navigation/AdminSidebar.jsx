import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building, X, Shield, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { adminNavItems } from '../../navigation/adminNavigation.jsx';
import BrandLogo from '../BrandLogo';

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
    <aside className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{ background: '#FFFFFF', borderRight: '1px solid #E5E7EB' }}>
      {/* Institution Header Branding */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <BrandLogo variant="full" size={26} linkTo="/admin" />
          <span style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', paddingLeft: '2px' }}>
            Institution Admin
          </span>
        </div>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu" style={{ color: '#4B5563' }}>
          <X size={20} />
        </button>
      </div>

      {/* Institution Admin Profile Card */}
      <div style={{
        background: '#F8F9FA',
        padding: '0.875rem', borderRadius: '8px',
        marginBottom: '1.25rem', border: '1px solid #E5E7EB',
      }}>
        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {instName}
        </div>
        {tenantIdDisplay && (
          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4B5563', fontWeight: '500', marginTop: '0.15rem' }}>
            Tenant: {tenantIdDisplay}
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0.5rem 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', fontSize: '0.8125rem', color: '#111111', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
              {user?.designation || 'Academic Administrator'}
            </div>
            {adminIdDisplay && (
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#2563EB', fontWeight: '500', marginTop: '0.1rem' }}>
                Admin ID: {adminIdDisplay}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, overflowY: 'auto' }}>
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
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.55rem 0.85rem', borderRadius: '6px',
                background: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#1E40AF' : '#4B5563',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
                transition: 'all 0.15s ease',
                fontSize: '0.85rem',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ color: isActive ? '#2563EB' : '#6B7280' }}>{item.icon}</span>
              {item.name}
            </button>
          );
        })}

        <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.65rem',
              padding: '0.55rem 0.85rem', borderRadius: '6px',
              color: '#DC2626', background: '#FEF2F2',
              border: '1px solid #FECACA', cursor: 'pointer',
              fontSize: '0.85rem', width: '100%', fontWeight: '600',
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
