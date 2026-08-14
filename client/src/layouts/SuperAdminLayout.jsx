import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShieldAlert, Globe } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import SuperAdminSidebar from '../components/navigation/SuperAdminSidebar';

const SuperAdminLayout = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  const superAdminId = user?.adminId || user?.maviId || `MAVI-SA-${user?._id?.slice(-6).toUpperCase()}`;

  return (
    <div className="dashboard-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Super Admin Sidebar */}
      <SuperAdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Dedicated Super Admin Header */}
        <header className="dashboard-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.35)', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(9, 9, 11, 1) 100%)', padding: '0.85rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>

            <ShieldAlert size={26} style={{ color: '#ef4444' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', margin: 0 }}>
                  MAVI LINKING — Platform Super Admin Console
                </h1>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', background: '#ef4444', borderColor: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Globe size={12} /> GLOBAL PLATFORM ACCESS
                </span>
                {superAdminId && (
                  <span className="badge badge-outline" style={{ fontSize: '0.7rem', fontFamily: 'monospace', borderColor: '#ef4444', color: '#f87171' }}>
                    ID: {superAdminId}
                  </span>
                )}
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#a1a1aa' }}>
                Central platform governance, multi-tenant provisioning, and platform security audit logs.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <NotificationBell />
            <button onClick={handleLogout} className="btn btn-danger" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
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

export default SuperAdminLayout;
