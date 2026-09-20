import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { adminNavItems } from '../navigation/adminNavigation.jsx';
import AppShell from '../components/shell/AppShell';

const InstitutionAdminLayout = ({ children }) => {
  const { user } = useContext(AuthContext);

  const instName = user?.institutionId?.name || user?.university?.name || 'Institution Administration';
  const tenantId = user?.tenantId || user?.institutionId?.tenantId || '';

  const quickActions = [
    ...(tenantId
      ? [
          {
            name: `Tenant: ${tenantId}`,
            icon: <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--accent-indigo)' }}>ID</span>,
            onClick: () => {},
          },
        ]
      : []),
  ];

  return (
    <AppShell
      title={instName}
      navItems={adminNavItems}
      quickActions={quickActions}
      roleBadge={{ label: 'Institution Admin', color: 'badge-primary' }}
    >
      {children}
    </AppShell>
  );
};

export default InstitutionAdminLayout;
