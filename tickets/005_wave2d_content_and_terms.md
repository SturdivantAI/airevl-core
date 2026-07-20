# Ticket 005: Content pages — solutions, training, about + Terms of Use (Wave 2D)

## Context & destination
`/solutions`, `/training`, `/about` are stubs; `/terms` doesn't exist. Done = all four populated from config-driven copy, with the Terms carrying the synthetic-data and no-advice disclaimers. Spine: `IA_UX_RESTRUCTURE_BLUEPRINT.md` §2, §5-D3; compliance copy rule throughout: guardrail language ("engineered to help you meet…"), never "ensures/guarantees compliance"; no CBN circular numbers or statutory citation strings in public copy (they are flagged verify-before-publish).

## Requirements & seams

**Copy architecture:** extend `config/solutions.json` with a `detail` block per card (heading, 2–3 paragraphs, capability bullets) and add `config/pages.json` for training/about/terms copy. Typed loaders in `lib/`. Zero copy in JSX. Use the copy provided below verbatim; where marked [EXPAND], write 1–2 plain, factual sentences consistent with the one-liners — no statistics, no client claims, no named regulators as customers.

**`/solutions`:** intro line + one section per active card (anchor id = slug, matching home-card links) in this order: Corporate AI Automation, Training & Certifications, Sovereign Compliance Suite (four capability sub-blocks: Hybrid Edge Isolation, Regulatory Telemetry, UBO/AML Investigator, 72-Hour Breach Response), Research Desk (RaaS), Agent Foundry (MAaaS). Pending cards get a short "in development" strip at the bottom. Each section: heading, copy, capability bullets, CTA → `/contact`.

**`/training`:** two tracks — Corporate track (team upskilling in agentic AI, zero-trust engineering practice) and University/Certification track (structured curricula delivered with institutional partners). Include the flagship syllabus line: "Architecting atomic migrations and zero-trust edge topographies under Nigerian data-protection and financial-regulatory frameworks." Wording rule: describe certificates as issued by AiRevl or "with partner institutions" — never imply university accreditation. CTA → `/contact`.

**`/about`:** who we are (AiRevl, trading name of AI Revolution Partners Limited, RC from brand.json legal block); what we build (one paragraph from the hero thesis: autonomous multi-agent systems with human oversight); how we work (zero-trust engineering, mock-data-bounded demos, human gates on high-risk actions); compliance posture (posture wording from brand.json only). No director personal details.

**`/terms` (Terms of Use):** render with `<!-- DRAFT — counsel review required -->` marker, facts from brand.json. Sections:
> **Who we are.** This website is operated by AI Revolution Partners Limited (RC {rc_number}), trading as AiRevl.
> **Informational only.** Content on this site describes our services and does not constitute legal, regulatory, or professional advice. Engaging us happens under a separate written agreement.
> **Demos.** Interactive demonstrations run on synthetic data. They illustrate capability and do not represent any real system, customer, or regulatory outcome.
> **No compliance guarantee.** Our tools and services are engineered to help organisations work toward their regulatory obligations. Nothing on this site promises or guarantees regulatory compliance.
> **Intellectual property.** The AiRevl name, logo, and site content belong to AI Revolution Partners Limited. Don't reproduce them without permission.
> **Acceptable use.** Don't attempt to disrupt, probe, or misuse this site or its forms.
> **Liability.** To the extent the law permits, we accept no liability for loss arising from reliance on site content.
> **Contact.** {corporate_email}.

Footer: add "Terms" link next to "Privacy" (both shells).

## Verification criteria
- [ ] `npx tsc --noEmit` and `next build` green
- [ ] All four routes render real content; home-card anchors land on the right sections
- [ ] Zero hardcoded copy in JSX; all from config via typed loaders
- [ ] No "ensures/guarantees compliance" anywhere; no circular numbers/statutory citations in copy
- [ ] Terms carries the DRAFT marker and the synthetic-data + no-advice disclaimers
- [ ] Footer shows Privacy + Terms on both shells; AA contrast maintained
- [ ] `lib/security`, `model_policy.json`, API routes untouched
