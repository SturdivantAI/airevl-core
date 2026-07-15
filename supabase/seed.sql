-- AiRevl Phase 6 — Seed Data
-- Mirrors mock-data JSON contracts exactly

-- ═══════════════════════════════════════════════════════════════════════════════
-- TELEMETRY NODES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO telemetry_nodes (id, name, lat, lng, status, depth_m) VALUES
  ('NUC-LAG-01', 'Node Alpha', 6.4541, 3.3947, 'nominal', 1200),
  ('NUC-LAG-02', 'Node Beta', 6.4550, 3.3960, 'critical', 1200),
  ('NUC-LAG-03', 'Node Gamma', 6.4535, 3.3940, 'nominal', 800),
  ('NUC-LAG-04', 'Node Delta', 6.4560, 3.3955, 'nominal', 600)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TELEMETRY PACKETS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO telemetry_packets (id, timestamp, sector, metric, value, unit, status, node) VALUES
  ('pkt-001', '2026-07-13T14:02:45.992Z', 'Alpha', 'power_consumption', 482, 'MW', 'nominal', 'NUC-LAG-01'),
  ('pkt-002', '2026-07-13T14:02:46.105Z', 'Core Reactor', 'power_consumption', 998, 'MW', 'critical', 'NUC-LAG-02'),
  ('pkt-003', '2026-07-13T14:02:47.310Z', 'Cooling Sys', 'power_consumption', 124, 'MW', 'nominal', 'NUC-LAG-03'),
  ('pkt-004', '2026-07-13T14:02:48.552Z', 'Grid Delta', 'power_consumption', 305, 'MW', 'nominal', 'NUC-LAG-04'),
  ('pkt-005', '2026-07-13T14:03:01.112Z', 'Alpha', 'oxygen_saturation', 98, '%', 'optimal', 'NUC-LAG-01'),
  ('pkt-006', '2026-07-13T14:03:02.445Z', 'Alpha', 'temperature', 42.3, 'C', 'nominal', 'NUC-LAG-01'),
  ('pkt-007', '2026-07-13T14:03:05.887Z', 'Core Reactor', 'temperature', 89.7, 'C', 'warning', 'NUC-LAG-02'),
  ('pkt-008', '2026-07-13T14:03:08.221Z', 'Grid Delta', 'latency', 12, 'ms', 'nominal', 'NUC-LAG-04')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT EVENTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO audit_events (event_id, timestamp, event_type, source_route, outcome, model_id, tier, sanitized_payload_hash, notes) VALUES
  ('evt-001', '2026-07-13T08:14:02.102Z', 'circuit_close', '/api/agent', 'passed', 'claude-fable-5', 'primary', NULL, 'System startup — all circuits nominal'),
  ('evt-002', '2026-07-13T08:14:02.145Z', 'injection_attempt', '/api/agent', 'blocked', NULL, NULL, 'a9f2...4b8c', 'prompt_override pattern detected'),
  ('evt-003', '2026-07-13T08:15:10.334Z', 'refusal', '/api/agent', 'blocked', 'claude-fable-5', 'primary', NULL, 'Safety refusal on adversarial input'),
  ('evt-004', '2026-07-13T08:16:22.771Z', 'schema_violation', '/api/agent/sanitize', 'blocked', NULL, NULL, NULL, 'Missing required field: request_id'),
  ('evt-005', '2026-07-13T08:18:45.009Z', 'rate_limit', '/api/agent', 'flagged', 'claude-sonnet-4-6', 'failover-2', NULL, '429 from provider — breaker incremented'),
  ('evt-006', '2026-07-13T08:19:02.113Z', 'circuit_open', '/api/agent', 'flagged', 'claude-sonnet-4-6', 'failover-2', NULL, 'Error rate 45% exceeded 40% threshold'),
  ('evt-007', '2026-07-13T08:20:31.887Z', 'parity_failure', '/api/agent', 'flagged', 'grok-4.3', 'diversity-1', NULL, 'Parity score 0.62 below threshold 0.80')
