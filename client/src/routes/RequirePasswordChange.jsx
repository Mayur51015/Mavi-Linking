import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Guard Component — checks whether user has mustChangePassword: true.
 * If true, redirects to /change-password to block access to protected application modules.
 */
const RequirePasswordChange = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return null;

  if (user && user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default RequirePasswordChange;
