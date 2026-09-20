import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ownerNavItems } from '../navigation/ownerNavigation.jsx';
import AppShell from '../components/shell/AppShell';

const PlatformOwnerLayout = ({ children }) => {
  const { user } = useContext(AuthContext);

  const ownerId = user?.adminId || 'MAVI-OWNER-001';

  const quickActions = [
    {
      name: `Owner ID: ${ownerId}`,
      icon: <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--accent-amber)' }}>PO</span>,
      onClick: () => {},
    },
  ];

  return (
    <AppShell
      title="Platform Owner Console"
      navItems={ownerNavItems}
      quickActions={quickActions}
      roleBadge={{ label: 'Platform Owner', color: 'badge-purple' }}
    >
      {children}
    </AppShell>
  );
};

export default PlatformOwnerLayout;
