import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * SuperAdminRoute — strictly guards the Super Admin Portal (/super-admin).
 * Only permits access to Super Admins ('super_admin').
 * Operational Admins, teachers, recruiters, and students are DENIED access and redirected to /super-admin/login.
 */
const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#a1a1aa' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-pulse" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', margin: '0 auto 1rem' }} />
          <p style={{ color: '#ef4444', fontWeight: '600' }}>Verifying Super Admin Governance Credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/super-admin/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
  const isSuperAdminAuthorized =
    userRoles.includes('super_admin') ||
    userRoles.includes('platform_owner') ||
    userRoles.includes('owner') ||
    user.role === 'super_admin' ||
    user.role === 'platform_owner' ||
    user.role === 'owner';

  if (!isSuperAdminAuthorized) {
    return <Navigate to="/super-admin/login?error=unauthorized" replace />;
  }

  return children;
};

export default SuperAdminRoute;
