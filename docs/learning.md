# Learning MaVi Linking

This doc explains **what MaVi Linking does and why**, in plain terms — no code required. If you want the technical architecture, see [implementation.md](implementation.md). If you want step-by-step how-tos, see [usage.md](usage.md).

---

## What problem does this solve?

A developer's skill and activity are scattered across platforms — commits on GitHub, problem-solving on LeetCode, contest history on Codeforces. There's no single, trustworthy place that pulls this together into something a student can showcase, a recruiter can evaluate, or a teacher can track across a whole class.

MaVi Linking aggregates that footprint, uses AI to interpret it, and turns it into a structured, comparable profile — a **"Developer DNA"** — with role-specific dashboards so each type of user sees what's relevant to them.

---

## Core Concepts

### 1. Developer DNA

Your "Developer DNA" is an AI-generated profile built from your linked platform data. It breaks your ability down into three dimensions:

- **Development** — code quality, contribution activity, language/stack breadth (from GitHub).
- **Problem Solving** — how you perform on algorithmic challenges (from LeetCode, later Codeforces).
- **Knowledge** — inferred depth of technical understanding based on patterns across your activity.

An AI model (Gemini, with OpenAI as a fallback) analyzes your raw platform data and produces these scores plus a narrative summary — rather than a simple point count, it's meant to capture *how* you work, not just *how much*.

### 2. Scoring & Tiers

The three DNA dimensions combine into an **overall score**, which places you into a tier:

```
Bronze → Silver → Gold → Platinum → Elite Developer
```

Tiers exist both globally and scoped to your department/institution, so a Teacher can see how their students rank relative to each other, not just the whole platform.

### 3. Roles: Student, Recruiter, Teacher

The same underlying data serves three very different audiences:

| Role | What they care about |
|---|---|
| **Student** | Showcasing their own growth, tracking their scores over time, finding compatible teammates, controlling what recruiters can see. |
| **Recruiter** | Searching and filtering talent, comparing candidates side-by-side, tracking candidates through a hiring pipeline. |
| **Teacher** | Seeing a whole class/department at once, industry-readiness reporting, leaderboards. |

Each role gets its own dashboard layout and permissions — a Recruiter can't edit a Student's profile, a Student can't see the Recruiter pipeline, etc.

### 4. Compatibility Matching

Beyond individual scores, MaVi Linking can compare **two or more people** — evaluating overlapping/complementary skills, coding behavior, and inferred work style — to suggest good team or project matches. Think of it as "compatibility" in the same sense as a team-fit assessment, but derived from actual coding activity rather than a self-reported survey.

### 5. Placement Tracking (Recruiter side)

For recruiters, candidates move through a lifecycle:

```
Available for Hiring → Under Review → Interview Scheduled → Offer Received → Offer Accepted → Placed / Hired
```

Placed candidates aren't hidden from search — they remain visible with a clear "Placed @ Company" badge, prioritizing transparency over artificially shrinking the talent pool.

### 6. Public Identity

Every user can expose a read-only public profile at `/u/:username`, with an auto-generated QR code — designed to be dropped onto a resume or portfolio so anyone can scan straight through to a live, aggregated developer profile instead of a static PDF.

---

## Why AI, specifically?

Raw stats (commit count, problems solved) are easy to game or misleading on their own — someone could have 1,000 trivial commits and no real growth, or solve only "Easy" LeetCode problems in bulk. The AI layer exists to interpret *patterns* — consistency, difficulty progression, stack depth — and turn that into a qualitative judgment that a recruiter or teacher can actually trust as a signal, alongside the raw numbers.

---

## Where to Go Next

- Ready to actually use these features? See [usage.md](usage.md).
- Want to know how this is built (routes, services, AI calls, DB schema)? See [implementation.md](implementation.md).
- Want to contribute? See [../CONTRIBUTING.md](../CONTRIBUTING.md).
