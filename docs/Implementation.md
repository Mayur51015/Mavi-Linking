# Implementation

This doc explains **how MaVi Linking works under the hood** — the architecture, data flow, and key subsystems. For setup instructions, see the [README](../README.md#-getting-started). For a conceptual/beginner-friendly explanation, see [learning.md](learning.md). For "how do I use feature X" instructions, see [usage.md](usage.md).

---

## High-Level Architecture

MaVi Linking is a classic **client-server** web app:

```
┌─────────────────┐        REST API (Axios)        ┌──────────────────┐
│  React Frontend  │ ───────────────────────────── │  Express Backend  │
│  (Vite, port     │                                 │  (Node.js, port   │
│   5173)          │ ◄─────────────────────────────  │   5000)           │
└─────────────────┘        Socket.IO (real-time)     └──────────────────┘
                                                              │
                                                              ▼
                                                      ┌──────────────────┐
                                                      │     MongoDB       │
                                                      │   (Mongoose ODM)  │
                                                      └──────────────────┘
                                                              │
                                                              ▼
                                                ┌───────────────────────────┐
                                                │  External Services         │
                                                │  - GitHub API               │
                                                │  - LeetCode (Alfa API)      │
                                                │  - Google Gemini / OpenAI   │
                                                └───────────────────────────┘
```

The frontend never talks to GitHub, LeetCode, or the AI providers directly — all third-party calls are proxied through the backend's `services/` layer, which keeps API keys server-side and lets responses be cached/normalized before reaching the client.

---

## Backend Layout

The server follows a layered pattern:

```
routes/  →  controllers/  →  services/  →  models/
```

- **`routes/`** — defines URL paths and which controller handles them, wraps them in `middleware/` (auth, role checks, validation).
- **`controllers/`** — parses the request, calls the relevant service(s), shapes the HTTP response. Contains no business logic itself.
- **`services/`** — the actual business logic and integrations (e.g. `aiAnalyzer.js`, `leetcodeService.js`, `compatibilityService.js`). This is where GitHub/LeetCode data gets fetched and normalized, and where AI prompts are built and sent.
- **`models/`** — Mongoose schemas defining the shape of data in MongoDB (`User.js`, `DNA.js`, `LeetCodeAnalytics.js`, `Ranking.js`, `Project.js`, `Compatibility.js`, etc).

### Middleware

- **`auth.js`** — verifies the JWT on protected routes and attaches the authenticated user to the request.
- **`roleMiddleware.js`** — gates routes by role (`student`, `recruiter`, `teacher`), since dashboards and permissions differ significantly by role.
- **`validate.js`** — request body/query validation via `express-validator`.
- **`errorHandler.js`** — centralized error formatting so controllers can throw/pass errors without manually shaping every error response.

### Key Subsystems

**1. Platform Linking & Aggregation**
`platformController.js` / `leetcodeController.js` trigger sync jobs in `services/` that call the GitHub REST API and the LeetCode Alfa API, normalize the results, and persist them via `LeetCodeAnalytics.js` and related models. Results are cached with `node-cache` to avoid hammering rate-limited third-party APIs.

**2. AI Insight Generation ("Developer DNA")**
`aiController.js` calls `aiAnalyzer.js`, which builds a structured prompt from a user's aggregated platform data (commit patterns, problem-solving stats, language breakdown) and sends it to Gemini (primary) or OpenAI (fallback). The response is parsed into the `DNA.js` model — a profile with dimensioned scores across Development, Problem Solving, and Knowledge.

**3. Scoring & Gamification**
`scoreController.js` / `Ranking.js` compute an overall score from the three DNA dimensions and map it to a tier (Bronze → Silver → Gold → Platinum → Elite Developer). Rankings are computed both globally and scoped to a department (for the Teacher dashboard).

**4. Compatibility Matching**
`compatibilityService.js` compares two or more users' DNA profiles and platform data across skills, coding behavior, and inferred work style to produce a compatibility score, used by the "Upgraded Picker" search feature. Note: compatibility upsert queries use decoupled `findOne` + write calls (rather than a single upsert with array filters) to avoid a MongoDB driver crash where a path is matched twice.

**5. Real-Time Notifications**
`config/` sets up a Socket.IO server alongside Express. Events (interview scheduled, pipeline started, offer released) are emitted server-side and pushed to connected clients, in addition to being persisted to the DB so the notification center can show history and unread counts.

**6. Public Identity**
`/api/public/u/:username`, `/api/public/qr/:username`, and `/api/public/meta/:username` are unauthenticated routes that expose a read-only aggregated profile, a generated QR code (via the `qrcode` package), and OpenGraph metadata for link previews — used when someone shares their profile externally (e.g. on a resume).

---

## Frontend Layout

- **`src/context/`** — `AuthContext` holds the logged-in user and JWT, exposed via a hook to the rest of the app.
- **`src/routes/`** — `ProtectedRoute` wraps role-restricted pages, redirecting unauthorized users.
- **`src/layouts/`** — role-specific shells (`UserLayout`, `RecruiterLayout`, `TeacherLayout`) that wrap the relevant pages with the correct nav/sidebar.
- **`src/pages/`** — full page views, split into role-specific subfolders for recruiter and teacher pages.
- **`src/components/`** — reusable widgets, notably the data-viz components (`SkillRadar.jsx`, `GrowthChart.jsx`, `DNACard.jsx`, `LeaderboardWidget.jsx`) built with Recharts, and utility components like `QRModal.jsx` and `ReportGenerator.jsx` (PDF export via PDFKit on the backend).
- **`src/api/`** — a shared Axios instance with interceptors (e.g. attaching the JWT to outgoing requests, handling 401s).

### Notification Overlay Fix

Worth knowing if you touch the notification center: the dropdown is rendered via `ReactDOM.createPortal` targeting `document.body`, specifically to escape the stacking context of the dashboard layout — mounting it inline previously caused it to render behind other elements due to CSS stacking rules, not z-index alone.

---

## Data Flow Example: Generating a Developer DNA Profile

1. User links their GitHub and LeetCode accounts (`/api/platforms`, `/api/leetcode`).
2. User triggers (or the system triggers on a schedule) an AI insight generation request to `/api/ai`.
3. `aiController.js` gathers the user's aggregated platform data from MongoDB.
4. `aiAnalyzer.js` builds a prompt and calls Gemini (falling back to OpenAI if Gemini fails or is unconfigured).
5. The AI response is parsed into dimensioned scores and saved to the `DNA` collection.
6. `scoreController.js` recomputes the overall score/tier and updates `Ranking.js`.
7. The frontend dashboard fetches and renders the updated DNA profile via `DNACard.jsx`, `SkillRadar.jsx`, and `GrowthChart.jsx`.

---

## Where to Go Next

- New to the codebase conceptually? Read [learning.md](learning.md) first.
- Want to actually use/run features as an end user? See [usage.md](usage.md).
- Ready to contribute code? See [../CONTRIBUTING.md](../CONTRIBUTING.md).
