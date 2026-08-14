import React from 'react';
import {
  LayoutDashboard,
  Building,
  UserCheck,
  Users,
  ShieldCheck,
  KeyRound,
  BarChart3,
  ShieldAlert,
  FileText,
  Sliders,
  User,
} from 'lucide-react';

export const superAdminNavItems = [
  { id: 'overview', name: 'Platform Overview', path: '/super-admin', icon: <LayoutDashboard size={20} /> },
  { id: 'institutions', name: 'Institutions', path: '/super-admin/institutions', icon: <Building size={20} /> },
  { id: 'institution-admins', name: 'Institution Admins', path: '/super-admin/institution-admins', icon: <UserCheck size={20} /> },
  { id: 'users', name: 'Users', path: '/super-admin/users', icon: <Users size={20} /> },
  { id: 'verification', name: 'Verification Oversight', path: '/super-admin/verification', icon: <ShieldCheck size={20} /> },
  { id: 'licenses', name: 'Licenses', path: '/super-admin/licenses', icon: <KeyRound size={20} /> },
  { id: 'analytics', name: 'Platform Analytics', path: '/super-admin/analytics', icon: <BarChart3 size={20} /> },
  { id: 'security', name: 'Security Center', path: '/super-admin/security', icon: <ShieldAlert size={20} /> },
  { id: 'audit-logs', name: 'Audit Logs', path: '/super-admin/audit-logs', icon: <FileText size={20} /> },
  { id: 'settings', name: 'Platform Settings', path: '/super-admin/settings', icon: <Sliders size={20} /> },
  { id: 'profile', name: 'Super Admin Profile', path: '/super-admin/profile', icon: <User size={20} /> },
];