ON CONFLICT (event_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NETWORK TELEMETRY
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO network_telemetry (timestamp, source, destination, protocol, status) VALUES
  ('2026-07-13T14:02:45.992Z', '10.4.2.19', '192.168.1.5', 'TCP/IP', 'allowed'),
  ('2026-07-13T14:02:46.105Z', '172.16.0.4', '10.0.0.1', 'UDP', 'blocked'),
  ('2026-07-13T14:02:47.221Z', '10.4.2.19', '192.168.1.10', 'HTTPS', 'allowed'),
  ('2026-07-13T14:02:48.445Z', '203.0.113.5', '10.0.0.1', 'SSH', 'blocked'),
  ('2026-07-13T14:02:49.887Z', '10.4.2.20', '192.168.1.5', 'TCP/IP', 'allowed')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRAINING SECTIONS + COURSES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO training_sections (id, title) VALUES
  ('synthetic-reasoning', 'Synthetic Reasoning'),
  ('migration-engineering', 'CBN/NDPA Migration Engineering')
ON CONFLICT (id) DO NOTHING;

INSERT INTO training_courses (id, section_id, title, description, icon, difficulty, progress, status) VALUES
  ('crt-001', 'synthetic-reasoning', 'Cognitive Recursion Tactics', 'Deep-dive into multi-layered deductive processes for autonomous threat resolution.', 'psychology', 'Advanced', 64, 'active'),
  ('abm-001', 'synthetic-reasoning', 'Algorithmic Bias Mitigation', 'Identify and neutralize systemic distortions within primary decision matrices.', 'schema', 'Intermediate', 12, 'active'),
  ('nnt-001', 'synthetic-reasoning', 'Neural Network Topologies', 'Architecting resilient and adaptive data flow structures for high-latency environments.', 'hub', 'Expert', 0, 'active'),
  ('cam-001', 'migration-engineering', 'Corporate AI Automation', 'Architecting atomic migrations and zero-trust edge topographies under CBN and NDPA frameworks.', 'precision_manufacturing', 'Advanced', 0, 'active'),
  ('ucert-001', 'migration-engineering', 'University Certifications', 'Accredited certification track for migration engineering professionals.', 'school', 'Intermediate', 0, 'active'),
  ('fmp-001', 'migration-engineering', 'FM-in-the-Pocket Operations', 'Running local NUC fleet telemetry and edge orchestration.', 'developer_board', 'Expert', 0, 'pending'),
  ('dfi-001', 'migration-engineering', 'Deepfake Infrastructure Guard', 'Detecting and neutralizing synthetic media in financial transaction streams.', 'shield_with_house', 'Expert', 0, 'pending')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ECOSYSTEM GRAPH
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO ecosystem_nodes (id, type, label, x, y, z) VALUES
  ('airevl', 'company', 'AiRevl', 0, 0, 0),
  ('edidiong', 'founder', 'Edidiong Umoh', 3, 1, 0),
  ('nuc-fleet', 'asset', 'NUC 16 Pro Fleet', -3, 2, 1),
  ('gemma', 'technology', 'Gemma-2-2B', -2, -2, 0),
  ('qwen', 'technology', 'Qwen2.5-0.5B', 2, -2, 1),
  ('upstash', 'technology', 'Upstash Redis', 0, -3, -1),
  ('supabase', 'technology', 'Supabase PostgreSQL', -1, -3, 1),
  ('vercel', 'platform', 'Vercel Edge', 3, -1, -1),
  ('cbn', 'regulation', 'CBN Data Localization', -3, 0, -2),
  ('ndpa', 'regulation', 'NDPA 2023', -2, 1, -2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ecosystem_edges (source, target, relation) VALUES
  ('airevl', 'edidiong', 'founded_by'),
  ('airevl', 'nuc-fleet', 'operates'),
  ('airevl', 'gemma', 'uses'),
  ('airevl', 'qwen', 'uses'),
  ('airevl', 'upstash', 'integrates'),
  ('airevl', 'supabase', 'integrates'),
  ('airevl', 'vercel', 'deployed_on'),
  ('airevl', 'cbn', 'complies_with'),
  ('airevl', 'ndpa', 'complies_with'),
  ('nuc-fleet', 'gemma', 'runs'),
  ('nuc-fleet', 'qwen', 'runs'),
  ('vercel', 'upstash', 'connects_to');
