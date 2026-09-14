# Supabase Auth

Supabase Auth is the single source of truth for authentication. The Fastify API
issues no tokens and stores no passwords: it verifies Supabase access tokens
against the project's JWKS and resolves the application `users` row from the
verified `sub`.

Pre-Supabase accounts were test data only and are not migrated. Production
starts with fresh Supabase users.

---

## Request flow

```
React ──signUp / signInWithPassword──▶ Supabase Auth
React ──Authorization: Bearer <access_token>──▶ Fastify /api/*
Fastify: jwtVerify(JWKS, ES256/RS256, iss=<SUPABASE_URL>/auth/v1, aud=authenticated)
       → Admin API getUserById(sub): exists, email confirmed, not banned (cached 60 s)
       → users WHERE supabase_user_id = sub → role → route authorization
```

- `api/src/infrastructure/services/supabase-auth.svc.ts` — token verification
  and identity lookup. No JWT secret; HS* tokens are rejected.
- `api/src/infrastructure/http/plugins/auth.ts` — `authenticateToken`,
  `authenticate`, `authorize(roles)`, `tryAuthenticate` (guest checkout, coupon
  validation — never throws, never elevates).
- Routes are protected by default; `protected: false` opts out, `roles` adds
  role checks, `tokenOnly` is used only by `POST /auth/sync`.

## Account linking — `POST /auth/sync`

Runs after every Supabase sign-in (`restoreSession`). Identity comes only from
the verified token and the Supabase Admin API; the body may only supply display
fields (first/last name, phone) for a new row.

1. Row with `supabase_user_id = sub` → return it (email mirrored from Supabase).
2. Any other row already holding that email → **409**, nothing is linked.
3. Otherwise → create a row with role `User`.

Rows are never adopted by email, so a Supabase account can't inherit someone
else's profile or role. Roles only change through `PATCH /api/users/:id/role`
(Admin-only) or directly in the database.

## Email links

The client uses PKCE (`flowType: 'pkce'`, `detectSessionInUrl: false`).
`/auth/callback` accepts:

| Link | Source | Works in another browser/device? |
| --- | --- | --- |
| `?code=…` | Default templates (`{{ .ConfirmationURL }}`) | No — needs the PKCE verifier. The email *is* confirmed by Supabase before redirecting, so the user can sign in on the original device. The page says so instead of claiming the link is invalid. |
| `?token_hash=…&type=…` | Only if a template is customised to link to `/auth/callback?token_hash={{ .TokenHash }}&type=…` | Yes |
| `#access_token=…` | — | Rejected (would allow login-CSRF). |

Password reset: `/forgot-password` → email → `/auth/callback` (recovery) →
`/reset-password` → `updateUser({ password })` → other sessions revoked.

## Schema

`api/src/infrastructure/database/migrations/20260605000000_supabase_auth_link.sql`
(additive, idempotent): adds nullable unique `users.supabase_user_id uuid`, makes
`users.password_hash` nullable. `password_hash` is unused by authentication and
kept until it is dropped deliberately in a later migration.

Apply with `bun run migrate` from `api/` (uses `DATABASE_URL`).

## Removed

| Removed | Replacement |
| --- | --- |
| `POST /users/login`, `@fastify/jwt`, `JWT_SECRET`, `JWT_EXPIRES_IN` | Supabase sign-in + JWKS verification |
| `PATCH /users/:id/password` | `supabase.auth.updateUser` (current password re-verified first) |
| `POST /users` (public signup, later admin create-with-password) | Supabase signup + `POST /auth/sync` |
| `email` in `PATCH /users/:id` | Email is owned by Supabase Auth |

`@fastify/jwt` is still listed in `api/package.json` but no longer imported; it
can be removed together with a `bun.lock` refresh.
