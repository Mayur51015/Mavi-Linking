import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  BarChart3,
  Search,
  GitPullRequest,
  Bookmark,
  Users,
  Briefcase,
  Building2,
  Shield,
} from 'lucide-react';
import AppShell from '../components/shell/AppShell';

const RecruiterLayout = ({ children }) => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { name: 'Overview', path: '/dashboard/recruiter', icon: <BarChart3 size={18} />, category: 'Overview' },
    { name: 'Talent Search', path: '/dashboard/recruiter/search', icon: <Search size={18} />, category: 'Talent' },
    { name: 'Compare Candidates', path: '/dashboard/recruiter/compare', icon: <Users size={18} />, category: 'Talent' },
    { name: 'Candidate Bookmarks', path: '/dashboard/recruiter/bookmarks', icon: <Bookmark size={18} />, category: 'Talent' },
    { name: 'Hiring Pipeline', path: '/dashboard/recruiter/pipeline', icon: <GitPullRequest size={18} />, category: 'Recruitment' },
    { name: 'Job Postings', path: '/dashboard/recruiter/jobs', icon: <Briefcase size={18} />, category: 'Recruitment' },
    { name: 'Company Profile', path: '/dashboard/recruiter/company', icon: <Building2 size={18} />, category: 'Organization' },
    ...(user?.role === 'admin' ? [{ name: 'Admin Dashboard', path: '/dashboard/admin', icon: <Shield size={18} />, category: 'Organization' }] : []),
  ];

  return (
    <AppShell
      title="Recruiter Intelligence Portal"
      navItems={navItems}
      roleBadge={{ label: 'Recruiter', color: 'badge-amber' }}
    >
      {children}
    </AppShell>
  );
};

export default RecruiterLayout;
