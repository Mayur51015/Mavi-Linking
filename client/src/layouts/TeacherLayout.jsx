import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LogOut, Users, BarChart3, TrendingUp, Award,
  Terminal, GraduationCap, Building2, Megaphone, FolderOpen,
} from 'lucide-react';

const TeacherLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard/teacher', icon: <BarChart3 size={20} /> },
    { name: 'Students', path: '/dashboard/teacher/students', icon: <Users size={20} /> },
    { name: 'Readiness', path: '/dashboard/teacher/readiness', icon: <TrendingUp size={20} /> },
    { name: 'Leaderboard', path: '/dashboard/teacher/leaderboard', icon: <Award size={20} /> },
    { name: 'Announcements', path: '/dashboard/teacher/announcements', icon: <Megaphone size={20} /> },
    { name: 'Shared Documents', path: '/dashboard/teacher/documents', icon: <FolderOpen size={20} /> },
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

        {/* Teacher Info */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px',
          marginBottom: '1.5rem', border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--gradient-emerald)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', color: 'white', fontSize: '0.9rem', flexShrink: 0,
            }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '0.125rem 0.5rem' }}>Teacher</span>
              </div>
            </div>
          </div>

          {/* Scope Info */}
          <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            {user?.university?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <Building2 size={14} style={{ color: 'var(--accent-emerald)' }} /> {user.university.name}
              </div>
            )}
            {user?.university?.department && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <GraduationCap size={14} style={{ color: 'var(--accent-amber)' }} /> {user.university.department}
              </div>
            )}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem', borderRadius: '10px',
                  background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid var(--accent-emerald)' : '3px solid transparent',
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
        </nav>

        {/* Scope Reminder */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.4,
        }}>
          <strong style={{ color: 'var(--accent-emerald)' }}>Scope:</strong> You can only view students from your own college and department.
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(18, 18, 28, 0.5)',
          backdropFilter: 'blur(12px)',
          minHeight: '72px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GraduationCap size={24} style={{ color: 'var(--accent-emerald)' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Teacher Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="btn btn-danger">
            <LogOut size={18} />
            <span className="hide-mobile">Sign Out</span>
          </button>
        </header>

        <div style={{ flex: 1, padding: '2rem 4rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;
