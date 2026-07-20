/**
 * AnalyticsGate — consent-gated analytics seam.
 * Currently renders nothing (config/analytics.json enabled: false).
 * Wiring a real provider is a one-line flip after counsel sign-off on consent mechanics.
 * RULE: No analytics network request may occur while disabled.
 */

import analyticsConfig from "../../../config/analytics.json";

export function AnalyticsGate() {
  if (!analyticsConfig.enabled) {
    return null;
  }

  // Future: render the analytics provider component here after counsel sign-off.
  return null;
}
