import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Crown, Shield } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import OwnerSidebar from '../components/navigation/OwnerSidebar';

const PlatformOwnerLayout = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/owner/login');
  };

  const ownerId = user?.adminId || 'MAVI-OWNER-001';

  return (
    <div className="dashboard-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Platform Owner Sidebar */}
      <OwnerSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Dedicated Platform Owner Header */}
        <header className="dashboard-header" style={{ borderBottom: '1px solid rgba(234, 179, 8, 0.4)', background: 'linear-gradient(180deg, rgba(234, 179, 8, 0.06) 0%, rgba(9, 9, 11, 1) 100%)', padding: '0.85rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>

            <Crown size={28} style={{ color: '#eab308' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', margin: 0 }}>
                  MAVI LINKING — Platform Owner Console
                </h1>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', background: '#eab308', borderColor: '#eab308', color: '#09090b', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Crown size={12} /> PLATFORM OWNER
                </span>
                {ownerId && (
                  <span className="badge badge-outline" style={{ fontSize: '0.7rem', fontFamily: 'monospace', borderColor: '#eab308', color: '#fde047' }}>
                    Owner ID: {ownerId}
                  </span>
                )}
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#a1a1aa' }}>
                Platform ownership, global multi-tenant licensing, subscriptions, and system configurations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <NotificationBell />
            <button onClick={handleLogout} className="btn btn-danger" style={{ background: '#eab308', borderColor: '#eab308', color: '#09090b', fontWeight: 'bold' }}>
              <LogOut size={18} />
              <span className="hide-mobile">Exit Console</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default PlatformOwnerLayout;
