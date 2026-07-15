# Usage Guide

Practical, step-by-step instructions for running MaVi Linking and using its features. For *why* things work this way, see [learning.md](learning.md). For *how it's built*, see [implementation.md](implementation.md).

---

## Running the App Locally

### 1. Prerequisites

- Node.js v16+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Google Gemini API key and/or an OpenAI API key

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Optional `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

The app runs at `http://localhost:5173`.

### 4. Verify it's running

Hit the health check endpoint:

```
GET http://localhost:5000/api/health
```

If this doesn't return a healthy response, check the [Troubleshooting](#troubleshooting) section below before doing anything else.

---

## Using the App

### Creating an account

1. Go to `http://localhost:5173` and register.
2. Choose your role at signup: **Student**, **Recruiter**, or **Teacher**. This determines which dashboard and permissions you get — it isn't changeable casually after the fact, so pick correctly.

### As a Student

1. **Link your platforms** — from your dashboard, connect your GitHub account, then your LeetCode username, under account/platform settings.
2. **Generate your Developer DNA** — trigger an AI insight generation from your dashboard. This may take a few seconds since it calls out to Gemini/OpenAI.
3. **View your scores** — Development, Problem Solving, and Knowledge dimensions appear on your `SkillRadar` chart, with your overall tier (Bronze → Elite Developer) shown on your `DNACard`.
4. **Add portfolio projects** — under the Projects section, so recruiters and teachers see more than just platform stats.
5. **Set your availability** — toggle "Open to Opportunities," choose Internship vs Full-Time, or hide your profile entirely from recruiter search.
6. **Share your public profile** — visit your `/u/:username` page and grab the auto-generated QR code (via the QR modal) to put on a resume or portfolio.
7. **Find compatible teammates** — use the "Upgraded Picker" search (debounced autocomplete by name/username) to find and compare potential collaborators.

### As a Recruiter

1. **Search talent** — use the filtering/search tools on your dashboard to find candidates by skill, score, or platform data.
2. **Compare candidates** — select multiple profiles to view side-by-side.
3. **Bookmark** candidates you want to revisit.
4. **Move candidates through your pipeline** on the Kanban board:
   `Available for Hiring → Under Review → Interview Scheduled → Offer Received → Offer Accepted → Placed / Hired`
   Schedule interviews (online/offline/hybrid) and enter offer details (CTC, joining date) directly on a candidate's card.
5. Note: placed candidates still show up in search — with a `Placed @ Company` badge — rather than disappearing, so you always see the full picture.

### As a Teacher

1. **View your roster** — see all students in your department/class.
2. **Check readiness reports** — industry-readiness summaries per student, generated from their DNA profile.
3. **Use department leaderboards** — scoped rankings so you can see relative standing within your own cohort, not just the global leaderboard.

### Notifications

Real-time notifications (interview scheduled, pipeline started, offer released) appear in the notification bell in the header. Unread items are badged; you can mark individual or all notifications as read.

---

## Troubleshooting

**Backend won't start / crashes immediately**
- Confirm `MONGODB_URI` is correct and the cluster allows connections from your IP (or `0.0.0.0/0` if using Atlas in development).
- Confirm `JWT_SECRET` is set — the server will not start without it.

**Frontend can't reach the API / network errors**
- Confirm the backend is actually running on port 5000 (or whatever `PORT` you set).
- Confirm `VITE_API_URL` in `client/.env` matches your backend's actual URL — if you didn't set this, it defaults to `http://localhost:5000/api`.
- Confirm `CLIENT_URL` in `server/.env` matches your frontend's actual URL (used for CORS) — a mismatch here will cause silent CORS failures in the browser console.

**AI insight generation fails or times out**
- Confirm at least one of `GEMINI_API_KEY` / `OPENAI_API_KEY` is set and valid.
- If Gemini fails, the backend should fall back to OpenAI automatically — check server logs to see which provider actually errored.

**Notification dropdown renders behind other UI elements**
- This was a known stacking-context bug, fixed by rendering the dropdown through a React portal targeting `document.body`. If you see this again, check whether the fix was reverted or a new component reintroduced the same layout issue.

**MongoDB error: "path 'userIds' is matched twice" when creating compatibility records**
- This was caused by combining a check-and-write into a single upsert with array filter operators. The fix decouples this into separate `findOne` + write calls. If you hit this again, check `compatibilityService.js` for a regression.

**Still stuck?**
Check open and closed issues on the [issues page](https://github.com/Mayur51015/Mavi-Linking/issues) — your problem may already be documented there. If not, open a new issue with reproduction steps (see [../CONTRIBUTING.md](../CONTRIBUTING.md#reporting-bugs)).
