/**
 * EduTalentX Mobile Design System Tokens
 * ──────────────────────────────────────
 * Clean, minimal SaaS aesthetic tailored for high legibility on mobile devices.
 * - Pure white background (#ffffff)
 * - Deep, readable charcoal typography (#09090b, #27272a)
 * - Subtle borders (#e4e4e7)
 * - EduTalentX Blue accent (#2563eb)
 * - Compact corner radius (6-8px)
 * - Accessible touch targets (minimum 44x44)
 */

export const colors = {
  // Backgrounds
  background: '#ffffff',
  surface: '#ffffff',
  surfaceSubtle: '#f8fafc',
  surfaceMuted: '#f1f5f9',

  // Typography
  textPrimary: '#09090b',
  textSecondary: '#3f3f46',
  textMuted: '#71717a',
  textSubtle: '#a1a1aa',
  textInverse: '#ffffff',

  // Borders & Dividers
  border: '#e4e4e7',
  borderLight: '#f4f4f5',
  borderDark: '#d4d4d8',

  // Brand / Primary
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  primaryBorder: '#bfdbfe',

  // Semantic Statuses
  success: '#16a34a',
  successLight: '#f0fdf4',
  successBorder: '#bbf7d0',
  
  warning: '#d97706',
  warningLight: '#fffbeb',
  warningBorder: '#fde68a',

  danger: '#dc2626',
  dangerLight: '#fef2f2',
  dangerBorder: '#fecaca',

  info: '#0284c7',
  infoLight: '#f0f9ff',
  infoBorder: '#bae6fd',

  purple: '#7c3aed',
  purpleLight: '#f5f3ff',
  purpleBorder: '#ddd6fe',
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
  },
  lineHeight: {
    xs: 15,
    sm: 18,
    base: 22,
    md: 24,
    lg: 26,
    xl: 28,
    xxl: 32,
    title: 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  full: 9999,
};

export const touchTarget = {
  minHeight: 44,
  minWidth: 44,
};

export const shadows = {
  none: {},
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
};
