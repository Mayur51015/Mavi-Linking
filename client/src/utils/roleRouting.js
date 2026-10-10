/**
 * Role Routing & Normalization Utilities
 * ──────────────────────────────────────
 * Central single-source-of-truth for role identification,
 * layout dispatch, and role-based notification routing.
 */

/**
 * Normalizes user object or role string to one of the canonical role identifiers:
 * - 'owner'
 * - 'super_admin'
 * - 'institution_admin'
 * - 'department_admin'
 * - 'teacher'
 * - 'recruiter'
 * - 'student'
 *
 * @param {Object|string} user - User document or role string
 * @returns {string} Canonical role identifier
 */
export const getUserPrimaryRole = (user) => {
  if (!user) return 'student';

  const userObj = typeof user === 'object' ? user : { role: user };
  const userRoles = Array.isArray(userObj.roles) && userObj.roles.length > 0
    ? userObj.roles
    : [userObj.role];

  const primaryRoleStr = String(userObj.role || '').toLowerCase().trim();
  const allRoles = userRoles.map((r) => String(r || '').toLowerCase().trim());

  // 1. Platform Owner (Highest Authority)
  if (
    allRoles.includes('platform_owner') ||
    allRoles.includes('owner') ||
    primaryRoleStr === 'platform_owner' ||
    primaryRoleStr === 'owner' ||
    userObj.adminId === 'ETX-OWNER-001' ||
    String(userObj.adminId || '').toUpperCase().startsWith('MAVI-OWNER') ||
    String(userObj.email || '').toLowerCase() === 'mayur1718khandare@gmail.com' ||
    String(userObj.email || '').toLowerCase() === 'owner@edutalentx.com'
  ) {
    return 'owner';
  }

  // 2. Platform Super Admin
  if (
    allRoles.includes('super_admin') ||
    primaryRoleStr === 'super_admin'
  ) {
    return 'super_admin';
  }

  // 3. Department Admin / HOD
  if (
    allRoles.includes('department_admin') ||
    primaryRoleStr === 'department_admin' ||
    allRoles.includes('hod') ||
    primaryRoleStr === 'hod'
  ) {
    return 'department_admin';
  }

  // 4. Institution Administrator
  if (
    allRoles.includes('institution_admin') ||
    allRoles.includes('admin') ||
    primaryRoleStr === 'institution_admin' ||
    primaryRoleStr === 'admin'
  ) {
    return 'institution_admin';
  }

  // 5. Faculty / Teacher
  if (
    allRoles.includes('teacher') ||
    allRoles.includes('faculty') ||
    allRoles.includes('professor') ||
    primaryRoleStr === 'teacher' ||
    primaryRoleStr === 'faculty' ||
    primaryRoleStr === 'professor'
  ) {
    return 'teacher';
  }

  // 6. Recruiter
  if (
    allRoles.includes('recruiter') ||
    primaryRoleStr === 'recruiter'
  ) {
    return 'recruiter';
  }

  // 7. Student / User (Default)
  return 'student';
};

/**
 * Returns human-readable role title and badge configuration
 *
 * @param {Object|string} user
 * @returns {{ title: string, badgeLabel: string, badgeColor: string }}
 */
export const getRoleDisplayInfo = (user) => {
  const role = getUserPrimaryRole(user);
  switch (role) {
    case 'owner':
      return {
        title: 'Platform Owner Console',
        badgeLabel: 'Platform Owner',
        badgeColor: 'badge-purple',
      };
    case 'super_admin':
      return {
        title: 'Platform Super Admin Console',
        badgeLabel: 'Super Admin',
        badgeColor: 'badge-purple',
      };
    case 'department_admin':
      return {
        title: 'Department Admin Portal',
        badgeLabel: 'Department Admin',
        badgeColor: 'badge-cyan',
      };
    case 'institution_admin':
      return {
        title: 'Institution Admin Console',
        badgeLabel: 'Institution Admin',
        badgeColor: 'badge-primary',
      };
    case 'teacher':
      return {
        title: 'Faculty Workspace',
        badgeLabel: 'Faculty',
        badgeColor: 'badge-emerald',
      };
    case 'recruiter':
      return {
        title: 'Recruiter Intelligence Portal',
        badgeLabel: 'Recruiter',
        badgeColor: 'badge-amber',
      };
    case 'student':
    default:
      return {
        title: 'Student Intelligence',
        badgeLabel: 'Student',
        badgeColor: 'badge-blue',
      };
  }
};

/**
 * Resolves the role-specific notifications page URL for navigation
 *
 * @param {Object} user
 * @returns {string} Target notifications route
 */
export const getNotificationRouteForRole = (user) => {
  const role = getUserPrimaryRole(user);
  switch (role) {
    case 'owner':
      return '/owner/notifications';
    case 'super_admin':
      return '/super-admin/notifications';
    case 'institution_admin':
      return '/admin/notifications';
    case 'department_admin':
      return '/department-admin/notifications';
    case 'teacher':
      return '/dashboard/teacher/notifications';
    case 'recruiter':
      return '/dashboard/recruiter/notifications';
    case 'student':
    default:
      return '/dashboard/notifications';
  }
};

