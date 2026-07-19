/**
 * Home page (marketing shell)
 * Route: /
 * Hero headline only. Full redesign in Ticket 003.
 * Dead chrome (metric widgets, status badges) removed per Ticket 002 and
 * relocated to (console)/demos/telemetry.
 */

import { heroHeadline } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 md:p-8 min-h-[70vh]">
      <div className="relative z-10 w-full max-w-3xl text-center px-4">
        <h1 className="font-display-lg text-[28px] md:text-display-lg text-white leading-tight tracking-tight">
          {heroHeadline}
        </h1>
      </div>
    </div>
  );
}
