/**
 * Placement & Recruitment Status Constants
 * ─────────────────────────────────────────
 * Single source of truth for all placement/recruitment statuses
 * used across the entire frontend (badges, filters, dashboards, APIs).
 */

// ─── Candidate Lifecycle Statuses ───────────────────────────────────────────
export const PLACEMENT_STATUSES = [
  'Available for Hiring',
  'Under Review',
  'Interview Scheduled',
  'Offer Received',
  'Offer Accepted',
  'Placed / Hired',
  'Not Available',
  'Open to Opportunities',
];

// ─── Pipeline Statuses ──────────────────────────────────────────────────────
export const PIPELINE_STATUSES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Technical Round',
  'HR Round',
  'Selected',
  'Offer Sent',
  'Offer Received',
  'Offer Accepted',
  'Joined',
  'Placed',
  'Rejected',
];

// ─── Badge Color Mapping ────────────────────────────────────────────────────
export const STATUS_BADGE_MAP = {
  'Available for Hiring': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '✅' },
  'Under Review':         { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: '🔍' },
  'Interview Scheduled':  { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: '📅' },
  'Offer Received':       { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: '📩' },
  'Offer Accepted':       { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: '🤝' },
  'Placed / Hired':       { color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', icon: '🎓' },
  'Not Available':        { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '🚫' },
  'Open to Opportunities': { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: '💡' },

  // Pipeline statuses
  'Applied':              { color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.15)', icon: '📋' },
  'Shortlisted':          { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: '⭐' },
  'Technical Round':      { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: '💻' },
  'HR Round':             { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: '👤' },
  'Selected':             { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: '🎉' },
  'Offer Sent':           { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: '✉️' },
  'Joined':               { color: '#10b981', bg: 'rgba(16, 185, 129, 0.25)', icon: '🚀' },
  'Rejected':             { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '❌' },
  'Placed':               { color: '#10b981', bg: 'rgba(16, 185, 129, 0.25)', icon: '🎓' },
};

// ─── Notification Type Labels ───────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  pipeline_started: { label: 'Pipeline Started', color: '#3b82f6' },
  status_update: { label: 'Status Update', color: '#f59e0b' },
  interview_scheduled: { label: 'Interview Scheduled', color: '#8b5cf6' },
  offer_received: { label: 'Offer Received', color: '#ec4899' },
  offer_accepted: { label: 'Offer Accepted', color: '#06b6d4' },
  placement_confirmed: { label: 'Placement Confirmed', color: '#10b981' },
  message: { label: 'Message', color: '#a1a1aa' },
  general: { label: 'Notification', color: '#a1a1aa' },
};
