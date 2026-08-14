import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Crown, X, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { ownerNavItems } from '../../navigation/ownerNavigation.jsx';

const OwnerSidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/owner/login');
  };

  const currentTab = activeTab || new URLSearchParams(location.search).get('tab') || 'overview';
  const ownerIdDisplay = user?.adminId || 'MAVI-OWNER-001';

  return (
    <aside className={`dashboard-sidebar${sidebarOpen ? ' sidebar-open' : ''}`} style={{ borderRight: '1px solid rgba(234, 179, 8, 0.35)' }}>
      {/* Platform Owner Header Branding */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/owner" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Crown size={28} style={{ color: '#eab308' }} />
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'white' }}>MAVI LINKING</div>
            <div style={{ fontSize: '0.65rem', color: '#fde047', letterSpacing: '0.08em', fontWeight: 'bold' }}>PLATFORM OWNER CONSOLE</div>
          </div>
        </Link>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <X size={22} />
        </button>
      </div>

      {/* Platform Owner Profile Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(236, 72, 153, 0.06) 100%)',
        padding: '1rem', borderRadius: '12px',
        marginBottom: '1.5rem', border: '1px solid rgba(234, 179, 8, 0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar-gradient" style={{ width: '40px', height: '40px', fontSize: '0.95rem', flexShrink: 0, background: 'linear-gradient(135deg, #eab308 0%, #ec4899 100%)' }}>
            {user?.name?.charAt(0) || 'O'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'Platform Owner'}
            </div>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem', background: '#eab308', borderColor: '#eab308', color: '#09090b', fontWeight: 'bold' }}>
              Platform Owner
            </span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#fde047', fontWeight: 'bold', marginTop: '0.15rem' }}>
              Owner ID: {ownerIdDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
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
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 1rem', borderRadius: '10px',
                background: isActive ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                color: isActive ? '#fef08a' : 'var(--text-secondary)',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: isActive ? '3px solid #eab308' : '3px solid transparent',
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
            <LogOut size={18} /> Exit Owner Console
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default OwnerSidebar;
