import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { superAdminNavItems } from '../navigation/superAdminNavigation.jsx';
import AppShell from '../components/shell/AppShell';

const SuperAdminLayout = ({ children }) => {
  const { user } = useContext(AuthContext);

  const superAdminId = user?.adminId || user?.maviId || `MAVI-SA-${user?._id?.slice(-6).toUpperCase()}`;

  const quickActions = [
    ...(superAdminId
      ? [
          {
            name: `Super Admin: ${superAdminId}`,
            icon: <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--accent-red)' }}>SA</span>,
            onClick: () => {},
          },
        ]
      : []),
  ];

  return (
    <AppShell
      title="Platform Super Admin Console"
      navItems={superAdminNavItems}
      quickActions={quickActions}
      roleBadge={{ label: 'Super Admin', color: 'badge-purple' }}
    >
      {children}
    </AppShell>
  );
};

export default SuperAdminLayout;
