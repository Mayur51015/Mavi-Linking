import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, User } from 'lucide-react';
import VerificationModal from '../components/VerificationModal';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import UserSidebar from '../components/navigation/UserSidebar';

import VerificationStatusBanner from '../components/VerificationStatusBanner';

const UserLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showVerify, setShowVerify] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Normal User Sidebar */}
      <UserSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenVerify={() => setShowVerify(true)}
      />

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <User size={24} style={{ color: 'var(--accent-purple)' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
              {user?.role === 'teacher' ? 'Teacher Dashboard' : user?.role === 'recruiter' ? 'Recruiter Portal' : 'Student Dashboard'}
            </h1>
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

        <div className="dashboard-content" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Institutional Account Verification Status Banner */}
          <VerificationStatusBanner />

          {user?.roleStatus === 'pending' && (
            <div style={{
              background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#fde047', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem'
            }}>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Role Verification Pending ({user.requestedRole?.toUpperCase()})</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#fef08a' }}>
                  Your request for <strong>{user.requestedRole}</strong> role access is currently under verification by an administrator. You can build your developer profile while your request is being reviewed.
                </p>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
      {showVerify && <VerificationModal onClose={() => setShowVerify(false)} />}
    </div>
  );
};

export default UserLayout;
