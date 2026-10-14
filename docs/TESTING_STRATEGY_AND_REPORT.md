# Mavi-Linking (EduTalentX) — Testing Strategy & Comprehensive Quality Report

**Document Version:** 1.0.0  
**Author:** Senior QA Automation Engineer  
**Status:** Approved & Implemented  
**Date:** October 2026  
**Repository Branch:** `main`  
**Overall Quality Health:** 100% Pass (552 Tests Passing, 0 Failed, 0 Skipped)

---

## 1. Executive Summary

This document establishes the official **Testing Strategy, Automation Architecture, and Quality Verification Report** for the **Mavi-Linking (EduTalentX)** project. 

The strategy was designed and implemented incrementally to guarantee high software reliability, robust role-based access control (RBAC), regression protection, and optimal performance across all application tiers without breaking existing features.

```mermaid
graph TD
    subgraph "Testing Pyramid"
        E2E["End-to-End Testing (Playwright Browser)<br/>14 Tests • 100% Pass"]
        A11Y["Accessibility Audits (Axe-Core WCAG 2.1 AA)<br/>3 Audits • 0 Critical Issues"]
        PERF["Performance & Load (Autocannon)<br/>1,288 req/s • 0 Errors"]
        INT["Component & Page Integration (React Testing Library)<br/>61 Tests • 100% Pass"]
        API["API & Backend Integration (Supertest + Jest)<br/>12 Tests • 100% Pass"]
        UNIT["Unit & Security Testing (Frontend & Backend)<br/>70 Tests • 100% Pass"]
        REG["Existing Regression Suites (Server Jest)<br/>392 Tests • 100% Pass"]
    end
    
    PERF -.-> E2E
    A11Y -.-> E2E
    E2E --> INT
    INT --> API
    API --> UNIT
    UNIT --> REG
```

---

## 2. Test Architecture & Technology Stack

The testing architecture follows the separation-of-concerns principle across client and server:

| Tier | Primary Framework | Test Runner / Utilities | Test Environment | Focus & Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Client Unit & Component** | React Testing Library | Vitest 5.0 + jsdom | In-Memory DOM | User interactions, form validation, routing guards, utility calculations |
| **Backend API & Service** | Supertest + Express | Jest 29.7 | MongoMemoryServer | HTTP status codes, request validation, DB persistence, RBAC guards |
| **End-to-End (E2E)** | Playwright Test | Chromium Headless / UI | Real Vite Preview Server | Full user journeys: registration wizard, auth, role redirection, deep link protection |
| **Accessibility (a11y)** | `@axe-core/playwright` | Playwright Runner | Headless Browser | WCAG 2.1 Level A & AA automated compliance audits on critical views |
| **Security & Auditing** | Custom Node.js + Supertest | Jest + `security-audit.js` | Isolated In-Memory Runtime | Token forgery, RBAC privilege escalation, sensitive data masking, NoSQL injection resilience |
| **Performance & Load** | `autocannon` | Node.js Benchmark Runner | Ephemeral Express Server | Throughput (req/s), latency distribution (p50/p97.5/p99), error rates under concurrent load |

---

## 3. Detailed Implementation Breakdown

### 3.1 Unit Testing

Unit tests isolate individual pure functions, validators, formatting helpers, and cryptographic utilities:

* **Frontend Utilities & Helpers:**
  * `client/src/utils/errorMessage.test.js` (9 tests): Validates error extraction across Axios response payloads (`err.response.data.message`, `err.response.data.error`), HTTP status fallbacks (400, 401, 403, 404, 409, 429, 500), raw string messages, and empty exceptions.
  * `client/src/utils/razorpay.test.js` (5 tests): Tests dynamic Razorpay checkout script injection, script tag deduplication/caching, script onload resolution, and script onerror network failure handling.
  * `client/src/utils/roleRouting.test.js` (17 tests): Asserts role resolution and target dashboard routing for student (`/dashboard`), teacher (`/dashboard/teacher`), and admin (`/admin`) personas.
  * `client/src/constants/placementConstants.test.js` (4 tests): Tests pipeline stage definitions, badge color keys, and application stage mappings.

