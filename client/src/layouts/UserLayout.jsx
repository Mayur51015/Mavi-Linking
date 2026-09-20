import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { userNavItems } from '../navigation/userNavigation.jsx';
import AppShell from '../components/shell/AppShell';
import VerificationModal from '../components/VerificationModal';
import { QrCode, BadgeCheck } from 'lucide-react';

const UserLayout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [showVerify, setShowVerify] = useState(false);

  const publicUsername = user?.username || user?.platforms?.github?.username;

  const quickActions = [
    ...(!user?.isVerified
      ? [
          {
            name: 'Get PRN Verified',
            icon: <BadgeCheck size={16} style={{ color: 'var(--accent-cyan)' }} />,
            onClick: () => setShowVerify(true),
          },
        ]
      : []),
    ...(publicUsername
      ? [
          {
            name: 'Public Developer Card',
            icon: <QrCode size={16} />,
            onClick: () => window.open(`/u/${publicUsername}`, '_blank'),
          },
        ]
      : []),
  ];

  return (
    <>
      <AppShell
        title={user?.role === 'teacher' ? 'Faculty Workspace' : user?.role === 'recruiter' ? 'Recruiter Workspace' : 'Student Intelligence'}
        navItems={userNavItems}
        quickActions={quickActions}
        roleBadge={{ label: 'Student', color: 'badge-primary' }}
      >
        {children}
      </AppShell>
      {showVerify && <VerificationModal onClose={() => setShowVerify(false)} />}
    </>
  );
};

export default UserLayout;
