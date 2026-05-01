// Auth0 routes are handled by the middleware (middleware.ts → auth0.middleware).
// This file intentionally left as a no-op fallback — requests to /api/auth/*
// should never reach here because the middleware intercepts them first.
export const runtime = 'nodejs'
