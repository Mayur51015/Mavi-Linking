/**
 * EduTalentX Mobile Type Definitions
 * ─────────────────────────────────
 * Fully typed data models reflecting the backend MongoDB models and REST payloads.
 */

export type CanonicalRole =
  | 'student'
  | 'teacher'
  | 'recruiter'
  | 'department_admin'
  | 'institution_admin'
  | 'super_admin'
  | 'owner';

export type AccountStatus =
  | 'ACTIVE'
  | 'PENDING_VERIFICATION'
  | 'PENDING_ADMIN_APPROVAL'
  | 'SUSPENDED'
  | 'REJECTED';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  etxId?: string;
  prn?: string;
  adminId?: string;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  avatar?: string;
  headline?: string;
  bio?: string;
  phone?: string;
  institutionId?: string | { _id: string; name: string; code: string };
  departmentId?: string | { _id: string; name: string; code: string };
  department?: string;
  batch?: string;
  cgpa?: number;
  skills?: string[];
  preferredRole?: string;
  preferredDomain?: string;
  githubUsername?: string;
  leetcodeUsername?: string;
  codeforcesUsername?: string;
  overallScore?: number;
  readinessScore?: number;
  companyName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  companyName?: string;
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  workplaceType?: 'Remote' | 'On-site' | 'Hybrid';
  description: string;
  requirements?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  stipend?: string;
  minCgpa?: number;
  eligibleDepartments?: string[];
  deadline?: string;
  status: 'active' | 'closed' | 'draft';
  applicantsCount?: number;
  hasApplied?: boolean;
  createdAt: string;
}

export type PipelineStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'placed'
  | 'rejected';

export interface Pipeline {
  _id: string;
  studentId: string | User;
  recruiterId: string | User;
  jobId: string | Job;
  stage: PipelineStage;
  status: 'active' | 'completed' | 'withdrawn' | 'rejected';
  score?: number;
  interviewDetails?: {
    scheduledDate?: string;
    interviewLink?: string;
    notes?: string;
    round?: string;
  };
  offerDetails?: {
    salary?: number;
    designation?: string;
    joiningDate?: string;
    offerLetterUrl?: string;
  };
  timeline?: Array<{
    stage: PipelineStage;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementDrive {
  _id: string;
  title: string;
  companyName: string;
  companyId?: string;
  date: string;
  venue?: string;
  description?: string;
  eligibilityCriteria?: {
    minCgpa?: number;
    departments?: string[];
    allowedBacklogs?: number;
  };
  rounds?: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  enrolledStudentsCount?: number;
  createdAt: string;
}

export type NotificationCategory =
  | 'all'
  | 'unread'
  | 'career'
  | 'placement'
  | 'institution'
  | 'system'
  | 'account';

export interface AppNotification {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  type: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface StudentAvailability {
  isAvailableForPlacement: boolean;
  targetRole?: string;
  preferredLocations?: string[];
  expectedSalary?: string;
  noticePeriod?: string;
  resumeUrl?: string;
  lastUpdated?: string;
}

export interface CareerMatchRole {
  role: string;
  matchScore: number;
  strongSkills: Array<{ skill: string; evidence: string }>;
  skillGaps: Array<{ skill: string; importance: string; recommendation?: string }>;
  isTargetRole?: boolean;
}

export interface GitHubIntelligence {
  username: string;
  totalCommits?: number;
  pullRequestsOpened?: number;
  pullRequestsMerged?: number;
  mergeRate?: number;
  codeReviewsCount?: number;
  topLanguages?: Array<{ language: string; percentage: number }>;
  qualityScore?: number;
  lastSyncedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
