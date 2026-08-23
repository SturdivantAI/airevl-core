# AiRevl Academy — setup and operations

Tier 1 (Automation 101, free) plus waitlist capture for Tier 2/3.
Everything degrades gracefully: with no Supabase config the course runs in
demo mode (progress on-device, clearly labelled), and waitlist submissions
fall back to Formspree.

## Routes

| Route | Purpose |
|---|---|
| `/training` | Academy catalog: 3 tiers, Tier 2/3 waitlist, institutional tracks |
| `/training/signin` | Magic-link sign-in (demo mode if Supabase unconfigured) |
| `/training/automation-101` | Course overview: progress, sequential module unlock |
| `/training/automation-101/[moduleId]` | Lesson player: objectives, lesson, sandbox, quiz |
| `/training/automation-101/certificate` | Certificate + badge, issued on completion |
| `POST /api/academy/waitlist` | Tier 2/3 lead capture (rate-limited, zod-validated) |

## Enable real accounts (Supabase)

1. Run `supabase/migrations/002_academy_schema.sql` in the Supabase SQL editor.
2. Add browser-safe env vars (same project as the existing server-side pair):

```
NEXT_PUBLIC_SUPABASE_URL=<same value as SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same value as SUPABASE_ANON_KEY>
```

   The anon key is designed to be public; RLS policies restrict every academy
   table to the row owner. The service_role key must NEVER get a NEXT_PUBLIC prefix.
3. In Supabase Dashboard → Authentication → URL Configuration, add the site URL
   and `https://<domain>/training/automation-101` to the redirect allow-list.
4. Authentication → Email: magic link (OTP) is on by default. Customise the
   email template with AiRevl branding when ready.

Until step 2 is done, the UI shows demo mode and stores progress in
localStorage. No crash, no 500.

## Content editing

All course copy lives in `src/lib/academy/content.ts` (zero copy in JSX,
consistent with house style). Modules, quizzes, sandbox rubrics, tier blurbs,
and shell labels are all data. Adding a Tier 2 course later means adding a
second content module and reusing the same components.

## Design notes

- Sandbox exercises are simulated (keyword rubric + scripted responses):
  zero API cost and zero prompt-injection surface on a free public tier.
  A live-model sandbox is a natural Tier 2 upgrade via the existing
  `/api/agent` model-router.
- Module unlock is sequential (Coursera-style). Quiz attempts are recorded
  (Supabase mode) for future analytics; nothing blocks on quiz score in Tier 1.
- Certificates carry a code (`AR101-XXXXXX`, unique per user+course). A public
  `/verify/[code]` endpoint can be added later using the service_role client.

## NBC engagement notes

- Course examples are regulator-flavoured (transcript review, complaints,
  compliance tables) but name no client. A private co-branded cohort page can
  sit at `/training/nbc` later, feeding the same course.
- The memo's core concern (skeptical validation of AI output) is addressed in
  Module 6 and threaded through every sandbox rubric ("verification-first"
  prompting), which is the differentiator to emphasise in the proposal.
