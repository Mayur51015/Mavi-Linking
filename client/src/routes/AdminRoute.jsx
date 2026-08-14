import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * AdminRoute — guards the Operational Admin Portal (/admin).
 * Permits access to users with 'admin', 'institution_admin', or 'super_admin' roles.
 * Unauthenticated or unauthorized users are redirected to /admin/login.
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#a1a1aa' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-pulse" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', margin: '0 auto 1rem' }} />
          <p>Verifying Admin Authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
  const isAdminAuthorized = userRoles.some((r) => ['admin', 'institution_admin', 'super_admin'].includes(r)) || ['admin', 'institution_admin', 'super_admin'].includes(user.role);

  if (!isAdminAuthorized) {
    return <Navigate to="/admin/login?error=unauthorized" replace />;
  }

  return children;
};

export default AdminRoute;
