import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Link as LinkIcon, BarChart3, Terminal, Briefcase } from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Projects', path: '/dashboard/projects', icon: <Briefcase size={20} /> },
    { name: 'Link Accounts', path: '/dashboard/link', icon: <LinkIcon size={20} /> },
    { name: 'AI Insights', path: '/dashboard/insights', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'var(--bg-glass)', borderRight: '1px solid var(--border-color)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
        <Link to="/" className="nav-brand" style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={24} className="text-gradient" />
          <span className="text-gradient">MaVi Linking</span>
        </Link>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className="btn btn-outline" 
                style={{ 
                  justifyContent: 'flex-start', 
                  border: 'none', 
                  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)'
                }}
              >
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>

        <button onClick={handleLogout} className="btn btn-outline" style={{ justifyContent: 'flex-start', border: 'none', color: '#fca5a5' }}>
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 4rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
