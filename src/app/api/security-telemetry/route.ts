/**
 * GET /api/security-telemetry
 * Returns network telemetry rows for Screen 4 (client-side fetch).
 * Falls back to mock fixture if Supabase is unavailable — never 500s.
 */

import { NextResponse } from "next/server";
import { withFallback } from "@/lib/data/withFallback";
import securityFixture from "../../../../mock-data/security-log.json";

export async function GET() {
  const { data, isFallback } = await withFallback(
    async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("network_telemetry")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    securityFixture.telemetry_stream,
    "/api/security-telemetry"
  );

  return NextResponse.json({ rows: data, isFallback });
}
