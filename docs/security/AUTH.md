# Access Control Architecture

How AiRevl identifies people, keeps them signed in, and decides what they may touch. Applies to the Academy (`/training/**`), the certificate API and every server route.

Source of truth in code:

| Concern | File |
| --- | --- |
| Browser auth client | `src/lib/academy/browserClient.ts` |
| Sign-in, sign-out, session state | `src/lib/academy/useAcademy.tsx` |
| Magic-link landing | `src/app/(marketing)/auth/callback/page.tsx` |
| Server-side token verification | `src/app/api/academy/certificate/route.ts` |
| Database authorisation (RLS) | `supabase/migrations/002_*.sql`, `005_*.sql` |

---

## 1. Authentication

**Identity provider:** Supabase Auth (GoTrue). AiRevl stores no passwords and runs no credential hashing of its own.

**Method:** passwordless email magic link (`supabase.auth.signInWithOtp`).

1. The learner enters an email address on `/training/signin`.
2. Supabase emails a single-use link. The link expires after **1 hour** (Supabase: Authentication → Providers → Email → *Email OTP Expiration* = `3600`).
3. The link lands on `/auth/callback`, which waits for the session, strips the token from the address bar, and redirects to the course.
4. A first-time address creates the user record automatically.

**Why implicit flow, not PKCE:** learners open the link from mail apps that hand it to a different browser. PKCE stores its verifier in the requesting browser and fails across browsers. This trade-off is accepted and documented in `docs/ACADEMY_OPERATIONS.md`. The compensating control is that the token is removed from the URL immediately on landing.

**Planned (account-first enrolment):** an explicit *Create account* step that records the learner's full legal name once, before the course starts, and normalises the email (trimmed, lower-cased) so one person maps to one account. The name on the certificate comes from this record.

**Credential hashing:** not applicable to learners (no passwords). If password sign-in is ever enabled, Supabase hashes with bcrypt; do not build a parallel password store.

**MFA expectations:**

| Who | Requirement |
| --- | --- |
| Learners | Not required. The magic link proves control of the inbox. |
| Maintainers (Supabase, Vercel, GitHub, Upstash, Resend dashboards) | **Mandatory** TOTP or hardware-key MFA. |
| Future admin role in the app | Must require Supabase MFA (`aal2`) before any admin action. |

## 2. Session lifecycle

| Event | Policy | Where it is set |
| --- | --- | --- |
| Access token lifetime | **1 hour** (JWT `exp`) | Supabase: Auth → Settings → *JWT expiry* = `3600` |
| Silent refresh | Automatic before expiry using the refresh token | `autoRefreshToken: true` in `browserClient.ts` |
| Refresh-token reuse | Rotated on every use; reuse of an old token revokes the session family | Supabase: *Detect and revoke compromised refresh tokens* = **on** |
| Maximum session age | **30 days**, then the learner must sign in again | Supabase: Auth → Sessions → *Time-box user sessions* |
| Inactivity timeout | **7 days** without activity ends the session | Supabase: Auth → Sessions → *Inactivity timeout* |
| Sign-out | `supabase.auth.signOut()` revokes the refresh token server-side; the client clears every `airevl_academy_*` key from `localStorage` | `useAcademy.tsx` |
| Suspected breach of one account | Delete the user's sessions: Supabase → Authentication → Users → *Sign out user* | Dashboard |
| Suspected breach of the platform | Rotate the JWT secret (invalidates every session at once), then rotate `SUPABASE_SERVICE_ROLE` and the anon key, and redeploy | Dashboard + Vercel |

Sessions persist in browser storage (`persistSession: true`). This is acceptable because a token alone can only read and write that learner's own Academy rows (see §4).

## 3. Permission checking

Authorisation is enforced per request at two layers. Neither layer trusts the browser.

**Layer 1 — Postgres Row Level Security (every request from the browser).** The anon key carries the learner's JWT. Each Academy policy compares `auth.uid()` with `user_id`, so the database itself refuses cross-user reads or writes even if application code is wrong.

**Layer 2 — Route handlers (every privileged request).** Next.js has no global auth middleware here by design: most pages are public marketing content. Instead, each route that acts on behalf of a user verifies the token itself before doing anything else:

```ts
// src/app/api/academy/certificate/route.ts (abridged)
const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
const { data, error } = await admin.auth.getUser(token);   // verified by Supabase Auth
if (error || !data.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

// Only now: every query is filtered by data.user.id, never by an id from the body.
```

**Rules for new routes:**

1. A route that reads or writes user-owned data must verify the bearer token with `auth.getUser()`, never by decoding the JWT without verification.
2. The user id comes from the verified token, never from the request body or query string.
3. Using the service role is permitted only after step 1, and every query must be filtered by the verified user id.
4. A route that calls a paid model API must be authenticated or rate-limited, or both (see THREAT_MODEL finding F-1).

If a group of routes ever shares an auth requirement, add a `src/proxy.ts` (the Next.js 16 name for middleware) matcher for that path prefix rather than repeating the check.

## 4. Access boundary

**Learner (role `authenticated`):**

| Table | Read | Write |
| --- | --- | --- |
| `academy_enrollments` | Own row | Insert and update own row |
| `academy_progress` | Own rows | Insert own rows |
| `academy_quiz_attempts` | Own rows | Insert own rows |
| `academy_certificates` | Own row | **None** (removed by migration 005; issuance is server-only) |
| `academy_waitlist` | None | None (server route only) |

**Anonymous visitor (role `anon`):** public demo tables (`telemetry_*`, `network_telemetry`, `training_*`, `ecosystem_*`) read-only, and the `verify_certificate(code)` function, which returns only holder name, course, issue date and revoked status.

**Server (service role):** certificate issuance and waitlist writes, always scoped to a verified user or a validated form submission.

**Administrators:** there is no admin role inside the application today. Administrative actions (revoking a certificate, deleting a user, exporting data) are performed in the Supabase dashboard by named maintainers with MFA. When an in-app admin console is built, it must:

- use a dedicated role claim (`app_metadata.role = 'admin'`), which only the service role can set and the user cannot edit,
- check that claim in both the route handler and an RLS policy,
- require MFA (`aal2`),
- write every admin action to `audit_events`.

**Multi-tenancy:** the current tenant unit is the individual learner. When corporate cohorts arrive, add an `organisation_id` to enrolments and extend each policy to `auth.uid() = user_id OR <is org admin for organisation_id>`. Never widen a policy to `USING (true)` on a table holding learner data.
