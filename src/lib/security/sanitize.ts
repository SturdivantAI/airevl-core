/**
 * T1.3 — Injection Pattern Detection + PII Redaction Pipeline
 * security_critical: true
 *
 * Sits locally in the data routing gateway. Programmatically scrubs,
 * tokenizes, and strips regulated data fields before any text is processed.
 * Never stores raw payloads — only SHA-256 hashes of sanitized content.
 *
 * NDPA 2023 + CBN Data Localization 2027 compliance layer.
 */

import { createHash } from "crypto";

// ─── Injection pattern catalogue ─────────────────────────────────────────────

const INJECTION_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  // Prompt injection
  { name: "prompt_override",      pattern: /ignore\s+(previous|all|prior)\s+(instructions?|prompts?|rules?)/gi },
  { name: "role_hijack",          pattern: /you\s+are\s+now\s+(?:a|an)\s+\w+/gi },
  { name: "jailbreak_dan",        pattern: /\bDAN\b|do\s+anything\s+now/gi },
  { name: "system_prompt_leak",   pattern: /repeat\s+(your|the)\s+(system|initial)\s+prompt/gi },
  { name: "instruction_inject",   pattern: /<\s*(?:system|instruction|prompt)\s*>/gi },
  { name: "delimiter_inject",     pattern: /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/gi },
  // SQL injection
  { name: "sql_union",            pattern: /\bUNION\s+(?:ALL\s+)?SELECT\b/gi },
  { name: "sql_drop",             pattern: /\bDROP\s+(?:TABLE|DATABASE|SCHEMA)\b/gi },
  { name: "sql_comment",          pattern: /(?:--|#|\/\*)\s*(?:bypass|inject)/gi },
  // Path traversal
  { name: "path_traversal",       pattern: /(?:\.\.\/){2,}|(?:\.\.\\){2,}/g },
  // Script injection
  { name: "script_inject",        pattern: /<script[\s>]/gi },
  { name: "event_handler",        pattern: /\bon(?:load|error|click|mouseover)\s*=/gi },
  // SSRF / internal probing
  { name: "ssrf_localhost",       pattern: /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(?::\d+)?/gi },
  { name: "ssrf_metadata",        pattern: /169\.254\.169\.254/g },
];

// ─── PII patterns (NDPA 2023 / GDPR) ─────────────────────────────────────────

const PII_PATTERNS: Array<{ name: string; pattern: RegExp; replacement: string }> = [
  // Nigerian Bank Verification Number
  { name: "bvn",          pattern: /\b\d{11}\b(?=\s*(?:BVN|bvn))/g,                              replacement: "[BVN_REDACTED]" },
  // NIN
  { name: "nin",          pattern: /\b(?:NIN|nin)\s*[:=]?\s*\d{11}\b/g,                          replacement: "[NIN_REDACTED]" },
  // Nigerian phone numbers
  { name: "ng_phone",     pattern: /\b(?:\+?234|0)(?:7|8|9)(?:0|1)\d{8}\b/g,                     replacement: "[PHONE_REDACTED]" },
  // International phone
  { name: "intl_phone",   pattern: /\b\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}\b/g, replacement: "[PHONE_REDACTED]" },
  // Email addresses
  { name: "email",        pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,     replacement: "[EMAIL_REDACTED]" },
  // Credit/debit card numbers (Luhn-patterned)
  { name: "card_number",  pattern: /\b(?:\d[ -]?){13,16}\b/g,                                     replacement: "[CARD_REDACTED]" },
  // NUBAN account numbers (10 digits)
  { name: "account_no",   pattern: /\b\d{10}\b/g,                                                 replacement: "[ACCOUNT_REDACTED]" },
  // IPv4 addresses
  { name: "ipv4",         pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,                               replacement: "[IP_REDACTED]" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SanitizeResult {
  sanitizedText: string;
  sanitizedPayloadHash: string;
  injectionPatternsFound: string[];
  piiFieldsRemoved: string[];
  outcome: "clean" | "sanitized" | "blocked";
  latencyMs: number;
}

// ─── Core sanitizer ──────────────────────────────────────────────────────────

/**
 * Sanitize a text payload:
 * 1. Detect injection patterns — if any found, mark as blocked
 * 2. Strip PII fields
 * 3. Return sanitized text + SHA-256 hash (never raw content in logs)
 */
export function sanitizePayload(rawText: string): SanitizeResult {
  const start = Date.now();
  const injectionPatternsFound: string[] = [];
  const piiFieldsRemoved: string[] = [];
  let text = rawText;

  // Step 1 — injection detection
  for (const { name, pattern } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      injectionPatternsFound.push(name);
    }
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
  }

  // Step 2 — PII redaction (always, regardless of injection status)
  for (const { name, pattern, replacement } of PII_PATTERNS) {
    const before = text;
    text = text.replace(pattern, replacement);
    if (text !== before) {
      piiFieldsRemoved.push(name);
    }
    pattern.lastIndex = 0;
  }

  // Step 3 — hash the sanitized text (SHA-256, hex)
  const sanitizedPayloadHash = createHash("sha256")
    .update(text, "utf8")
    .digest("hex");

  const outcome: SanitizeResult["outcome"] =
    injectionPatternsFound.length > 0
      ? "blocked"
      : piiFieldsRemoved.length > 0
      ? "sanitized"
      : "clean";

  return {
    sanitizedText: outcome === "blocked" ? "" : text,
    sanitizedPayloadHash,
    injectionPatternsFound,
    piiFieldsRemoved,
    outcome,
    latencyMs: Date.now() - start,
  };
}

/**
 * Quick check — returns true if payload is safe to process.
 * Use before any LLM call.
 */
export function isPayloadSafe(rawText: string): boolean {
  return INJECTION_PATTERNS.every((p) => {
    const safe = !p.pattern.test(rawText);
    p.pattern.lastIndex = 0;
    return safe;
  });
}

/** Hash any string to SHA-256 hex — use instead of storing raw content */
export function hashPayload(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
