import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Crown, X, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { ownerNavItems } from '../../navigation/ownerNavigation.jsx';
import BrandLogo from '../BrandLogo';

const OwnerSidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/owner/login');
  };

  const currentTab = activeTab || new URLSearchParams(location.search).get('tab') || 'overview';
  const ownerIdDisplay = user?.adminId || 'ETX-OWNER-001';

  return (
    <aside className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{ background: '#FFFFFF', borderRight: '1px solid #E5E7EB' }}>
      {/* Platform Owner Header Branding */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <BrandLogo variant="full" size={26} linkTo="/owner" />
          <div style={{ fontSize: '0.65rem', color: '#1E40AF', letterSpacing: '0.06em', fontWeight: '600', textTransform: 'uppercase', paddingLeft: '2px' }}>
            PLATFORM OWNER CONSOLE
          </div>
        </div>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu" style={{ color: '#4B5563' }}>
          <X size={20} />
        </button>
      </div>

      {/* Platform Owner Profile Card */}
      <div style={{
        background: '#F8F9FA',
        padding: '0.875rem', borderRadius: '8px',
        marginBottom: '1.25rem', border: '1px solid #E5E7EB',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.name?.charAt(0) || 'O'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111111', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'Platform Owner'}
            </div>
            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', fontWeight: '600', display: 'inline-block', marginTop: '0.15rem' }}>
              Platform Owner
            </span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#6B7280', marginTop: '0.15rem' }}>
              Owner ID: {ownerIdDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, overflowY: 'auto' }}>
        {ownerNavItems.map((item) => {
          const isPathMatch = location.pathname === item.path || (location.pathname === '/owner' && item.id === 'overview');
          const isTabMatch = activeTab === item.id || new URLSearchParams(location.search).get('tab') === item.id;
          const isActive = isPathMatch || isTabMatch;

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
            <LogOut size={16} /> Exit Owner Console
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default OwnerSidebar;
