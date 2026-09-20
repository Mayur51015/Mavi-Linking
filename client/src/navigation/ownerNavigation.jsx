import React from 'react';
import {
  Crown,
  Building,
  UserCheck,
  Users,
  KeyRound,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Sliders,
  FileText,
  Settings,
} from 'lucide-react';

export const ownerNavItems = [
  { id: 'overview', name: 'Platform Overview', path: '/owner/overview', icon: <Crown size={20} />, category: 'Overview' },
  { id: 'tenants', name: 'Tenants / Institutions', path: '/owner/tenants', icon: <Building size={20} />, category: 'Tenants' },
  { id: 'admins', name: 'Admin Management', path: '/owner/admins', icon: <UserCheck size={20} />, category: 'Tenants' },
  { id: 'users', name: 'Platform Users', path: '/owner/users', icon: <Users size={20} />, category: 'Tenants' },
  { id: 'licensing', name: 'Licensing', path: '/owner/licensing', icon: <KeyRound size={20} />, category: 'Governance' },
  { id: 'subscriptions', name: 'Subscriptions', path: '/owner/subscriptions', icon: <CreditCard size={20} />, category: 'Governance' },
  { id: 'analytics', name: 'Global Analytics', path: '/owner/analytics', icon: <BarChart3 size={20} />, category: 'Governance' },
  { id: 'security', name: 'Security Center', path: '/owner/security', icon: <ShieldAlert size={20} />, category: 'Governance' },
  { id: 'system', name: 'System Configuration', path: '/owner/configuration', icon: <Sliders size={20} />, category: 'Administration' },
  { id: 'audit', name: 'Global Audit Logs', path: '/owner/audit-logs', icon: <FileText size={20} />, category: 'Administration' },
  { id: 'settings', name: 'Owner Settings', path: '/owner/settings', icon: <Settings size={20} />, category: 'Administration' },
];
