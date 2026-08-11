# MaVi Linking 🚀

**MaVi Linking** is a next-generation, **AI-Powered Developer Intelligence Platform**. It aggregates your developer footprint across multiple coding platforms (GitHub, LeetCode, Codeforces), leverages AI (Gemini / OpenAI) to generate deep technical insights, and produces a personalized **"Developer DNA"** profile with comparative global rankings — all in one sleek, glassmorphic dashboard.

Built for **Students**, **Recruiters**, and **Educators** alike, MaVi Linking provides role-specific dashboards so every stakeholder gets exactly the intelligence they need.

---

## 🌟 Key Features

### 🧠 AI-Powered Intelligence
- Uses Google Gemini / OpenAI LLMs to analyze problem-solving patterns, coding consistency, and technical stack depth.
- Generates a unique **Developer DNA** profile and dimensioned performance scores (Development, Problem Solving, Knowledge).

### 🔗 Cross-Platform Aggregation
- **GitHub** — Public repositories, language breakdown, contribution activity, and star counts.
- **LeetCode** — Contest ratings, problem breakdown (Easy / Medium / Hard), badges, recent submissions, and AI-driven insights via the Alfa API.
- **Codeforces & StackOverflow** — Platform slots ready for linking and data sync.

### 👥 Multi-Role Dashboards
| Role | Dashboard Highlights |
|:---|:---|
| **Student / User** | Personal analytics, account linking, AI insights, project portfolio, compatibility checker |
| **Recruiter** | Talent search & filtering, candidate comparison, bookmarking, AI-verified technical profiles |
| **Teacher / Educator** | Student roster management, industry-readiness reports, department leaderboards |

### 🏆 Global Ranking & Gamification
- Computes an **overall score** from Development, Problem Solving, and Knowledge metrics.
- Places users in tiers — **Bronze → Silver → Gold → Platinum → Elite Developer**.
- Global and department-scoped leaderboards.

### 📊 Interactive Data Visualization
- Modern glassmorphic UI with **Recharts** — Problem Breakdown charts, Growth timelines, Skill Radars, and Activity Feeds.
- Smooth **Framer Motion** animations throughout.

### 🌍 Public Identity & QR Codes
- Share your aggregated developer profile via a public `/u/:username` link.
- Auto-generated **QR codes** for embedding on resumes and portfolios.
- SEO / OpenGraph metadata endpoint for rich link previews.

### 🤝 Team Compatibility & Collaboration
- **Upgraded Picker** — Search developers by name/username via a debounced, autocomplete dropdown showing avatars, university, and performance scores.
- Matches students with projects, teams, or roles using an AI-analyzed multi-dimensional compatibility engine (skills, coding behavior, personality, work styles).

### 💼 Candidate Availability & Placement Management
- **Placement Tracking** — Tracks candidate placement lifecycle (Available for Hiring, Under Review, Interview Scheduled, Offer Received, Offer Accepted, Placed / Hired).
- **Transparency-First Search** — Placed candidates remain discoverable in recruiter searches but display clear badge indications (e.g. `Placed @ Company`).
- **Recruiter Kanban Pipeline** — Visual board for recruiters to manage applicants, schedule interviews (online/offline/hybrid), offer details (CTC, joining date), and handle workflow transitions.
- **Availability Toggles** — Granular student settings (e.g., Open to Opportunities, Internship vs Full-Time, Hide Profile).

### ⚡ Real-Time Notification Center
- **Dynamic Alerts** — Real-time in-app notifications (via Socket.io and DB storage) for students regarding interview scheduling, pipeline starts, and offer releases.
- Portal-based navigation header dropdown with unread badges, individual, and batch read actions.

---

## 🐛 Recent Bug Fixes

- **Overlay Stacking / Z-Index Fix** — Fixed the notification center dropdown painting behind active dashboard elements due to layout stacking contexts. Re-implemented the overlay using `ReactDOM.createPortal` targeting `document.body`.
- **Compatibility Upsert Query Inference** — Fixed a MongoDB driver crash (`path 'userIds' is matched twice`) when generating team compatibility records with array filter query operators. Resolved by decoupling check and write operations into explicit `findOne` and write calls.


---

## 🛠️ Technology Stack

### Frontend
| Category | Technology |
|:---|:---|
| **Core** | React 19 (Vite 8) |
| **Routing** | React Router DOM v7 |
| **State** | React Context API |
| **Styling** | Vanilla CSS (glassmorphic design system) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **HTTP** | Axios |
| **Real-Time** | Socket.IO Client |
| **Utilities** | clsx |

### Backend
| Category | Technology |
|:---|:---|
| **Core** | Node.js & Express.js |
| **Database** | MongoDB & Mongoose |
| **Auth** | JWT (jsonwebtoken) & bcryptjs |
| **Validation** | express-validator |
| **Security** | Helmet, CORS, express-rate-limit |
| **AI** | `@google/generative-ai` (Gemini) & `openai` |
| **Caching** | node-cache |
| **Real-Time** | Socket.IO |
| **PDF** | PDFKit |
| **QR** | qrcode |
| **Logging** | Morgan |
| **Dev** | Nodemon |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v16 or higher
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **AI API Key** — Google Gemini API Key and/or OpenAI API Key

### 1. Clone the Repository
```bash
git clone https://github.com/Mayur51015/Mavi-Linking.git
cd Mavi-Linking
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# AI APIs (provide at least one)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory (optional — defaults to localhost):
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

The app will be available at **`http://localhost:5173`**.

---

## 🔐 Environment Variables

