/**
 * GET /api/security-telemetry
 * Returns network telemetry rows for Screen 4 (client-side fetch).
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("network_telemetry")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ rows: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data });
}
