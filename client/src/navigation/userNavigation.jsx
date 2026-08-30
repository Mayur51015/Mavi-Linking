import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  User,
  Link as LinkIcon,
  BarChart3,
  Heart,
  Megaphone,
  FolderOpen,
  QrCode,
  Compass,
  Target,
  FlaskConical,
} from 'lucide-react';

export const userNavItems = [
  { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Career Lab', path: '/dashboard/career-lab', icon: <FlaskConical size={20} /> },
  { name: 'Career Match', path: '/dashboard/career-match', icon: <Target size={20} /> },
  { name: 'Career Roadmap', path: '/student/career-roadmap', icon: <Compass size={20} /> },
  { name: 'Projects', path: '/dashboard/projects', icon: <Briefcase size={20} /> },
  { name: 'Availability', path: '/dashboard/availability', icon: <User size={20} /> },
  { name: 'Link Accounts', path: '/dashboard/link', icon: <LinkIcon size={20} /> },
  { name: 'AI Insights', path: '/dashboard/insights', icon: <BarChart3 size={20} /> },
  { name: 'Compatibility', path: '/dashboard/compatibility', icon: <Heart size={20} /> },
  { name: 'Announcements', path: '/dashboard/announcements', icon: <Megaphone size={20} /> },
  { name: 'Shared Documents', path: '/dashboard/documents', icon: <FolderOpen size={20} /> },
];

export const userQuickActions = [
  { name: 'Public Profile', type: 'public_profile', icon: <QrCode size={20} /> },
];
