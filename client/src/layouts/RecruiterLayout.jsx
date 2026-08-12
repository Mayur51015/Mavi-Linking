import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LogOut, Search, Bookmark, Users, BarChart3,
  Terminal, Building2, UserCheck, GitPullRequest, Menu, X,
} from 'lucide-react';import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
const RecruiterLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard/recruiter', icon: <BarChart3 size={20} /> },
    { name: 'Search Talent', path: '/dashboard/recruiter/search', icon: <Search size={20} /> },
    { name: 'Pipeline', path: '/dashboard/recruiter/pipeline', icon: <GitPullRequest size={20} /> },
    { name: 'Bookmarks', path: '/dashboard/recruiter/bookmarks', icon: <Bookmark size={20} /> },
    { name: 'Compare', path: '/dashboard/recruiter/compare', icon: <Users size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px', background: 'var(--bg-glass)', borderRight: '1px solid var(--border-color)',
        padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column',
        backdropFilter: 'blur(12px)',
      }}>
        <Link to="/" className="nav-brand" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={24} className="text-gradient" />
          <span className="text-gradient">MaVi Linking</span>
        </Link>

        {/* Recruiter Info */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px',
          marginBottom: '1.5rem', border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--gradient-cyan)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', color: 'white', fontSize: '0.9rem', flexShrink: 0,
            }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.125rem 0.5rem' }}>Recruiter</span>
              </div>
            </div>
          </div>
          {user?.companyName && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Building2 size={14} /> {user.companyName}
            </div>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
<Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem', borderRadius: '10px',
                  background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',                  color: isActive ? 'white' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? '600' : '400',
                  textDecoration: 'none',
                }}
              >
                {item.icon} {item.name}
              </Link>
            );
          })}

          {/* Access Scope */}
          {(user?.allowedColleges?.length > 0 || user?.allowedDepartments?.length > 0) && (
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
                Access Scope
              </div>
              {user.allowedColleges?.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Building2 size={14} style={{ color: 'var(--accent-cyan)' }} /> {c}
                </div>
              ))}
              {user.allowedDepartments?.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <UserCheck size={14} style={{ color: 'var(--accent-emerald)' }} /> {d}
                </div>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
<header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <Search size={24} style={{ color: 'var(--accent-cyan)' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Recruiter Dashboard</h1>
          </div>          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
<ThemeToggle />
            <NotificationBell />            <button onClick={handleLogout} className="btn btn-danger">
              <LogOut size={18} />
              <span className="hide-mobile">Sign Out</span>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '2rem 4rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default RecruiterLayout;
