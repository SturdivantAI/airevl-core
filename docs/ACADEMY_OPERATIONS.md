# Academy operations — sign-in, resume, certificates, capacity

What the Academy needs from the Supabase dashboard and the Vercel environment to
work in production, and what it does under load. Written after the September 2026
round of learner reports.

Code fixes are on `fix/academy-auth-resume-capacity`. **Three of the items below
are dashboard settings, not code** — the deploy alone will not fix sign-in.

---

## 1. Sign-in was delivering learners to `localhost:3000`

**Symptom.** A learner taps the link in their email and lands on
`http://localhost:3000/#access_token=…` — "This site can't be reached" on
Android, "Safari can't open the page" on iOS. Reported from 26 Aug onwards.

**Cause.** Two settings, one code gap.

The client asked for the right redirect (`window.location.origin` +
`/training/automation-101`). Supabase discarded it, because **a `redirect_to`
that is not on the Redirect URLs allow list is silently dropped and replaced by
Site URL** — and Site URL was still `http://localhost:3000` from development.
The token verified correctly; it was just delivered to a dead address on the
learner's phone.

Separately, the app had **no `/auth/callback` route at all**, so the session
depended entirely on the implicit hash flow landing on exactly the right page.

**Fix — dashboard (required).** Authentication → URL Configuration:

| Setting | Value |
| --- | --- |
| Site URL | `https://www.airevl.ai` |
| Redirect URLs | `https://www.airevl.ai/**`, `https://airevl.ai/**` |

Add `http://localhost:3000/**` as well if you still develop locally — the allow
list takes several entries, Site URL takes one. Preview deployments need
`https://*-sturdivantai.vercel.app/**` (or whatever your Vercel preview pattern
is) or sign-in will fail on every preview build.

**Fix — code (done).** `src/app/(marketing)/auth/callback/page.tsx` now owns the
landing moment: it waits for the session rather than racing it, reports an
expired or reused link in plain language instead of showing a blank course page,
and strips the tokens out of the address bar before redirecting, so a session
is not left sitting in browser history.

`emailRedirectTo` now points at `/auth/callback?next=/training/automation-101`.

### The email template is also wrong

The message learners received was Supabase's **"Confirm your email address"**
(the *Confirm signup* template), not a magic link — because `signInWithOtp`
creates the user on first use and Supabase sends the signup confirmation for a
new address. The UI meanwhile says "check your email for a sign-in link".

Authentication → Email Templates → **Confirm signup**: reword it to match the
sign-in language, or turn off "Confirm email" under Authentication → Providers →
Email so returning and new learners both get the Magic Link template. Whichever
you pick, keep `{{ .ConfirmationURL }}` intact.

### Why implicit flow, not PKCE

`src/lib/academy/browserClient.ts` pins `flowType: "implicit"` on purpose.
Learners open the link from a mail app, which routinely hands it to a different
browser or an in-app webview from the one that requested it. PKCE keeps its code
verifier in the *requesting* browser's storage, so a cross-browser open has
nothing to exchange the code with and sign-in fails. Implicit carries the
session in the fragment and completes wherever the link lands. Do not "upgrade"
this without solving that first.

---

## 2. Learners lost their place

**Symptom.** "Pausing training mid-session and returning later doesn't take you
where you left off, it makes you start afresh."

**Two causes, from two different eras of the deploy.**

*Before 23 Aug 2026* (commit `6053bc1`), `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` were not set on the running build, so the
Academy ran in **demo mode**: identity and progress in `localStorage` only. A
different browser, a different device, cleared site data, or roughly seven days
of Safari ITP eviction, and the work was gone. It was never on a server. Those
learners cannot be recovered — if any of them are still around, they have to
start again, and it is worth telling them why.

*Still true until this branch:* progress was recorded only as *module N
completed* — one row per finished module in `academy_progress`, with no record
of position **within** a module. Stopping halfway through a twenty-minute module
returned you to the top of it.

**Fix (done).** Merged from `phase5r/academy-resume`, which was never merged and
whose migration never ran. `academy_enrollments` gains `last_module_id`,
`last_block_index` and `last_seen_at`; a debounced, monotonic scroll observer
records the furthest block reached, and the course page offers to resume there.
Monotonic matters: glancing back at an earlier block must not drag the resume
point backwards.

**Run migration `004_academy_resume_point.sql`.**

---

## 3. Certificates were self-issued and never sent

**What was wrong.** Three things, in order of severity.

1. **Anyone could mint one.** The browser generated the certificate code and
   inserted the row itself under the learner's own RLS policy, so `holder_name`
   and `score` were whatever the client chose to send. Devtools and a signed-in
   account were enough to produce an AiRevl certificate in any name, with a
   perfect score, without completing a single module.
2. **Nothing was emailed.** `resend` was installed but unused. The certificate
   existed only as a page the learner could print.
3. **Nobody could check one.** A certificate a learner prints from their own
   browser proves nothing to an employer.

The name printed came from the sign-in box — labelled "Your name" and filled in
by people as `tunde.a` — and no one was ever asked whether they wanted their
name on a public page.

**Fix (done).**