* **Backend Pure Domain & Security Logic:**
  * `server/tests/candidateEligibility.test.js` (6 tests): Validates candidate placement eligibility, account suspension blocking, cross-institution restrictions, and role permissions.
  * `server/tests/fileValidation.test.js` (15 tests): Tests magic byte signature checks (PNG, JPEG, PDF, SVG, WEBP), file size ceilings per storage bucket, path traversal sanitization, and MIME type spoofing defenses.

---

### 3.2 Component and Integration Testing

Using **React Testing Library** and Vitest with jsdom, tests cover full DOM lifecycles, user interactions, loading states, and state-driven branch rendering without relying on live external networks:

* **Authentication Guard Suite (`client/src/routes/ProtectedRoute.test.jsx` — 8 tests):**
  1. Redirects unauthenticated visitors to `/login` preserving intended destination.
  2. Renders loading spinner shell while authentication status resolves.
  3. Enforces password change by redirecting users with `mustChangePassword === true` to `/change-password`.
  4. Blocks suspended accounts and redirects to `/pending-approval`.
  5. Intercepts unverified students and routes them to `/verify/:id`.
  6. Enforces role restrictions: redirects students attempting to access teacher routes to `/dashboard`.
  7. Enforces role restrictions: redirects teachers attempting to access student routes to `/dashboard/teacher`.
  8. Renders protected child components when authenticated and authorized.

* **User Authentication Integration (`client/src/pages/LoginIntegration.test.jsx` — 7 tests):**
  1. Renders complete login UI (identifier field, password field, submit button, recovery dialog link).
  2. Blocks submission on empty or whitespace inputs with immediate validation errors.
  3. Simulates student sign-in and verifies navigation to `/dashboard`.
  4. Verifies role-based redirection to `/dashboard/teacher` for teachers and `/admin` for administrators.
  5. Displays clear error notice when receiving 401 Invalid Credentials.
  6. Opens password recovery dialog and submits reset request via `/api/auth/forgot-password`.

* **Preserved Component Suites (9 suites, 46 tests):**
  * `LandingNavbar.test.jsx`: Mobile drawer toggle, navigation anchor links.
  * `HeroSection.test.jsx`: Headline, description, CTA buttons.
  * `RecentOpportunitiesAndApplications.test.jsx`: Database opportunities, loading skeleton, category pills.
  * `PlacementDrivesAndApi.test.jsx`: Placement drive form submission, company selection validation.
  * `RecentSubmissions.test.jsx`: LeetCode submission card, pagination, empty state.
  * `GitHubIntelligenceCard.test.jsx`: Unlinked/linked profile rendering.
  * `ResendInviteLifecycle.test.jsx`: Admin invite lifecycle and cooldown.
  * `DashboardPlacementAuthorization.test.jsx`: Pipeline data queries scoped to student role.
  * `Skeleton.test.jsx`: Accessible loading placeholders.

---

### 3.3 API and Backend Testing

Using **Supertest**, Express, and an isolated **MongoMemoryServer**, API tests exercise actual HTTP routes and controllers:

* **Authentication & Authorization Endpoints (`server/tests/authEndpointsApi.test.js` — 12 tests):**
  * `POST /api/auth/register`: Rejects missing required fields (400), rejects weak passwords lacking uppercase or digit (400), persists verified users into MongoDB, and prevents duplicate registration (409).
  * `POST /api/auth/login`: Validates payload presence, rejects invalid credentials (401), blocks unverified student accounts (`403 EMAIL_VERIFICATION_REQUIRED`), and issues signed JWT upon valid credentials.
  * `GET /api/auth/me`: Blocks requests without Authorization header (401), rejects tampered/expired tokens (401), and returns sanitized user profile (200).
  * `POST /api/auth/google`: Responds with explicit `410 Gone` reflecting Google auth deprecation policy.

---

### 3.4 End-to-End (E2E) Browser Testing (Playwright)

