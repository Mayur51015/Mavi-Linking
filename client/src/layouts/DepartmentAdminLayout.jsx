import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BarChart3,
  Trophy,
  FileText,
  Bell,
  Building,
} from 'lucide-react';
import AppShell from '../components/shell/AppShell';

/**
 * DepartmentAdminLayout — dedicated layout shell for Department Administrators / HODs.
 */
const DepartmentAdminLayout = ({ children }) => {
  const { user } = useContext(AuthContext);

  const deptName = user?.university?.department || user?.departmentId?.name || 'Department Administration';
  const instName = user?.university?.name || user?.institutionId?.name || 'Academic Institution';

  const navItems = [
    { id: 'overview', name: 'Overview', path: '/department-admin', icon: <LayoutDashboard size={18} />, category: 'Overview' },
    { id: 'students', name: 'Department Students', path: '/department-admin?tab=students', icon: <GraduationCap size={18} />, category: 'Academic' },
    { id: 'teachers', name: 'Department Faculty', path: '/department-admin?tab=teachers', icon: <Users size={18} />, category: 'Academic' },
    { id: 'analytics', name: 'Department Analytics', path: '/department-admin?tab=analytics', icon: <BarChart3 size={18} />, category: 'Academic' },
    { id: 'leaderboard', name: 'Leaderboard', path: '/department-admin?tab=leaderboard', icon: <Trophy size={18} />, category: 'Academic' },
    { id: 'reports', name: 'Performance Reports', path: '/department-admin?tab=reports', icon: <FileText size={18} />, category: 'Reports' },
    { id: 'notifications', name: 'Notifications', path: '/department-admin/notifications', icon: <Bell size={18} />, badge: true, category: 'Reports' },
  ];

  const quickActions = [
    {
      name: `Dept: ${deptName}`,
      icon: <Building size={14} style={{ color: 'var(--accent-cyan, #06b6d4)' }} />,
      onClick: () => {},
    },
  ];

  return (
    <AppShell
      title={`${deptName} — ${instName}`}
      navItems={navItems}
      quickActions={quickActions}
      roleBadge={{ label: 'Department Admin', color: 'badge-cyan' }}
    >
      {children}
    </AppShell>
  );
};

export default DepartmentAdminLayout;
