# Phase 1 Audit Report: EduTalentX Authentication System & Supabase Migration Plan

## 1. Executive Summary & Existing Architecture

EduTalentX (MAVI-Linking) currently operates with:
- **Frontend:** React 19 + Vite (`/client`), React Router v7, Axios, Socket.IO client, Context API (`AuthContext`).
- **Backend:** Node.js + Express 5 (`/server`), Mongoose + MongoDB Atlas/Local (`User`, `Institution`, `Department`, `InstitutionMembership`, `ActivityLog`, `AuditLog`, `ExternalIdentity`, etc.).
- **Current Authentication Provider:** Custom JSON Web Tokens (`jsonwebtoken`, `bcryptjs`) with access tokens signed using `JWT_SECRET` (expiry: 7d) and token versioning (`tokenVersion`) stored in MongoDB.
- **Current Deployment:** Vercel (Frontend: `https://mavi-linking-mq7d.vercel.app`) and Render (Backend: `https://mavi-server-4yvl.onrender.com`).
- **Target Auth Provider:** Supabase Auth (`@supabase/supabase-js`) using Supabase's default email service (Custom SMTP disabled, no Brevo/Nodemailer credentials).

---

## 2. Role-Based Access Control (RBAC) & User Hierarchy

EduTalentX manages 7 primary role tiers and specialized administrative sub-roles stored in `user.role` and `user.roles`:

| Role Key | Name | Hierarchy Level | Capabilities & Access |
|---|---|---|---|
| `platform_owner` / `owner` | Platform Owner | Tier 1 (Root) | Complete platform governance, system configuration, institution approvals, master audit logs, billing management (`/owner/*`). |
| `super_admin` | Platform Super Admin | Tier 2 | Multi-tenant administration, institution onboarding, global metrics, platform-level analytics (`/super-admin/*`). |
| `institution_admin` / `admin` | Institution Admin | Tier 3 | Institution-wide tenant scope (`institutionId`). Approves student PRNs, manages departments, faculty, placement drives (`/admin/*`). |
| `department_admin` | Department Admin | Tier 4 | Department-scoped authority (`departmentId`). Manages departmental students, verification, curriculum, placement eligibility (`/department-admin/*`). |
| `teacher` / `professor` | Faculty / Teacher | Tier 5 | Teacher dashboard (`/dashboard/teacher/*`), student readiness evaluations, class leaderboards, placement drives, announcements. |
| `recruiter` | Corporate Recruiter | Tier 6 | Recruiter portal (`/dashboard/recruiter/*`), talent search, candidate bookmarks, pipeline stages, placement drives, company profile. |
| `user` / `student` | Student / Candidate | Tier 7 | Student dashboard (`/dashboard/*`), portfolio, external platform linking (GitHub, LeetCode, Codeforces), job applications, AI Career Lab. |

### Specialized Admin Sub-Roles:
`placement_admin`, `academic_admin`, `student_affairs_admin`, `exam_admin`, `finance_admin`, `training_admin`.

---

## 3. Existing Authentication Endpoints Inventory

All located in `server/src/routes/authRoutes.js` and `server/src/controllers/authController.js`:

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public (Rate-limited) | Student 3-stage registration with Institution Code, Department, PRN validation, custom SHA-256 token email generation. |
| `POST` | `/api/auth/validate-prn` | Public | Pre-validates student PRN within an institution before registration. |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Multi-identifier login: ETX ID (`ETX-...`), Admin ID (`...-ADMIN-...`), Email, or verified PRN/Faculty ID. |
| `POST` | `/api/auth/admin-login` | Public | Dedicated login for institution/super admins. |
| `POST` | `/api/auth/super-admin-login`| Public | Dedicated login for platform super admins. |
| `POST` | `/api/auth/verify-email` | Public | Validates SHA-256 verification token and activates student account. |
| `POST` | `/api/auth/resend-verification` | Public | Dispatches fresh verification email link. |
| `POST` | `/api/auth/forgot-password` | Public | Generates 6-digit OTP (10 min expiry) via Nodemailer. |
| `POST` | `/api/auth/reset-password` | Public | Validates 6-digit OTP and updates bcrypt password hash. |
| `POST` | `/api/auth/change-email-pending`| Public | Corrects mistyped email for unverified student accounts. |
| `POST` | `/api/auth/github` | Public | OAuth exchange for GitHub. |
| `POST` | `/api/auth/google` | Public (Deprecated) | Returns HTTP 410 Gone (Google auth deprecated). |
| `GET` | `/api/auth/me` | Protected (`protect`) | Fetches full authenticated user profile with populated institution. |
| `PUT` | `/api/auth/me` | Protected (`protect`) | Updates user profile details, bio, links, and documents. |
| `POST` | `/api/auth/logout` | Protected (`protect`) | Invalidates refresh token and clears active session. |
| `POST` | `/api/auth/change-password` | Protected (`protect`) | Updates password for authenticated users (enforces `mustChangePassword` removal). |
| `POST` | `/api/auth/request-role-upgrade` | Protected (`protect`) | Submits verification request for teacher or recruiter status. |
| `POST` | `/api/auth/email-change/request` | Protected (`protect`) | Initiates 2-step authenticated email change with OTP. |
| `POST` | `/api/auth/email-change/verify` | Protected (`protect`) | Verifies OTP sent to new email and updates record. |

