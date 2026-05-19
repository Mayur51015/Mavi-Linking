import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

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

  // Role-based access check (normalize legacy roles)
  const roleMigration = { developer: 'user', professor: 'teacher' };
  const normalizedRole = roleMigration[user.role] || user.role;

  if (roles && roles.length > 0 && !roles.includes(normalizedRole)) {
    // Redirect to their appropriate dashboard instead of blocking
    switch (normalizedRole) {
      case 'recruiter':
        return <Navigate to="/dashboard/recruiter" />;
      case 'teacher':
        return <Navigate to="/dashboard/teacher" />;
      default:
        return <Navigate to="/dashboard" />;
    }
  }

  return children;
};

export default ProtectedRoute;
