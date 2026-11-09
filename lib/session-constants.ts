// Ceiling for how long a sealed session cookie stays valid. Shared between
// lib/session.ts (Node.js route handlers) and middleware.ts (edge runtime) —
// keep this dependency-free so middleware doesn't pull in next/headers.
export const REMEMBER_ME_TTL_SECONDS = 60 * 60 * 24 * 30

// "Keep me signed in" sessions slide: any admin/planner visit after this long
// re-issues the cookie for another full TTL, so only 30 idle days log her out.
export const SESSION_REFRESH_AFTER_MS = 1000 * 60 * 60 * 24
