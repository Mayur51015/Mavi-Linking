import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { userNavItems } from '../navigation/userNavigation.jsx';
import AppShell from '../components/shell/AppShell';
import VerificationModal from '../components/VerificationModal';
import { QrCode, BadgeCheck, Edit2 } from 'lucide-react';

const UserLayout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showVerify, setShowVerify] = useState(false);

  const publicUsername = user?.username || user?.etxId || user?.platforms?.github?.username || user?._id;

  const quickActions = [
    {
      name: 'Edit Profile',
      icon: <Edit2 size={16} style={{ color: 'var(--brand-blue, #3B82F6)' }} />,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('open-edit-profile'));
        const currentPath = location.pathname + location.search;
        const returnTo = (currentPath.includes('edit=true') || currentPath === '/profile/edit') ? undefined : currentPath;
        navigate('/dashboard?edit=true', { state: { returnTo } });
      },
    },
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
        title="Student Intelligence"
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
