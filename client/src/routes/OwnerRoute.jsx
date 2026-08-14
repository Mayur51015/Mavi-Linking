import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const OwnerRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-dark)', color: 'var(--text-muted)'
      }}>
        Verifying Platform Owner credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/owner/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  const userRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
  const isOwner =
    userRoles.includes('platform_owner') ||
    userRoles.includes('owner') ||
    userRoles.includes('super_admin') ||
    user.role === 'platform_owner' ||
    user.role === 'owner' ||
    user.role === 'super_admin' ||
    user.adminId === 'MAVI-OWNER-001';

  if (!isOwner) {
    return <Navigate to="/owner/login?error=unauthorized" replace />;
  }

  return children;
};

export default OwnerRoute;
