# MaVi Linking 🚀

**MaVi Linking** is a next-generation, AI-Powered Developer Intelligence System. It goes beyond a simple resume by aggregating your developer data across multiple platforms (GitHub, LeetCode, Codeforces, etc.) and leveraging Artificial Intelligence (Gemini/OpenAI) to generate deep technical insights, a personalized "Developer DNA" profile, and comparative rankings.

![MaVi Linking Dashboard Mockup](https://via.placeholder.com/1000x500.png?text=MaVi+Linking+Dashboard)

## 📸 Snapshots

<div align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Developer+Dashboard" alt="Developer Dashboard" width="48%">
  <img src="https://via.placeholder.com/800x400.png?text=AI-Powered+DNA+Profile" alt="DNA Profile" width="48%">
</div>
<br/>
<div align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Global+Leaderboard" alt="Global Leaderboard" width="48%">
  <img src="https://via.placeholder.com/800x400.png?text=Public+Profile+Share" alt="Public Profile" width="48%">
</div>

---

## 🌟 Key Features

- **🧠 AI-Powered Intelligence**: Uses LLMs to analyze your problem-solving patterns, consistency, and technical stack, generating a unique "Developer DNA" and specific performance scores.
- **🔗 Cross-Platform Aggregation**: Seamlessly connects with GitHub and LeetCode (via Alfa API) to fetch real-time public repositories, contest ratings, easy/medium/hard problem breakdowns, and recent submissions.
- **🏆 Global Ranking System**: Computes an overall score based on your Development, Problem Solving, and Knowledge metrics, placing you in a global tier (Bronze to Elite Developer).
- **📊 Interactive Dashboards**: Modern, glassmorphic UI built with React and Tailwind CSS, featuring Recharts for beautiful data visualization (Problem Breakdown, Growth Charts, Skill Radars).
- **🌍 Public Identities & QR Codes**: Share your aggregated developer profile via a public `/u/:username` link. Generate custom QR codes automatically to attach to your resume.
- **💼 Recruiter Portal**: Dedicated dashboard for recruiters to discover, bookmark, and analyze top engineering talent based on AI-verified technical footprints.
- **📈 Advanced Reporting**: Generate detailed PDF technical reports outlining a user's skills and insights directly from the dashboard.

---

## 🛠️ Technology Stack

**Frontend:**
- **Core**: React (Vite)
- **Routing**: React Router DOM
- **Styling & Animations**: Tailwind CSS & Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

**Backend:**
- **Core**: Node.js & Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Performance & Security**: Node Cache, Helmet, Express Rate Limit
- **AI Integration**: `@google/generative-ai` (Gemini) & `openai`
- **Utilities**: `qrcode` (for profile links) & `pdfkit` (for report generation)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (Local instance or MongoDB Atlas)
- **AI API Keys** (Google Gemini API Key or OpenAI API Key)

### 1. Clone the Repository
```bash
git clone https://github.com/Mayur51015/Mavi-Linking.git
cd Mavi-Linking
```

### 2. Backend Setup
Navigate to the server directory, install dependencies, and configure environment variables.
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory using `.env.example` as a template:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# AI APIs (Provide at least one)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the client directory, and install dependencies.
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory (optional if relying on defaults):
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables Guide

### Backend (`server/.env`)
- `PORT`: The port your API runs on (default: 5000).
- `NODE_ENV`: Set to `development` or `production`.
- `MONGODB_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A strong random string used to sign JSON Web Tokens.
- `CLIENT_URL`: The URL of your frontend (used for CORS, e.g., `http://localhost:5173`).
- `GEMINI_API_KEY`: API key for Google's Generative AI (used for developer insight generation).
- `OPENAI_API_KEY`: Fallback API key for AI generation.

### Frontend (`client/.env`)
- `VITE_API_URL`: Points to your backend API URL.

---

## 📡 API Endpoints Overview

The backend exposes a highly modular REST API. Below are the primary route prefixes:

| Endpoint Prefix | Description |
| :--- | :--- |
| `/api/auth` | User registration, login, and fetching current user context (`/me`). |
| `/api/platforms` | Endpoints to sync and manage GitHub accounts. |
| `/api/leetcode` | Endpoints to sync and fetch LeetCode analytics and problem breakdown. |
| `/api/scores` | Manages user ranking, gamification scores, and leaderboard data. |
| `/api/projects` | User portfolio project management. |
| `/api/ai` | Triggers LLM analysis to generate Developer DNA and insights. |
| `/api/recruiter` | Fetch public profiles, bookmarking functionalities for HR. |
| `/api/verification`| Platform verification tokens and callbacks. |

*Public user profiles are accessible at `/api/public/u/:username`.*

---

## 🚢 Deployment Instructions

### Deploying the Backend (Render / Heroku / DigitalOcean)
1. Ensure your MongoDB cluster allows external IP connections (e.g., `0.0.0.0/0` in MongoDB Atlas).
2. Push your `server` code to a repository and link it to your hosting provider.
3. Add all your production environment variables (from your `.env` file) to the host's environment settings.
4. Set the Start Command to: `npm start` (which runs `node src/server.js`).

### Deploying the Frontend (Vercel / Netlify)
1. Link your frontend repository to Vercel/Netlify.
2. Set the build command to `npm run build` and the output directory to `dist`.
3. Add the `VITE_API_URL` environment variable pointing to your deployed backend URL (e.g., `https://mavi-linking-api.onrender.com/api`).
4. Deploy!

---

## 📁 Project Structure

```text
Mavi-Linking/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # Axios configurations
│   │   ├── components/     # Reusable UI components & Widgets
│   │   ├── context/        # React Context (Auth)
│   │   ├── pages/          # Full page views (Dashboard, Login, Profile)
│   │   └── App.jsx         # App routing
│   └── package.json
└── server/                 # Node/Express Backend
    ├── src/
    │   ├── config/         # DB & Socket configurations
    │   ├── controllers/    # Route controllers
    │   ├── middleware/     # Auth, Validation, Error Handling
    │   ├── models/         # Mongoose Schemas (User, DNA, LeetCodeAnalytics)
    │   ├── routes/         # Express API routes
    │   └── services/       # External API & AI integration
    └── package.json
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the ISC License.