### Backend (`server/.env`)
| Variable | Description |
|:---|:---|
| `PORT` | API port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:5173`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENAI_API_KEY` | OpenAI API key (fallback) |

### Frontend (`client/.env`)
| Variable | Description |
|:---|:---|
| `VITE_API_URL` | Backend API base URL |

---

## 📡 API Endpoints

The backend exposes a modular REST API with role-based access control:

| Prefix | Description | Auth |
|:---|:---|:---|
| `/api/auth` | Registration, login, profile updates, `/me` | Public / JWT |
| `/api/platforms` | GitHub account linking & data sync | JWT |
| `/api/leetcode` | LeetCode analytics sync & retrieval | JWT |
| `/api/scores` | Ranking, gamification scores, leaderboard | JWT |
| `/api/projects` | Portfolio project CRUD | JWT |
| `/api/portfolio` | Public portfolio data | Public |
| `/api/ai` | AI insight generation (Developer DNA) | JWT |
| `/api/recruiter` | Talent search, bookmarks, candidate analytics | JWT (Recruiter) |
| `/api/teacher` | Student management, readiness reports | JWT (Teacher) |
| `/api/education` | University & department data | JWT |
| `/api/compatibility` | Skill-based compatibility matching | JWT |
| `/api/verification` | Platform verification tokens | JWT |
| `/api/public/u/:username` | Public profile aggregation | Public |
| `/api/public/qr/:username` | QR code generation | Public |
| `/api/public/meta/:username` | SEO / OpenGraph metadata | Public |
| `/api/health` | API health check | Public |

---

## 📁 Project Structure

```text
Mavi-Linking/
├── client/                       # React Frontend (Vite)
│   ├── src/
│   │   ├── api/                  # Axios instance & interceptors
│   │   ├── assets/               # Static assets (logos, images)
│   │   ├── components/           # Reusable UI widgets
│   │   │   ├── leetcode/         #   └─ LeetCode-specific components
│   │   │   ├── DNACard.jsx       #   └─ Developer DNA display
│   │   │   ├── SkillRadar.jsx    #   └─ Radar chart component
│   │   │   ├── GrowthChart.jsx   #   └─ Growth timeline
│   │   │   ├── LeaderboardWidget.jsx
│   │   │   ├── QRModal.jsx       #   └─ QR code modal
│   │   │   └── ReportGenerator.jsx
│   │   ├── context/              # React Context (AuthContext)
│   │   ├── layouts/              # Role-specific shell layouts
│   │   │   ├── UserLayout.jsx
│   │   │   ├── RecruiterLayout.jsx
│   │   │   └── TeacherLayout.jsx
│   │   ├── pages/                # Full-page views
│   │   │   ├── recruiter/        #   └─ Recruiter dashboard pages
│   │   │   ├── teacher/          #   └─ Teacher dashboard pages
│   │   │   ├── Dashboard.jsx     #   └─ Student dashboard
│   │   │   ├── Home.jsx          #   └─ Landing page
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── PublicIdentity.jsx
│   │   │   └── ...
│   │   ├── routes/               # ProtectedRoute (role-aware)
│   │   ├── App.jsx               # Top-level routing
│   │   ├── index.css             # Global design system
│   │   └── main.jsx              # Vite entry point
│   └── package.json
│
├── server/                       # Node/Express Backend
│   ├── src/
│   │   ├── config/               # DB connection & Socket.IO setup
│   │   ├── controllers/          # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── aiController.js
│   │   │   ├── leetcodeController.js
│   │   │   ├── recruiterController.js
│   │   │   ├── teacherController.js
│   │   │   ├── scoreController.js
│   │   │   ├── compatibilityController.js
│   │   │   └── ...
│   │   ├── middleware/           # Auth, role-guard, validation, error handling
│   │   │   ├── auth.js
│   │   │   ├── roleMiddleware.js
│   │   │   ├── validate.js
│   │   │   └── errorHandler.js
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── User.js           #   └─ Multi-role user model
│   │   │   ├── DNA.js
│   │   │   ├── LeetCodeAnalytics.js
│   │   │   ├── Ranking.js
│   │   │   ├── Project.js
│   │   │   ├── Compatibility.js
│   │   │   └── ...
│   │   ├── routes/               # Express route definitions
│   │   ├── services/             # Business logic & external API integrations
│   │   │   ├── aiAnalyzer.js
│   │   │   ├── leetcodeService.js
│   │   │   ├── recruiterService.js
│   │   │   ├── teacherService.js
│   │   │   ├── compatibilityService.js
│   │   │   └── ...
│   │   └── server.js             # Express app entry point
│   └── package.json
│
├── README.md
└── TODO.md
```

---

## 🚢 Deployment

### Backend (Render / Railway / Heroku)
1. Ensure your MongoDB Atlas cluster allows external connections (`0.0.0.0/0`).
2. Push the `server/` code and link it to your hosting provider.
3. Add all production environment variables from `.env`.
4. Set the **Start Command** to `npm start` (runs `node src/server.js`).

### Frontend (Vercel / Netlify)
1. Link your frontend repo to Vercel or Netlify.
2. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
3. Add `VITE_API_URL` pointing to your deployed backend (e.g. `https://your-api.onrender.com/api`).
4. Deploy!

---

## 🤝 Contributing

We welcome contributions!

Please read our
[Contributing Guide](CONTRIBUTING.md)
before claiming an issue.

> **Issue assignment is generally first-come, first-served. Please wait for maintainer confirmation before starting work.**

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/Mayur51015/Mavi-Linking/issues).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

<div align="center">
  <b>Built with ❤️ by MaVi</b>
</div>
