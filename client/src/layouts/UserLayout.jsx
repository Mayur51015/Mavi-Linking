import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Link as LinkIcon, BarChart3,
  Terminal, Briefcase, Heart, BadgeCheck, QrCode, User, Search, PieChart, Building2
} from 'lucide-react';
import VerificationModal from '../components/VerificationModal';
import NotificationBell from '../components/NotificationBell';

const UserLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showVerify, setShowVerify] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentNav = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Projects', path: '/dashboard/projects', icon: <Briefcase size={20} /> },
    { name: 'Availability', path: '/dashboard/availability', icon: <User size={20} /> },
    { name: 'Link Accounts', path: '/dashboard/link', icon: <LinkIcon size={20} /> },
    { name: 'AI Insights', path: '/dashboard/insights', icon: <BarChart3 size={20} /> },
    { name: 'Compatibility', path: '/dashboard/compatibility', icon: <Heart size={20} /> },
  ];

  const recruiterNav = [
    { name: 'Search', path: '/dashboard/recruiter', icon: <Search size={20} /> },
    { name: 'Pipeline', path: '/dashboard/recruiter/pipeline', icon: <LayoutDashboard size={20} /> },
    { name: 'Jobs', path: '/dashboard/recruiter/jobs', icon: <Briefcase size={20} /> },
    { name: 'Company', path: '/dashboard/recruiter/company', icon: <Building2 size={20} /> },
    { name: 'Analytics', path: '/dashboard/recruiter/analytics', icon: <PieChart size={20} /> },
  ];

  const teacherNav = [
    { name: 'Overview', path: '/dashboard/teacher', icon: <LayoutDashboard size={20} /> },
  ];

  const navItems = user?.role === 'recruiter' ? recruiterNav : user?.role === 'teacher' ? teacherNav : studentNav;
  const dashboardTitle = user?.role === 'recruiter' ? 'Recruiter Dashboard' : user?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard';

  const publicUsername = user?.username || user?.platforms?.github?.username;

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

        {/* User Info */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px',
          marginBottom: '1.5rem', border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar-gradient" style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0 }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {user?.name}
                {user?.isVerified && <BadgeCheck size={14} style={{ color: 'var(--accent-cyan)' }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {publicUsername && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{publicUsername}</span>
                )}
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.125rem 0.5rem', textTransform: 'capitalize' }}>{user?.role || 'student'}</span>
              </div>
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/dashboard/recruiter' && location.pathname === '/dashboard/recruiter/');
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem', borderRadius: '10px',
                  background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid var(--accent-purple)' : '3px solid transparent',
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

          {/* Quick Actions */}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
              Quick Actions
            </div>
            {!user?.isVerified && (
              <button
                onClick={() => setShowVerify(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem', borderRadius: '10px',
                  background: 'transparent', color: 'var(--accent-cyan)',
                  border: 'none', cursor: 'pointer', fontSize: '0.9rem', width: '100%', textAlign: 'left',
                }}
              >
                <BadgeCheck size={20} /> Get Verified
              </button>
            )}
            {publicUsername && (
              <Link
                to={`/u/${publicUsername}`}
                target="_blank"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem', borderRadius: '10px',
                  color: 'var(--text-secondary)', fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <QrCode size={20} /> Public Profile
              </Link>
            )}
          </div>
        </nav>
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
            <User size={24} style={{ color: 'var(--accent-purple)' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{dashboardTitle}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NotificationBell />
            <button onClick={handleLogout} className="btn btn-danger">
              <LogOut size={18} />
              <span className="hide-mobile">Sign Out</span>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '2rem 4rem', overflowY: 'auto' }}>
          {children}
        </div>
      </main>

      {showVerify && <VerificationModal onClose={() => setShowVerify(false)} userRole={user?.role} />}
    </div>
  );
};

export default UserLayout;
