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
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { name: 'Profile', path: '/dashboard/availability', icon: <User size={18} /> },
  { name: 'Career Match', path: '/dashboard/career-match', icon: <Target size={18} /> },
  { name: 'Career Lab', path: '/dashboard/career-lab', icon: <FlaskConical size={18} /> },
  { name: 'Learning & Growth', path: '/student/career-roadmap', icon: <GraduationCap size={18} /> },
  { name: 'GitHub Intelligence', path: '/dashboard/link', icon: <GitBranch size={18} /> },
  { name: 'Internships', path: '/dashboard/jobs', icon: <Briefcase size={18} /> },
  { name: 'Applications', path: '/dashboard/jobs', icon: <FileText size={18} /> },
  { name: 'Certificates', path: '/dashboard/documents', icon: <Award size={18} /> },
  { name: 'Reports', path: '/dashboard/insights', icon: <BarChart3 size={18} /> },
  { name: 'Notifications', path: '/dashboard/notifications', icon: <Bell size={18} />, badge: true },
  { name: 'Settings', path: '/change-password', icon: <Settings size={18} /> },
];

export const userQuickActions = [
  { name: 'Public Profile', type: 'public_profile', icon: <QrCode size={18} /> },
];
