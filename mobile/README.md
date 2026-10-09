# EduTalentX Mobile Application (Android)

EduTalentX Android Mobile Application built with **React Native**, **Expo (SDK 57)**, **Expo Router**, and **TypeScript**.

---

## 📱 Architecture & Highlights

- **Native UI (No WebView)**: Custom-built mobile UI following a clean, professional SaaS aesthetic (pure white surfaces `#ffffff`, deep charcoal readable typography `#09090b`, subtle borders `#e4e4e7`, and EduTalentX Blue accent `#2563eb`).
- **Full Backend API Reuse**: Directly integrates with the existing Express/Node.js backend (`/api/auth`, `/api/jobs`, `/api/placement`, `/api/notifications`, `/api/career-match`, `/api/career-lab`, etc.).
- **Multi-Role RBAC**: Automatically resolves and normalizes user roles (`student`, `teacher`, `recruiter`, `institution_admin`, `department_admin`, `super_admin`, `owner`) and gates navigation accordingly.
- **Secure Storage**: JWT access and refresh tokens stored safely via `expo-secure-store` with automatic token attachment in Axios interceptors and 401 session expiration handling.
- **Live Real-Time Updates**: Socket.IO integration authenticates via handshake token and joins scoped rooms (`joinRoom(userId)`) for instant notifications.
- **Multi-Environment Support**: Seamlessly switch between Production (Render), Android Emulator (`10.0.2.2:5000`), Localhost / LAN, and Custom IPs directly from the app login and profile settings.

---

## 📁 Project Structure

```
mobile/
├── app/                              # Expo Router file-based navigation
│   ├── _layout.tsx                   # Root Stack with AuthGate, TanStack Query, & Notification Providers
│   ├── (auth)/                       # Authentication Group
│   │   ├── _layout.tsx
│   │   ├── login.tsx                 # Login with demo quick-presets & environment selector
│   │   ├── register.tsx              # Multi-role registration (Student / Recruiter / Teacher)
│   │   └── forgot-password.tsx       # Password recovery with 10-minute OTP
│   ├── (tabs)/                       # 5-Tab Role-Aware Primary Interface
│   │   ├── _layout.tsx               # Bottom Tab Navigator with unread badge counters
│   │   ├── index.tsx                 # Dynamic Role-Dispatched Dashboard
│   │   ├── opportunities.tsx         # Jobs, drives, and student direct applications
│   │   ├── applications.tsx          # 5-Stage Placement Pipeline Tracker & Stepper
│   │   ├── notifications.tsx         # Real-time notification inbox with category filters
│   │   └── profile.tsx               # User profile, ETX/MAVI ID, PRN, settings & logout
│   ├── student/
│   │   ├── career-match.tsx          # AI Career Match score, target roles & skill gaps
│   │   ├── career-lab.tsx            # What-If Career Simulator & impact score
│   │   ├── github.tsx                # GitHub developer metrics (PRs, commits, reviews)
│   │   └── availability.tsx          # Placement availability & preferences
│   ├── recruiter/
│   │   └── search.tsx                # Developer search, filters (skills, CGPA)
│   ├── teacher/
│   │   └── verification.tsx          # Student verification & approval queue
│   └── +not-found.tsx
├── src/
│   ├── api/
│   │   ├── client.ts                 # Axios client with JWT interceptor & 401 handler
│   │   └── storage.ts                # Expo SecureStore token & profile manager
│   ├── config/
│   │   └── environment.ts            # Environment presets (Prod, Android Emulator, LAN, Custom)
│   ├── constants/
│   │   └── theme.ts                  # Minimal SaaS design tokens, typography & spacing
│   ├── context/
│   │   ├── AuthContext.tsx           # Authentication lifecycle, login, register, session restore
│   │   └── NotificationContext.tsx   # Real-time notifications state & unread counter
│   ├── services/
│   │   └── socket.ts                 # Socket.IO client singleton with auto-reconnect
│   └── components/
│       └── common/                   # Reusable UI components
│           ├── Button.tsx
│           ├── Card.tsx
│           ├── Input.tsx
│           ├── Badge.tsx
│           ├── Header.tsx
│           ├── EmptyState.tsx
│           ├── LoadingScreen.tsx
│           └── TabsSegment.tsx
├── app.json                          # Expo configuration & Android package details
├── eas.json                          # EAS build profiles (development, preview, production)
├── metro.config.js                   # Monorepo Metro bundler resolution
├── tsconfig.json                     # TypeScript compiler configuration
└── package.json
```

---

## 🚀 Running the App Locally

### 1. Prerequisites
- Node.js >= 20
- Expo Go on Android Device OR Android Studio Emulator

### 2. Start Expo Metro Bundler
From the repository root or `mobile/` directory:
```bash
cd mobile
npm start
```
Alternatively:
```bash
npx expo start -c
```

### 3. Running on Android
- **Android Emulator**: Press `a` in the terminal or run `npx expo start --android`.
- **Physical Device**: Scan the generated QR code using the **Expo Go** app on your Android device (ensure your phone is on the same Wi-Fi network).

---

## 🌐 Environment Configuration

In `src/config/environment.ts`, the app supports multiple backends:
1. **Production (Render)**: `https://mavi-server-4yvl.onrender.com/api` (Default for live testing)
2. **Android Emulator (Localhost)**: `http://10.0.2.2:5000/api` (Maps to your computer's `localhost:5000` from Android Emulator)
3. **Local Network / LAN**: `http://<YOUR_LOCAL_IP>:5000/api`
4. **Custom**: User-defined endpoint entered in the app settings

You can change environments at any time by tapping **"Change Server / Environment"** on the Login screen or inside the Profile tab.

---

## 📦 Building Android APK / AAB with EAS

The project includes `eas.json` with three build profiles:

1. **Preview APK (Direct Android Install)**:
```bash
npx eas-cli build -p android --profile preview
```
2. **Development Build (Expo Dev Client)**:
```bash
npx eas-cli build -p android --profile development
```
3. **Production App Bundle (.aab for Google Play Store)**:
```bash
npx eas-cli build -p android --profile production
```
