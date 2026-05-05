# MaVi Linking Backend

## Overview
This backend provides authentication and platform account linking for the MaVi Linking application.

## Project Structure

```
server/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── src/
    ├── server.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   └── platformController.js
    ├── middleware/
    │   ├── auth.js
    │   ├── errorHandler.js
    │   └── validate.js
    ├── models/
    │   └── User.js
    └── routes/
        ├── authRoutes.js
        └── platformRoutes.js
```

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- Secure HTTP headers with Helmet
- CORS restricted to the frontend origin
- Rate limiting: 100 requests per 15 minutes per IP
- Body parser limit: 10KB JSON payloads
- Express-validator input validation for auth and platform endpoints
- MongoDB connection with retry and event listeners
- Account linking for GitHub, Codeforces, LeetCode, and Stack Overflow

## API Endpoints

### Public
- `GET /api/health` — server health check
- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — login and receive JWT

### Protected (Bearer token)
- `GET /api/auth/me` — get current authenticated user
- `PUT /api/auth/me` — update user name or avatar URL
- `GET /api/platforms` — list linked platform statuses
- `PUT /api/platforms` — bulk link platforms
- `GET /api/platforms/data` — fetch platform profile data for all linked platforms
- `GET /api/platforms/:platform/data` — fetch profile data for a single linked platform
- `PUT /api/platforms/:platform` — link/update a single platform
- `DELETE /api/platforms/:platform` — unlink a platform

## Platform data caching
- Platform profile data is stored under each user's `platformData` field.
- Cached data is refreshed automatically when a platform is linked.
- Use `GET /api/platforms/data` or `GET /api/platforms/:platform/data` to fetch missing cached data.

## Environment

Copy `.env.example` to `.env` and update values as needed.

Required values:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `CLIENT_URL`

## Run Locally

```bash
cd server
npm install
npm run dev
```

## Notes

- `JWT_SECRET` must be kept secure in production.
- `platforms` are stored in the user document with `username`, `linkedAt`, and cached `platformData`.
- Validation rules are enforced for platform usernames according to each platform's format.
