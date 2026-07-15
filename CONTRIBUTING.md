# Contributing to MaVi Linking 🚀

First off, thanks for taking the time to contribute! MaVi Linking is an AI-powered developer intelligence platform, and every fix, feature, or doc improvement helps make it better for students, recruiters, and educators alike.

This guide covers everything you need to get set up and submit a good pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Where to Start](#where-to-start)

---

## Code of Conduct

Be respectful, constructive, and patient. We're building this together — assume good intent, give clear feedback, and keep discussions focused on the code and ideas, not the person.

---

## Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- An **AI API Key** — Google Gemini and/or OpenAI

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/Mavi-Linking.git
cd Mavi-Linking
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# AI APIs (provide at least one)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

Run the backend:

```bash
npm run dev
```

### 3. Frontend Setup

In a new terminal:

```bash
cd client
npm install
```

Optional `.env` in `client/` (defaults to localhost if omitted):

```
VITE_API_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

For a deeper dive into how the pieces fit together, see [`docs/implementation.md`](docs/implementation.md).

---

## Project Structure

```
Mavi-Linking/
├── client/     # React frontend (Vite)
├── server/     # Node/Express backend
├── README.md
└── TODO.md
```

See the README's [Project Structure](README.md#-project-structure) section for the full folder breakdown, and [`docs/implementation.md`](docs/implementation.md) for a walkthrough of how requests flow through the system.

---

## Development Workflow

1. **Pick or open an issue** — check the [issues page](https://github.com/Mayur51015/Mavi-Linking/issues) first so work isn't duplicated. Comment to claim an issue before starting.
2. **Create a branch** off `main`:
   ```bash
   git checkout -b feature/short-description
   # or
   git checkout -b fix/short-description
   ```
3. **Make your changes**, following the guidelines below.
4. **Test locally** — run both the client and server, and manually verify the affected flows (there's no automated test suite yet, so manual verification matters).
5. **Commit and push**, then open a pull request against `main`.

---

## Coding Guidelines

- **Frontend (`client/`)**: React 19 function components, hooks, and the existing glassmorphic CSS design system. Keep new components in `src/components/` and full page views in `src/pages/`. Reuse existing patterns (e.g. `DNACard.jsx`, `SkillRadar.jsx`) as style references rather than introducing a new UI paradigm.
- **Backend (`server/`)**: Follow the existing MVC-ish layout — routes → controllers → services → models. Business logic and third-party API calls belong in `services/`, not controllers.
- **Naming**: camelCase for variables/functions, PascalCase for React components and Mongoose models.
- **Environment variables**: never commit `.env` files or API keys. Add any new required variable to both your local `.env.example`-style docs and to the [Environment Variables table in the README](README.md#-environment-variables).
- **Error handling**: use the existing `errorHandler.js` middleware pattern on the backend; don't swallow errors silently.
- **Role-based access**: if your change touches Student, Recruiter, or Teacher flows, make sure `roleMiddleware.js` still guards routes correctly.

---

## Commit Message Convention

Keep commits small and descriptive:

```
<type>: <short summary>

[optional longer description]
```

Common types: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`, `test`.

Example:
```
feat: add Codeforces sync to platform linking service
fix: resolve notification dropdown z-index stacking bug
docs: add usage guide for public profile QR codes
```

---

## Submitting a Pull Request

1. Push your branch and open a PR against `main`.
2. Give the PR a clear title and description:
   - What does this change do?
   - Why is it needed (link the issue, e.g. `Closes #12`)?
   - How did you test it?
3. Keep PRs focused — one feature or fix per PR is easier to review than a bundle of unrelated changes.
4. Be responsive to review comments; small back-and-forth is normal.

---

## Reporting Bugs

When filing a bug, please include:

- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if UI-related)
- Environment (OS, Node version, browser)

If you're unsure whether something is a bug or expected behavior, check [`docs/usage.md`](docs/usage.md) first — it covers common workflows and troubleshooting.

---

## Suggesting Features

Open an issue describing:

- The problem you're trying to solve
- Your proposed solution (if you have one)
- Any relevant context (which dashboard/role this affects — Student, Recruiter, or Teacher)

---

## Where to Start

Good first contributions:

- Check `TODO.md` for known pending items.
- Look for issues labeled `good first issue` (if none exist yet, ask a maintainer for a suggestion).
- Documentation improvements are always welcome — see [`docs/`](docs/) for the current docs.

New to the codebase? Start with [`docs/learning.md`](docs/learning.md) to understand the core concepts (Developer DNA, scoring, compatibility matching) before diving into code.

---

Thanks again for contributing to MaVi Linking! 💙