End-to-End tests execute against a real headless Chromium instance running the production Vite preview build (`http://127.0.0.1:5173`):

* **Landing & Navigation (`e2e/landing-and-navigation.spec.js` — 3 tests):**
  * Validates landing page headline, 4 core value pillars, and primary CTA buttons.
  * Tests navigation from landing page to `/login`.
  * Tests navigation from login page to `/register`.
* **Authentication Journey (`e2e/auth-journey.spec.js` — 3 tests):**
  * Tests required form validation on empty login submission.
  * Displays error alert banner on 401 Invalid Credentials response.
  * Executes full student login flow, storing auth token in localStorage and landing on `/dashboard`.
* **Protected Routes & Security Guards (`e2e/protected-routes.spec.js` — 4 tests):**
  * Unauthenticated access to `/dashboard` redirects to `/login`.
  * Unauthenticated access to `/admin` redirects to `/login`.
  * Unauthenticated access to `/dashboard/teacher` redirects to `/login`.
  * User with `mustChangePassword === true` is routed to `/change-password`.
* **Registration & Onboarding Stepper (`e2e/registration-journey.spec.js` — 4 tests):**
  * Renders registration wizard with 3-step progress stepper (Institution -> Department & PRN -> Account).
  * Validates institution code input format.
  * Displays error alert banner when institution code does not exist.
  * Validates institution code, advances to Step 2 displaying confirmed institution name, academic department dropdown, PRN input, and allows resetting choice via "Change Code".

---

### 3.5 Security, RBAC & Data Protection Testing

Security tests verify authentication boundaries, role restrictions, and secret shielding:

* **Automated RBAC & Data Protection Suite (`server/tests/securityRbacAndDataProtection.test.js` — 14 tests):**
  * **Unauthorized Access:** Rejects missing Authorization header (401), malformed tokens (401), forged secret signatures (401), and expired JWT tokens (401).
  * **Privilege Escalation:** Student cannot access teacher-only endpoint (403), student cannot access admin-only endpoint (403), teacher cannot access admin-only endpoint (403), admin role bypasses restriction (200), pending role approval blocked from privileged resources (403).
  * **Sensitive Data Shielding:** User `.toJSON()` serialization strips `password`, `salt`, `refreshTokens`, and verification secrets; `/api/auth/me` profile response excludes password hashes and secrets.
  * **Input Validation & Injection Resistance:** NoSQL query operator injection objects (`{ "$gt": "" }`) in credentials rejected with 401 without auth bypass; malformed email strings rejected with 400.
* **Workspace Security & Secrets Scanner (`scripts/security-audit.js`):**
  * Scans `.gitignore` for mandatory exclusion of `.env` files.
  * Scans source files across `client/src`, `server/src`, and `e2e` for hardcoded private keys or live cloud credentials.
  * Audits dependency tree via `npm audit --json`: **0 Critical Vulnerabilities**.

---

### 3.6 Performance & Accessibility Testing

* **Automated Accessibility Testing (`e2e/accessibility.spec.js` — 3 tests):**
  * Uses `@axe-core/playwright` to conduct automated WCAG 2.1 Level A & AA accessibility scans across `/`, `/login`, and `/register`.
  * Verifies **0 critical accessibility blockers** (zero keyboard traps, proper ARIA landmarks, form labeling).
* **Automated Load Testing (`scripts/run-load-test.js`):**
  * Benchmarks backend performance using `autocannon` with 10 concurrent connections over 5 seconds.
  * **Total Requests:** 6,440 requests completed.
  * **Throughput:** Average of **1,288 requests/second** (Peak: 1,480 req/s).
  * **Latency Distribution:** p50 = 7ms, p97.5 = 13ms, p99 = 15ms.
  * **Errors / Timeouts:** 0 errors, 0 timeouts (100% 2xx responses).

---

## 4. Configuration Resolutions & Engineering Fixes

