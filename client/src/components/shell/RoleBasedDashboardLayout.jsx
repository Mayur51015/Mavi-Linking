import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getUserPrimaryRole } from '../../utils/roleRouting';

import UserLayout from '../../layouts/UserLayout';
import TeacherLayout from '../../layouts/TeacherLayout';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import InstitutionAdminLayout from '../../layouts/InstitutionAdminLayout';
import DepartmentAdminLayout from '../../layouts/DepartmentAdminLayout';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import PlatformOwnerLayout from '../../layouts/PlatformOwnerLayout';

/**
 * RoleBasedDashboardLayout
 * ────────────────────────
 * Dynamically wraps child views in the authenticated user's native role layout shell,
 * ensuring sidebar, topbar, branding, and role badges faithfully reflect the user's role.
 *
 * Prevents non-student roles (Faculty, Recruiter, Admins, Owner) from ever
 * falling back to the Student Dashboard shell when accessing shared features.
 */
const RoleBasedDashboardLayout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const primaryRole = getUserPrimaryRole(user);

  switch (primaryRole) {
    case 'owner':
      return <PlatformOwnerLayout>{children}</PlatformOwnerLayout>;

    case 'super_admin':
      return <SuperAdminLayout>{children}</SuperAdminLayout>;

    case 'department_admin':
      return <DepartmentAdminLayout>{children}</DepartmentAdminLayout>;

    case 'institution_admin':
      return <InstitutionAdminLayout>{children}</InstitutionAdminLayout>;

    case 'teacher':
      return <TeacherLayout>{children}</TeacherLayout>;

    case 'recruiter':
      return <RecruiterLayout>{children}</RecruiterLayout>;

    case 'student':
    default:
      return <UserLayout>{children}</UserLayout>;
  }
};

export default RoleBasedDashboardLayout;
