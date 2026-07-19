# Ticket 004: Contact page + privacy notice (Wave 2C)

## Context & destination
`/contact` is a stub and the site collects personal data with no privacy notice — the NDPA gap flagged in `IA_UX_RESTRUCTURE_BLUEPRINT.md` §6 (R1/R3). Done = a working, hardened contact form that cannot collect a byte of personal data without the notice beside it. Rule: the form and the notice ship in the SAME wave — never the form alone.

## Requirements & seams

**Contact form (`(marketing)/contact/page.tsx`):**
- Fields: name, email, organization (optional), message. Submits through the existing Formspree wiring / `app/api/contact/route.ts` — keep the existing Zod contracts and `sanitize.ts` injection screening intact.
- **Honeypot:** hidden field (e.g., `company_website`); non-empty value → silently accept-and-drop (no signal to bots).
- **Rate limit:** on the API route via Upstash REST (`UPSTASH_REDIS_REST_URL`/`_TOKEN`), window per `model_policy.json` `rate_limit` (60s/30). **Degradation rule:** if Redis env is missing or errors, fall back to a best-effort in-memory limiter and continue — never 500 on a limiter failure (lesson from the Supabase env incident).
- Success state ("Message received — we reply within 2 business days") and error state with retry; both accessible (aria-live).
- **Consent line directly above the submit button:** "By submitting, you agree to our [Privacy Notice](/privacy)." Submit button disabled until a consent checkbox is ticked.

**Privacy notice (`(marketing)/privacy/page.tsx`):**
Render the following content (H1 "Privacy Notice", sections as H2). Include an HTML comment at top: `<!-- DRAFT — Nigerian counsel review required before any formal compliance claim -->`.

> **Who we are.** AiRevl is a trading name of AI Revolution Partners Limited (RC 9432444), No. 6, Aknaton Estate, Dunamis Church Road, Garki/Area 1, FCT, Nigeria.
> **What we collect.** When you use our contact form: your name, email address, organization (if provided), and message. We do not use this site to collect any other personal data.
> **Why we collect it.** To respond to your enquiry and follow up on it. That is the only purpose.
> **Where it goes.** Form submissions are processed by Formspree, Inc., a form-processing provider operating on infrastructure in the United States. Submitting the form transfers your data to that infrastructure.
> **How long we keep it.** For as long as needed to handle your enquiry, after which it is deleted from our systems.
> **Your rights.** Under the Nigeria Data Protection Act 2023 you may request access to, correction of, or deletion of your personal data. Contact contact@airevl.ai (from brand.json) for any request.
> **Changes.** We will update this notice as our data practices or the law change.

- Company facts pulled from `brand.json` legal block — no hardcoded RC/address strings.
- Footer: add a "Privacy" link (all pages). Do NOT reinstate any compliance badge — posture wording stays as-is.

## Verification criteria
- [ ] `npx tsc --noEmit` and `next build` green
- [ ] Form submits end-to-end (test message reaches inbox); Zod + sanitize path intact
- [ ] Honeypot silently drops; rate limit engages on burst; limiter failure does NOT 500
- [ ] Consent checkbox gates submission; notice link works; `/privacy` renders with brand.json facts
- [ ] Footer shows Privacy link on marketing and console shells
- [ ] No compliance badge added; `lib/security` contracts unchanged (extended only if a new field needs a schema)