---

## 4. Protected Route & Middleware Dependencies

All authenticated backend routes rely on `protect` in `server/src/middleware/auth.js`:
- `req.headers.authorization`: Extracts `Bearer <token>`.
- Resolves User in MongoDB: Looks up `_id` (or fallback `etxId`, `adminId`, `email`).
- Verifies `tokenVersion`, `accountStatus` (`DEACTIVATED`, `SUSPENDED`), and student verification matrix (`emailVerified`, `PENDING_ADMIN_APPROVAL`).
- Sets `req.user = user`.
- Downstream middlewares (`requireRole`, `requireAdmin`, `requireSuperAdmin`, `requireOwner`) check `req.user.role` and `req.user.roles`.

### Dependent Modules:
- `userRoutes.js`, `verificationRoutes.js`, `teacherRoutes.js`, `superAdminRoutes.js`, `scoreRoutes.js`, `recruiterRoutes.js`, `projectRoutes.js`, `platformRoutes.js`, `placementRoutes.js`, `ownerRoutes.js`, `notificationRoutes.js`, `messageRoutes.js`, `leetcodeRoutes.js`, `jobRoutes.js`, `educationRoutes.js`, `documentRoutes.js`, `departmentAdminRoutes.js`, `compatibilityRoutes.js`, `careerRoutes.js`, `careerMatchRoutes.js`, `careerLabRoutes.js`, `billingRoutes.js`, `announcementRoutes.js`, `aiRoutes.js`, `adminRoutes.js`, `activityEventRoutes.js`.

---

## 5. Existing OAuth & External Account Linking

1. **Google OAuth:** Deprecated (`/api/auth/google` returns 410 Gone).
2. **GitHub Login:** Simplified mock/endpoint in `authController.js`.
3. **External Platform Linking (in `ExternalIdentity` model):**
   - Links external developer profiles: GitHub, LeetCode, Codeforces, StackOverflow.
   - Tied to `userId` (MongoDB ObjectId).
   - Syncs developer metrics (commits, problem counts, contest ratings). This is separate from core account authentication and will remain untouched.

---

## 6. Safe Migration & Coexistence Plan

1. **Dual Token Authentication in `protect` Middleware:**
   - Detect whether incoming token is a Supabase JWT or legacy JWT.
   - For Supabase JWT: Verify token claims and signature using Supabase Auth SDK (`supabase.auth.getUser(token)`).
   - Match verified Supabase user to MongoDB using new field: `supabaseUid` (indexed, unique, sparse).
   - Fallback: If legacy JWT, verify with `jwt.verify(token, JWT_SECRET)`.
   - Result: Zero downtime, zero breakage of existing tests, sessions, or admin workflows.

2. **MongoDB Profile Preservation:**
   - MongoDB remains the single source of truth for all business and relational data: `etxId`, `roles`, `prn`, `university`, `institutionId`, `departmentId`, `documents`, `projects`, `scores`, `aiAnalysis`.
   - Provide a safe profile provisioning endpoint: `POST /api/auth/supabase/sync-profile`.
   - Prevent duplicate accounts, enforce zero-trust role assignment (never trust role from client, default to `user`), and never overwrite existing password hashes or user profiles blindly.

3. **Frontend Integration with Supabase:**
   - Install `@supabase/supabase-js` in `client`.
   - Create singleton `supabaseClient.js` reading `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - In `AuthContext.jsx`:
     - Maintain session via `supabase.auth.onAuthStateChange`.
     - When authenticated via Supabase, pass Supabase access token in Axios requests.
     - Implement Supabase `signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`, and `updateUser`.
     - Support email confirmation callbacks and password reset callbacks seamlessly.
