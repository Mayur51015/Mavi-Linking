import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Users,
  BarChart3,
  TrendingUp,
  Award,
  Megaphone,
  FolderOpen,
  Shield,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import AppShell from '../components/shell/AppShell';

const TeacherLayout = ({ children }) => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { name: 'Overview', path: '/dashboard/teacher', icon: <BarChart3 size={18} />, category: 'Overview' },
    { name: 'Students', path: '/dashboard/teacher/students', icon: <Users size={18} />, category: 'Academic' },
    { name: 'Student Verification', path: '/dashboard/teacher/verification', icon: <UserCheck size={18} />, category: 'Academic' },
    { name: 'Readiness Analytics', path: '/dashboard/teacher/readiness', icon: <TrendingUp size={18} />, category: 'Academic' },
    { name: 'Leaderboard', path: '/dashboard/teacher/leaderboard', icon: <Award size={18} />, category: 'Academic' },
    { name: 'Placement Drives', path: '/dashboard/teacher/drives', icon: <Briefcase size={18} />, category: 'Industry' },
    { name: 'Announcements', path: '/dashboard/teacher/announcements', icon: <Megaphone size={18} />, category: 'Reports' },
    { name: 'Shared Documents', path: '/dashboard/teacher/documents', icon: <FolderOpen size={18} />, category: 'Reports' },
    ...(user?.role === 'admin' ? [{ name: 'Admin Dashboard', path: '/dashboard/admin', icon: <Shield size={18} />, category: 'Administration' }] : []),
  ];

  return (
    <AppShell
      title="Faculty Workspace"
      navItems={navItems}
      roleBadge={{ label: 'Faculty', color: 'badge-emerald' }}
    >
      {children}
    </AppShell>
  );
};

export default TeacherLayout;
