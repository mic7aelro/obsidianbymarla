// Ceiling for how long a sealed session cookie stays valid. Shared between
// lib/session.ts (Node.js route handlers) and middleware.ts (edge runtime) —
// keep this dependency-free so middleware doesn't pull in next/headers.
export const REMEMBER_ME_TTL_SECONDS = 60 * 60 * 24 * 90
