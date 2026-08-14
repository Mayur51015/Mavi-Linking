import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Building, Shield } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import AdminSidebar from '../components/navigation/AdminSidebar';

const InstitutionAdminLayout = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const instName = user?.institutionId?.name || user?.university?.name || 'Institution Administration';
  const tenantId = user?.tenantId || user?.institutionId?.tenantId || '';
  const adminId = user?.adminId || user?.adminLoginId || '';
  const designation = user?.designation || 'Academic Administrator';

  return (
    <div className="dashboard-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Institution Admin Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Dedicated Institution Admin Header */}
        <header className="dashboard-header" style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.25)', padding: '0.85rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            
            <Building size={24} style={{ color: 'var(--accent-purple)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                  {instName}
                </h1>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                  {designation}
                </span>
                {tenantId && (
                  <span className="badge badge-outline" style={{ fontSize: '0.7rem', fontFamily: 'monospace', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}>
                    Tenant: {tenantId}
                  </span>
                )}
                {adminId && (
                  <span className="badge badge-outline" style={{ fontSize: '0.7rem', fontFamily: 'monospace', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                    Admin ID: {adminId}
                  </span>
                )}
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Institution Administration Portal — Logged in as <strong>{user?.name}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <NotificationBell />
            <button onClick={handleLogout} className="btn btn-danger">
              <LogOut size={18} />
              <span className="hide-mobile">Sign Out</span>
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

export default InstitutionAdminLayout;
