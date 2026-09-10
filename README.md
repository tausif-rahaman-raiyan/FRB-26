# FRB-26 Monorepo

Single-repository architecture for frontend + secure backend playback authorization.

## Structure

```
.
├── frontend/                 # React UI (course library, search, player, progress UI)
├── backend/                  # Express API (auth session, entitlement, Bunny token, progress)
├── data/                     # Course/video catalog JSON used by backend checks
├── config/                   # Example configuration
├── .github/workflows/ci.yml  # Lint/build/test pipeline
└── .env.example              # Shared env template
```

## Security model

1. User signs in with Firebase in frontend.
2. Frontend sends Firebase ID token to `POST /api/auth/session/login`.
3. Backend verifies token and sets HTTP-only session cookie.
4. Frontend requests `POST /api/video/playback` with `courseId` + `videoId`.
5. Backend validates session, course entitlement, and course-video mapping.
6. Backend returns short-lived Bunny tokenized playback URL.
7. Frontend plays with HLS.js/native HLS and refreshes authorization when needed.

No Bunny signing key or auth secret is exposed to the frontend.

## APIs

- `POST /api/auth/session/login`
- `POST /api/auth/session/logout`
- `GET /api/auth/session/me`
- `POST /api/video/playback`
- `GET /api/progress/:courseId/summary`
- `GET /api/progress/:courseId/:videoId`
- `PUT /api/progress/:courseId/:videoId`

## Environment variables

Use `.env.example` as template. Required sensitive values:

- `BUNNY_HOSTNAME`
- `BUNNY_LIBRARY_ID`
- `BUNNY_SIGNING_KEY`
- `AUTH_SECRET`
- `DATABASE_URL` (reserved for persistent storage)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### GitHub Secrets (recommended)

- `BUNNY_HOSTNAME`
- `BUNNY_LIBRARY_ID`
- `BUNNY_SIGNING_KEY`
- `AUTH_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ENROLLED_EMAILS`

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Deployment

- **GitHub Pages**: deploy `frontend/dist` only (static files).
- **Backend**: deploy `backend` to a Node runtime (VM, container, managed service) using this repo and environment variables.
- Set `VITE_API_BASE_URL` in frontend build to your backend URL.

## Credential cleanup note

The previous frontend had embedded Firebase config values. They were removed and replaced with environment-based configuration. If those values were from a real project, rotate credentials and review Firebase security rules.
