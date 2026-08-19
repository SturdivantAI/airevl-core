"use client";

/**
 * Training section layout — wraps all /training routes in the AcademyProvider
 * so auth + progress state is shared across catalog, lessons, and certificate.
 */

import { AcademyProvider } from "@/lib/academy/useAcademy";

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return <AcademyProvider>{children}</AcademyProvider>;
}
