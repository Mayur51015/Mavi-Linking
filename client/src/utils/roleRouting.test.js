import { describe, it, expect } from 'vitest';
import {
  getUserPrimaryRole,
  getRoleDisplayInfo,
  getNotificationRouteForRole,
  getRoleCategoryTabs,
  getDashboardRouteForRole,
  isValidInternalReturnPath,
  resolvePostEditReturnPath,
} from './roleRouting';

describe('Role Routing & Normalization Utilities', () => {
  describe('getUserPrimaryRole', () => {
    it('correctly identifies Student / User', () => {
      expect(getUserPrimaryRole({ role: 'user' })).toBe('student');
      expect(getUserPrimaryRole({ role: 'student' })).toBe('student');
      expect(getUserPrimaryRole({ roles: ['user'] })).toBe('student');
      expect(getUserPrimaryRole(null)).toBe('student');
    });

    it('correctly identifies Faculty / Teacher', () => {
      expect(getUserPrimaryRole({ role: 'teacher' })).toBe('teacher');
      expect(getUserPrimaryRole({ role: 'faculty' })).toBe('teacher');
      expect(getUserPrimaryRole({ role: 'professor' })).toBe('teacher');
      expect(getUserPrimaryRole({ roles: ['teacher'] })).toBe('teacher');
    });

    it('correctly identifies Recruiter', () => {
      expect(getUserPrimaryRole({ role: 'recruiter' })).toBe('recruiter');
      expect(getUserPrimaryRole({ roles: ['recruiter'] })).toBe('recruiter');
    });

    it('correctly identifies Department Admin / HOD', () => {
      expect(getUserPrimaryRole({ role: 'department_admin' })).toBe('department_admin');
      expect(getUserPrimaryRole({ role: 'hod' })).toBe('department_admin');
      expect(getUserPrimaryRole({ roles: ['department_admin'] })).toBe('department_admin');
    });

    it('correctly identifies Institution Admin', () => {
      expect(getUserPrimaryRole({ role: 'institution_admin' })).toBe('institution_admin');
      expect(getUserPrimaryRole({ role: 'admin' })).toBe('institution_admin');
      expect(getUserPrimaryRole({ roles: ['institution_admin'] })).toBe('institution_admin');
    });

    it('correctly identifies Platform Super Admin', () => {
      expect(getUserPrimaryRole({ role: 'super_admin' })).toBe('super_admin');
      expect(getUserPrimaryRole({ roles: ['super_admin'] })).toBe('super_admin');
    });

    it('correctly identifies Platform Owner', () => {
      expect(getUserPrimaryRole({ role: 'owner' })).toBe('owner');
      expect(getUserPrimaryRole({ role: 'platform_owner' })).toBe('owner');
      expect(getUserPrimaryRole({ roles: ['platform_owner', 'super_admin'] })).toBe('owner');
      expect(getUserPrimaryRole({ email: 'mayur1718khandare@gmail.com' })).toBe('owner');
      expect(getUserPrimaryRole({ adminId: 'ETX-OWNER-001' })).toBe('owner');
    });
  });

  describe('getNotificationRouteForRole', () => {
    it('returns dedicated routes for every authenticated role', () => {
      expect(getNotificationRouteForRole({ role: 'teacher' })).toBe('/dashboard/teacher/notifications');
      expect(getNotificationRouteForRole({ role: 'recruiter' })).toBe('/dashboard/recruiter/notifications');
      expect(getNotificationRouteForRole({ role: 'department_admin' })).toBe('/department-admin/notifications');
      expect(getNotificationRouteForRole({ role: 'institution_admin' })).toBe('/admin/notifications');
      expect(getNotificationRouteForRole({ role: 'super_admin' })).toBe('/super-admin/notifications');
      expect(getNotificationRouteForRole({ role: 'owner' })).toBe('/owner/notifications');
      expect(getNotificationRouteForRole({ role: 'user' })).toBe('/dashboard/notifications');
    });
  });

  describe('getRoleDisplayInfo', () => {
    it('returns accurate title and badge config per role', () => {
      expect(getRoleDisplayInfo({ role: 'teacher' })).toEqual({
        title: 'Faculty Workspace',
        badgeLabel: 'Faculty',
        badgeColor: 'badge-emerald',
      });
      expect(getRoleDisplayInfo({ role: 'recruiter' })).toEqual({
        title: 'Recruiter Intelligence Portal',
        badgeLabel: 'Recruiter',
        badgeColor: 'badge-amber',
      });
      expect(getRoleDisplayInfo({ role: 'super_admin' })).toEqual({
        title: 'Platform Super Admin Console',
        badgeLabel: 'Super Admin',
        badgeColor: 'badge-purple',
      });
      expect(getRoleDisplayInfo({ role: 'owner' })).toEqual({
        title: 'Platform Owner Console',
        badgeLabel: 'Platform Owner',
        badgeColor: 'badge-purple',
      });
    });
  });

  describe('getRoleCategoryTabs', () => {
    it('returns role-specific notification filter tabs', () => {
      const teacherTabs = getRoleCategoryTabs('teacher');
      expect(teacherTabs.some((t) => t.id === 'institution' && t.label.includes('Academic'))).toBe(true);

      const recruiterTabs = getRoleCategoryTabs('recruiter');
      expect(recruiterTabs.some((t) => t.id === 'placement' && t.label.includes('Candidates'))).toBe(true);

      const ownerTabs = getRoleCategoryTabs('owner');
      expect(ownerTabs.some((t) => t.id === 'platform' && t.label.includes('Platform'))).toBe(true);

      const studentTabs = getRoleCategoryTabs('student');
      expect(studentTabs.some((t) => t.id === 'career' && t.label.includes('Career'))).toBe(true);
    });
  });

  describe('getDashboardRouteForRole', () => {
    it('returns exact role-specific dashboards for all seven canonical roles', () => {
      // 1. Student
      expect(getDashboardRouteForRole({ role: 'user' })).toBe('/dashboard');
      expect(getDashboardRouteForRole({ role: 'student' })).toBe('/dashboard');
      expect(getDashboardRouteForRole(null)).toBe('/dashboard');

      // 2. Teacher / Faculty
      expect(getDashboardRouteForRole({ role: 'teacher' })).toBe('/dashboard/teacher');
      expect(getDashboardRouteForRole({ role: 'faculty' })).toBe('/dashboard/teacher');
      expect(getDashboardRouteForRole({ role: 'professor' })).toBe('/dashboard/teacher');

      // 3. Recruiter
      expect(getDashboardRouteForRole({ role: 'recruiter' })).toBe('/dashboard/recruiter');

      // 4. Institution Admin / Admin
      expect(getDashboardRouteForRole({ role: 'institution_admin' })).toBe('/admin');
      expect(getDashboardRouteForRole({ role: 'admin' })).toBe('/admin');

      // 5. Department Admin / HOD
      expect(getDashboardRouteForRole({ role: 'department_admin' })).toBe('/department-admin');
      expect(getDashboardRouteForRole({ role: 'hod' })).toBe('/department-admin');

      // 6. Platform Super Admin
      expect(getDashboardRouteForRole({ role: 'super_admin' })).toBe('/super-admin');

      // 7. Platform Owner
      expect(getDashboardRouteForRole({ role: 'owner' })).toBe('/owner');
      expect(getDashboardRouteForRole({ role: 'platform_owner' })).toBe('/owner');
    });
  });

  describe('isValidInternalReturnPath', () => {
    it('accepts safe internal paths with queries', () => {
      expect(isValidInternalReturnPath('/dashboard/teacher')).toBe(true);
      expect(isValidInternalReturnPath('/admin/settings')).toBe(true);
      expect(isValidInternalReturnPath('/dashboard/recruiter/search?department=CSE&sort=score')).toBe(true);
    });

    it('rejects external URLs, protocol-relative paths, and schemes', () => {
      expect(isValidInternalReturnPath('https://evil.com')).toBe(false);
      expect(isValidInternalReturnPath('http://malicious.org')).toBe(false);
      expect(isValidInternalReturnPath('//evil.com')).toBe(false);
      expect(isValidInternalReturnPath('javascript:alert(1)')).toBe(false);
      expect(isValidInternalReturnPath('')).toBe(false);
      expect(isValidInternalReturnPath(null)).toBe(false);
    });

    it('rejects self-referencing edit loops', () => {
      expect(isValidInternalReturnPath('/profile/edit')).toBe(false);
      expect(isValidInternalReturnPath('/dashboard?edit=true')).toBe(false);
      expect(isValidInternalReturnPath('/dashboard/teacher?edit=true')).toBe(false);
    });

    it('prevents non-student roles from being directed to student dashboard', () => {
      const teacherUser = { role: 'teacher' };
      const recruiterUser = { role: 'recruiter' };
      const adminUser = { role: 'admin' };
      const studentUser = { role: 'user' };

      // Teacher / Recruiter / Admin should not have /dashboard as valid return destination
      expect(isValidInternalReturnPath('/dashboard', teacherUser)).toBe(false);
      expect(isValidInternalReturnPath('/dashboard', recruiterUser)).toBe(false);
      expect(isValidInternalReturnPath('/dashboard', adminUser)).toBe(false);
      expect(isValidInternalReturnPath('/student/career-roadmap', teacherUser)).toBe(false);

      // Student CAN have /dashboard as valid return destination
      expect(isValidInternalReturnPath('/dashboard', studentUser)).toBe(true);
      expect(isValidInternalReturnPath('/student/career-roadmap', studentUser)).toBe(true);
    });
  });

  describe('resolvePostEditReturnPath', () => {
    it('returns provided returnTo when valid and authorized', () => {
      const teacher = { role: 'teacher' };
      expect(resolvePostEditReturnPath('/dashboard/teacher/students?tab=active', teacher))
        .toBe('/dashboard/teacher/students?tab=active');

      const recruiter = { role: 'recruiter' };
      expect(resolvePostEditReturnPath('/dashboard/recruiter/pipeline', recruiter))
        .toBe('/dashboard/recruiter/pipeline');
    });

    it('falls back to role-specific dashboard when returnTo is missing or invalid', () => {
      const teacher = { role: 'teacher' };
      expect(resolvePostEditReturnPath(null, teacher)).toBe('/dashboard/teacher');
      expect(resolvePostEditReturnPath('https://evil.com', teacher)).toBe('/dashboard/teacher');
      expect(resolvePostEditReturnPath('/dashboard?edit=true', teacher)).toBe('/dashboard/teacher');
      // Unauthorized student dashboard destination for teacher
      expect(resolvePostEditReturnPath('/dashboard', teacher)).toBe('/dashboard/teacher');

      const recruiter = { role: 'recruiter' };
      expect(resolvePostEditReturnPath(undefined, recruiter)).toBe('/dashboard/recruiter');
      expect(resolvePostEditReturnPath('//evil.com', recruiter)).toBe('/dashboard/recruiter');

      const admin = { role: 'admin' };
      expect(resolvePostEditReturnPath(null, admin)).toBe('/admin');

      const superAdmin = { role: 'super_admin' };
      expect(resolvePostEditReturnPath(null, superAdmin)).toBe('/super-admin');

      const owner = { role: 'owner' };
      expect(resolvePostEditReturnPath(null, owner)).toBe('/owner');

      const student = { role: 'user' };
      expect(resolvePostEditReturnPath(null, student)).toBe('/dashboard');
      expect(resolvePostEditReturnPath('/dashboard', student)).toBe('/dashboard');
    });
  });
});
