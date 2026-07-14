# OKF Schema Changelog

## 1.0.0 — 2026-07-13

- Initial schema spine scaffolded: `entity.schema.json`, `inference.schema.json`, `audit.schema.json`
- Consumers registered:
  - `entity` → `lib/security/schemas.ts` (Zod derivation), `lib/skill-engine`, `lib/model-router`
  - `inference` → `lib/model-router/invoke.ts`, parity guard, M1 telemetry, Demo 3
  - `audit` → `lib/security/guard.ts`, Screen 4 (Zero-Trust Log Terminal), M3 memory
- CI gate: `scripts/okf_validate.py` — blocks malformed schemas, version drift, mock-data fixture drift
- Breaking changes require: major version bump + entry in this file + passing CI