- `POST /api/academy/certificate` issues server-side, verifying the caller's
  Supabase JWT and checking `academy_progress` against the real module list
  before minting anything. Idempotent: a refresh cannot produce a second code.
- Migration `005` **drops the learner INSERT policy** on `academy_certificates`.
  Issuance is service_role only from here on.
- The certificate is emailed via Resend, with the credential ID, the
  verification URL and LinkedIn "Licenses & Certifications" details. A failed
  send is recorded (`email_sent_at` stays NULL) and retried on the next request
  rather than being lost silently.
- `/verify/<code>` is a public check backed by a `SECURITY DEFINER` function
  that returns the holder name, course and issue date **and nothing else** — no
  email, no score, no user id — so walking the code space leaks nothing beyond
  what is printed on a certificate someone was handed anyway.
- The learner now confirms the printed name at issuance and consents explicitly
  to public verification. Declining still gets them a certificate; it just isn't
  independently checkable.
- `revoked_at` lets you withdraw a certificate. Verification then reports it as
  *withdrawn* rather than *not found*, so a revoked code stays distinguishable
  from a fake one.

**Run migration `005_academy_certificate_issuance.sql`.**

### Environment

| Variable | Purpose | Consequence if missing |
| --- | --- | --- |
| `RESEND_API_KEY` | Certificate delivery | Certificate still issues; no email |
| `RESEND_FROM` | Sender, e.g. `AiRevl Academy <academy@airevl.ai>` | Falls back to that address |
| `RESEND_REPLY_TO` | Defaults to `contact@airevl.ai` | — |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin printed on certificates | Falls back to `https://www.airevl.ai` |

The sending domain must be verified in Resend (SPF + DKIM) or mail will go to
spam, which for a certificate is the same as not sending it.

---

## 4. Capacity: can it take 50 visitors?

**Not as configured. One hard wall, and it is the email.**

### The blocker

**Supabase's built-in email sender is capped at 2 emails per hour** — project-wide,
not per user. With no custom SMTP configured, visitors 3 through 50 never receive
a sign-in link at all. This is almost certainly already happening and reaching
you as "the link never came".

**Fix.** Authentication → Emails → SMTP Settings → enable custom SMTP. Resend is
already a dependency and you already have an API key:

| Field | Value |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your `RESEND_API_KEY` |
| Sender | `academy@airevl.ai` (domain verified in Resend) |

Then raise the cap under Authentication → Rate Limits → "Rate limit for sending
emails". The default with custom SMTP is 30/hour, which is still short for a
50-person cohort arriving together — set it to at least 100/hour. Resend's own
free tier allows 3,000 emails/month and 100/day; a 50-person cohort is well
inside that, but check it before a larger intake.

### Everything else at 50 concurrent

| Layer | Verdict |
| --- | --- |
| Vercel serverless | Fine. Course pages are static or SSG; only 3 routes are dynamic. |
| Supabase Postgres | Fine. Reads are indexed single-row lookups on `(user_id, course_id)`; PostgREST pools connections. |
| Supabase Auth sign-ins | Fine. 30 requests per 5 min **per IP** — only a constraint if a whole cohort shares one office NAT, which is worth knowing if these are in-person sessions. |
| Upstash rate limiter | Fine, **if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.** Without them the limiter silently degrades to in-memory, which does not share state between serverless instances and so bounds nothing in practice. Check these are present. |
| Resume writes | Fine. Debounced to one write per 1.5 s of scrolling, per learner. |
| Certificate issuance | Fine. Once per learner, rate-limited to 8/min per IP. |

**Token verification is also capped at 30 per 5 minutes per IP.** A cohort
clicking their links simultaneously from one shared network will hit this.
For an in-person session, stagger sign-ins or have people use mobile data.

---

## Deploy order

Migrations first, then the dashboard, then the code — in that order, so nothing
points at something that does not yet exist.

1. Run `004_academy_resume_point.sql` in the Supabase SQL editor.
2. Run `005_academy_certificate_issuance.sql`.
3. Set Site URL and Redirect URLs (section 1).
4. Fix the Confirm signup template, or disable email confirmation (section 1).
5. Enable custom SMTP and raise the email rate limit (section 4).
6. Add `RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_SITE_URL` to Vercel
   (Production **and** Preview — Vercel only picks up env vars on a new build).
7. Confirm `UPSTASH_REDIS_REST_URL` / `_TOKEN` are set.
8. Merge and deploy `fix/academy-auth-resume-capacity`.

### Smoke test after deploying

- Request a link with an address that has **never** signed up. Confirm the email
  wording matches what the UI promised.
- Open that link **on a phone, from the mail app** — not by pasting it into
  desktop Chrome. That is the path that was broken and the only one that proves
  it is fixed.
- Confirm you land on the course, signed in, with no `#access_token` left in the
  address bar.
- Start a module, scroll halfway, close the tab. Reopen on a **different device**
  and confirm it offers to resume at that block.
- Complete all seven modules, issue a certificate, confirm the email arrives,
  and open `/verify/<code>` in a private window.
- Request a link twice inside a minute and confirm the second attempt gives the
  "try again shortly" message rather than failing silently.
