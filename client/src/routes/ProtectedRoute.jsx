import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getDashboardRouteForRole } from '../utils/roleRouting';

/**
 * ProtectedRoute — guards routes behind authentication.
 * Optionally restrict access to specific roles.
 *
 * @param {React.ReactNode} children   Component to render
 * @param {string[]}        roles      Optional array of allowed roles
 * @param {string}          redirectTo Where to redirect unauthenticated users (default: /login)
 */
const ProtectedRoute = ({ children, roles, redirectTo = '/login' }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-pulse" style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (user.status === 'suspended') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary, #09090b)',
        color: '#ef4444',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div className="glass-card-static" style={{ maxWidth: '450px', padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Account Suspended</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Your account has been suspended by an administrator. Access to EduTalentX features is restricted.
          </p>
          <a href="mailto:support@edutalentx.com" className="btn btn-primary">Contact Support</a>
        </div>
      </div>
    );
  }

  // Role-based access check (check user.roles or fallback user.role)
  const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
  const roleMigration = { developer: 'user', professor: 'teacher' };
  const normalizedUserRoles = userRoles.map((r) => roleMigration[r] || r);

  const isSuperAdmin = normalizedUserRoles.includes('super_admin') || normalizedUserRoles.includes('admin');
  const isInstAdmin = normalizedUserRoles.includes('institution_admin');

  // Student 2-Stage Verification & Approval Access Check
  const isStudentRole = normalizedUserRoles.includes('user') && !isSuperAdmin && !isInstAdmin && !normalizedUserRoles.includes('teacher') && !normalizedUserRoles.includes('recruiter') && !normalizedUserRoles.includes('department_admin');
  if (isStudentRole) {
    if (!user.emailVerified) {
      return <Navigate to={`/verify/${user.etxId || 'account'}`} replace />;
    }
    if (user.accountStatus === 'REJECTED') {
      return <Navigate to="/pending-approval" replace />;
    }
    // Pre-approval student accounts (PENDING_ADMIN_APPROVAL / PENDING_VERIFICATION) are permitted to access the limited Student Dashboard shell!
  }

  // If the user is accessing the edit profile flow on /dashboard or /profile/edit,
  // allow any authenticated active user to edit their profile
  const isEditProfileFlow = (location.pathname === '/dashboard' && location.search.includes('edit=true')) || location.pathname === '/profile/edit';
  if (isEditProfileFlow) {
    return children;
  }

  if (roles && roles.length > 0) {
    const hasRole = roles.some((r) => normalizedUserRoles.includes(r));
    if (!hasRole && !isSuperAdmin) {
      return <Navigate to={getDashboardRouteForRole(user)} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
