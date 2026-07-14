# OKF Bundle — Open Knowledge Framework Schema Spine

**Version:** 1.0.0
**Status:** Active — CI-gated source of truth

## Purpose

The `okf-bundle/` is the single source of truth for all runtime contracts in the AiRevl platform. Every schema in this bundle has a direct consumer in the codebase — synergy is enforced by CI, not documented.

## Schema Map

| Schema | Consumer | Purpose |
|---|---|---|
| `schemas/entity.schema.json` | `lib/security/schemas.ts` (Zod derivation), `lib/skill-engine`, `lib/model-router` | Entity contracts for agents, skills, and model entries |
| `schemas/inference.schema.json` | `lib/model-router` invoke + parity guard, M1 telemetry, Demo 3 (LLM-as-Judge) | Inference request/response shape |
| `schemas/audit.schema.json` | `lib/security/guard.ts` (refusal → audit), Screen 4 (Zero-Trust Log Terminal), M3 semantic memory | Audit event structure; PII-free |

## Governance

- Every schema carries `okfVersion` (semver, currently `1.0.0`)
- Breaking changes require: major version bump + `versions/CHANGELOG.md` entry + passing CI
- CI gate: `scripts/okf_validate.py` — fails build on:
  - Malformed schemas
  - Version mismatch between `okf-bundle` and `config/model_policy.json`
  - `mock-data/` fixtures that drift from schemas
- M3 memory entries treated as untrusted until validated against these schemas
- Never store PII in audit logs or memory entries

## Phase Touchpoints

| Phase | Action |
|---|---|
| Phase 1 | Scaffold this bundle (current) |
| Phase 4 | Wire ajv + Zod derivation in `lib/security/` and `lib/model-router/` |
| Phase 5 | Validate `mock-data/` fixtures + register demo contracts |
| Phase 6 | Mirror OKF schemas in Supabase schema |
| Phase 7 | CI gate green — okf_validate.py passing on all PRs |

## OKF ↔ Code Synergy Map

```
okf-bundle/schemas/entity.schema.json
  → lib/security/schemas.ts        (Zod = executable form of entity schema)
  → lib/skill-engine/index.ts      (SkillSpec = OKF "skill" entity)
  → lib/model-router/index.ts      (ModelEntry = OKF "agent" entity)

okf-bundle/schemas/inference.schema.json
  → lib/model-router/invoke.ts     (request/response validation)
  → lib/model-router/parity.ts     (Parity Guard schema enforcement)
  → telemetry stream                (M1 — per-inference metrics)
  → Demo 3                          (LLM-as-Judge sandbox)

okf-bundle/schemas/audit.schema.json
  → lib/security/guard.ts          (refusal events → OKF audit log)
  → Screen 4                        (Zero-Trust Log Terminal reads audit stream)
  → lib/memory/                     (M3 — provenance-stamped memory entries)
```
