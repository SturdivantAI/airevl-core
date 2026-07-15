-- AiRevl Phase 6 — Initial Database Schema
-- Mirrors mock-data contracts field-for-field (hot-swap ready)
-- Run against Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════════
-- TELEMETRY (mock-data/telemetry.json)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS telemetry_packets (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  sector TEXT NOT NULL,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('nominal', 'critical', 'warning', 'optimal')),
  node TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telemetry_nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('nominal', 'critical', 'warning')),
  depth_m INTEGER NOT NULL DEFAULT 0
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECURITY LOG (mock-data/security-log.json)
-- OKF audit.schema.json compliant
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_events (
  event_id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'refusal', 'injection_attempt', 'schema_violation',
    'parity_failure', 'circuit_open', 'circuit_close',
    'rate_limit', 'auth_failure'
  )),
  source_route TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('blocked', 'logged', 'flagged', 'passed')),
  model_id TEXT,
  tier TEXT,
  sanitized_payload_hash TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS network_telemetry (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  protocol TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('allowed', 'blocked'))
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRAINING CATALOG (mock-data/training-catalog.json)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS training_sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS training_courses (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES training_sections(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending')) DEFAULT 'active'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ECOSYSTEM GRAPH (mock-data/ecosystem-graph.json)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ecosystem_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('company', 'founder', 'asset', 'technology', 'platform', 'regulation')),
  label TEXT NOT NULL,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  z NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ecosystem_edges (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL REFERENCES ecosystem_nodes(id),
  target TEXT NOT NULL REFERENCES ecosystem_nodes(id),
  relation TEXT NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES (performance)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_telemetry_packets_node ON telemetry_packets(node);
CREATE INDEX IF NOT EXISTS idx_telemetry_packets_metric ON telemetry_packets(metric);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_network_telemetry_timestamp ON network_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_courses_section ON training_courses(section_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS (Row Level Security) — public read, service_role write
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE telemetry_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecosystem_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecosystem_edges ENABLE ROW LEVEL SECURITY;

-- Public can read all tables (anon key)
CREATE POLICY "public_read" ON telemetry_packets FOR SELECT USING (true);
CREATE POLICY "public_read" ON telemetry_nodes FOR SELECT USING (true);
CREATE POLICY "public_read" ON audit_events FOR SELECT USING (true);
CREATE POLICY "public_read" ON network_telemetry FOR SELECT USING (true);
CREATE POLICY "public_read" ON training_sections FOR SELECT USING (true);
CREATE POLICY "public_read" ON training_courses FOR SELECT USING (true);
CREATE POLICY "public_read" ON ecosystem_nodes FOR SELECT USING (true);
CREATE POLICY "public_read" ON ecosystem_edges FOR SELECT USING (true);
