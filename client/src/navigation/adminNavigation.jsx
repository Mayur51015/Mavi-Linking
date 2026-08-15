import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  CheckSquare,
  Building,
  Megaphone,
  FileText,
  BarChart3,
  FolderOpen,
  ShieldAlert,
  Settings,
  UserCheck,
  CreditCard,
} from 'lucide-react';

export const adminNavItems = [
  { id: 'overview', name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
  { id: 'students', name: 'Students', path: '/admin/students', icon: <GraduationCap size={20} /> },
  { id: 'teachers', name: 'Teachers', path: '/admin/teachers', icon: <Users size={20} /> },
  { id: 'recruiters', name: 'Recruiters', path: '/admin/recruiters', icon: <Briefcase size={20} /> },
  { id: 'verifications', name: 'Verification Requests', path: '/admin/verifications', icon: <CheckSquare size={20} /> },
  { id: 'departments', name: 'Departments', path: '/admin/departments', icon: <Building size={20} /> },
  { id: 'announcements', name: 'Announcements', path: '/admin/announcements', icon: <Megaphone size={20} /> },
  { id: 'reports', name: 'Reports', path: '/admin/reports', icon: <FileText size={20} /> },
  { id: 'analytics', name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
  { id: 'documents', name: 'Shared Documents', path: '/admin/documents', icon: <FolderOpen size={20} /> },
  { id: 'billing', name: 'Billing & Subscription', path: '/admin/billing', icon: <CreditCard size={20} /> },
  { id: 'audit-logs', name: 'Audit Logs', path: '/admin/audit-logs', icon: <ShieldAlert size={20} /> },
  { id: 'settings', name: 'Institution Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  { id: 'profile', name: 'Admin Profile', path: '/admin/profile', icon: <UserCheck size={20} /> },
];
