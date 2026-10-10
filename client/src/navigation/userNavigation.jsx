import React from 'react';
import {
  LayoutDashboard,
  User,
  Target,
  FlaskConical,
  GraduationCap,
  GitBranch,
  Briefcase,
  FileText,
  Award,
  BarChart3,
  Bell,
  Settings,
  QrCode,
} from 'lucide-react';

export const userNavItems = [
  { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} />, category: 'Main' },
  { name: 'Profile', path: '/dashboard/availability', icon: <User size={18} />, category: 'Main' },
  { name: 'Career Match', path: '/dashboard/career-match', icon: <Target size={18} />, category: 'Main' },
  { name: 'Career Lab', path: '/dashboard/career-lab', icon: <FlaskConical size={18} />, category: 'Main' },
  { name: 'Learning & Growth', path: '/student/career-roadmap', icon: <GraduationCap size={18} />, category: 'Main' },
  { name: 'GitHub Intelligence', path: '/dashboard/link', icon: <GitBranch size={18} />, category: 'Main' },
  { name: 'Internships', path: '/dashboard/jobs', icon: <Briefcase size={18} />, category: 'Main' },
  { name: 'Applications', path: '/dashboard/jobs', icon: <FileText size={18} />, category: 'Main' },
  { name: 'Certificates', path: '/dashboard/documents', icon: <Award size={18} />, category: 'Main' },
  { name: 'Analytics', path: '/dashboard/insights', icon: <BarChart3 size={18} />, category: 'Reports' },
  { name: 'Notifications', path: '/dashboard/notifications', icon: <Bell size={18} />, badge: true, category: 'Reports' },
  { name: 'Settings', path: '/change-password', icon: <Settings size={18} />, category: 'Reports' },
];

export const userQuickActions = [
  { name: 'Public Profile', type: 'public_profile', icon: <QrCode size={18} /> },
];