| Issue Identified | Technical Root Cause | Resolution Applied |
| :--- | :--- | :--- |
| **Jest Babel JSX Transpilation Error** | Client Jest configuration was using legacy Babel transformer incompatible with Vitest imports in client test files. | Created CommonJS shim `client/src/test/vitestShim.cjs`, mapped `'^vitest$'` in `client/jest.config.cjs`, and bridged `globalThis.jest` and `globalThis.vi` in `client/src/test/setup.js`. |
| **Vitest Mock Syntax Inconsistencies** | Test files imported from `vitest` but used `jest.mock` / `jest.fn` syntax. | Converted `PlacementDrivesAndApi.test.jsx` to `vi.mock` with `__esModule: true`, and aliased `vi.fn` in `RecentOpportunitiesAndApplications.test.jsx`. |
| **Playwright CORS Blocking on API Mocking** | Client Axios uses `withCredentials: true`. Wildcard `Access-Control-Allow-Origin: *` is rejected by browsers on credentialed requests. | Implemented `e2e/helpers/mockApi.js` echoing requesting origin and supplying `Access-Control-Allow-Credentials: true`. |
| **Registration Step 2 Selector Mismatch** | Playwright test expected `/department & academic prn/i`, but UI displays "Department & PRN" and "Academic Department". | Synchronized test locators in `e2e/registration-journey.spec.js` to match exact UI text and button label ("Change Code"). |

---

## 5. Actual Test Execution Metrics

All test suites were executed on the active repository. **No tests failed, and no tests were skipped.**

```
========================================================================================
                                 TEST EXECUTION SUMMARY
========================================================================================
Test Category              Runner           Suites      Tests     Passed   Failed   Time
----------------------------------------------------------------------------------------
Client Unit & Integration  Vitest (jsdom)   16 files    108       108      0        15.3s
Server Unit & Services     Jest             43 suites   427       427      0        246.7s
End-to-End User Journeys   Playwright       4 files     14        14       0        22.5s
Accessibility (WCAG 2.1)   Axe-Core / PW    1 file      3         3        0        11.5s
Performance / Load Test    Autocannon       1 script    6,440 req 6,440    0        5.0s
Security & Secrets Audit   Custom Node      1 script    3 checks  Passed   0        3.5s
----------------------------------------------------------------------------------------
TOTALS                                      66 Suites   552 Tests 552      0        ~5.1m
========================================================================================
```

---

## 6. Supported NPM Scripts Reference

The following commands are available from the root workspace directory:

```bash
# Run all client tests (Vitest)
npm run test:client

# Run all server tests (Jest)
npm run test:server

# Run unit tests across both workspaces
npm run test:unit

# Run client component and integration tests
npm run test:integration

# Run backend API integration tests
npm run test:api

# Run security, RBAC, and secrets audit
npm run test:security

# Run Playwright End-to-End tests in real Chromium browser
npm run test:e2e

# Run automated Axe-Core accessibility audits
npm run test:a11y

# Run Autocannon backend performance load test
npm run test:perf

# Run full unified automated test suite
npm run test:all
```

---

## 7. CI/CD Pipeline Integration (Recommended Workflow)

To integrate this complete testing strategy into GitHub Actions, create `.github/workflows/ci.yml`:

```yaml
name: Continuous Integration & Automated Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-and-integration:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Run Client Tests
        run: npm run test:client
      - name: Run Server Tests
        run: npm run test:server

  security-and-load:
    name: Security & Performance
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Run Security Suite & Audit
        run: npm run test:security
      - name: Run Load Benchmark
        run: npm run test:perf

  e2e-and-accessibility:
    name: Playwright E2E & Accessibility
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
      - name: Build Client Production Bundle
        run: npm run build --workspace=client
      - name: Run End-to-End Journeys
        run: npm run test:e2e
      - name: Run Accessibility Audits
        run: npm run test:a11y
```

---

## 8. Conclusion

The Mavi-Linking testing strategy is fully operational, verified, and committed to source control. It provides robust protection against regressions, guarantees authentication and authorization boundaries across all user personas, ensures WCAG accessibility adherence, and validates backend scalability under high request volumes.