/**
 * Provides role-tailored notification category tabs for the notification center
 *
 * @param {string} role - Canonical role string
 * @returns {Array<{ id: string, label: string }>}
 */
export const getRoleCategoryTabs = (role) => {
  switch (role) {
    case 'teacher':
      return [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'institution', label: 'Academic & Verification' },
        { id: 'placement', label: 'Placement Drives' },
        { id: 'system', label: 'Announcements & System' },
        { id: 'account', label: 'Account' },
      ];
    case 'recruiter':
      return [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'placement', label: 'Candidates & Pipeline' },
        { id: 'system', label: 'Job Drives & Notices' },
        { id: 'account', label: 'Account' },
      ];
    case 'department_admin':
      return [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'institution', label: 'Department Requests' },
        { id: 'placement', label: 'Placement Updates' },
        { id: 'system', label: 'Circulars & Reports' },
        { id: 'account', label: 'Account' },
      ];
    case 'institution_admin':
      return [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'institution', label: 'Institution Operations' },
        { id: 'placement', label: 'Placements & Hiring' },
        { id: 'system', label: 'Audit & System' },
        { id: 'account', label: 'Account & Billing' },
      ];
    case 'super_admin':
    case 'owner':
      return [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'institution', label: 'Institutions & Tenants' },
        { id: 'platform', label: 'Platform & Security' },
        { id: 'system', label: 'Audit & System' },
        { id: 'account', label: 'Licensing & Billing' },
      ];
    case 'student':
    default:
      return [
        { id: 'all', label: 'All' },
        { id: 'unread', label: 'Unread' },
        { id: 'career', label: 'Career & Skills' },
        { id: 'placement', label: 'Placements & Jobs' },
        { id: 'platform', label: 'Developer Sync' },
        { id: 'institution', label: 'Institution' },
        { id: 'account', label: 'Account' },
        { id: 'system', label: 'System' },
      ];
  }
};

/**
 * Resolves the primary dashboard route for any user or role identifier.
 *
 * @param {Object|string} user - User document or canonical/raw role
 * @returns {string} Role-specific dashboard route
 */
export const getDashboardRouteForRole = (user) => {
  const role = getUserPrimaryRole(user);
  switch (role) {
    case 'owner':
      return '/owner';
    case 'super_admin':
      return '/super-admin';
    case 'department_admin':
      return '/department-admin';
    case 'institution_admin':
      return '/admin';
    case 'teacher':
      return '/dashboard/teacher';
    case 'recruiter':
      return '/dashboard/recruiter';
    case 'student':
    default:
      return '/dashboard';
  }
};

/**
 * Validates whether a return destination path is a safe, internal route.
 * Rejects external URLs, scheme-based protocols, protocol-relative paths,
 * self-referencing edit loops, and unauthorized non-student attempts to land on the Student dashboard.
 *
 * @param {string} path - Target URL path
 * @param {Object|string|null} user - Optional user context for role authorization checks
 * @returns {boolean} True if safe and valid internal destination
 */
export const isValidInternalReturnPath = (path, user = null) => {
  if (typeof path !== 'string' || !path.trim()) return false;
  const trimmed = path.trim();

  // Must begin with a single slash (reject external / protocol-relative URLs like '//evil.com')
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return false;

  // Extract path without query parameters or hash fragments
  const [cleanPath] = trimmed.split(/[?#]/);

  // Reject any embedded URL schemes (e.g. javascript:, http:, https:, data:) or backslashes
  if (cleanPath.includes(':') || cleanPath.includes('\\')) return false;

  // Reject returning to edit routes (prevents redirect loops)
  if (cleanPath === '/profile/edit') return false;
  try {
    const url = new URL(trimmed, 'https://edutalentx.internal');
    if (url.searchParams.get('edit') === 'true') return false;
  } catch {
    if (trimmed.includes('edit=true')) return false;
  }

  // Role authorization boundary: non-student roles should NEVER be redirected to Student dashboard
  if (user) {
    const primaryRole = getUserPrimaryRole(user);
    if (primaryRole !== 'student') {
      if (cleanPath === '/dashboard' || cleanPath.startsWith('/student/')) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Resolves the destination route following an edit close/cancel/save action:
 * Priority:
 * 1. Valid internal `returnTo` route if provided and authorized for the user
 * 2. Authenticated user's canonical role-specific dashboard
 *
 * @param {string|null|undefined} returnTo - Originating route passed via location.state
 * @param {Object|string|null} user - Current authenticated user
 * @returns {string} Final safe destination route
 */
export const resolvePostEditReturnPath = (returnTo, user) => {
  if (returnTo && isValidInternalReturnPath(returnTo, user)) {
    return returnTo;
  }
  return getDashboardRouteForRole(user);
};
