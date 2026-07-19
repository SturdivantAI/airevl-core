"use client";

/**
 * Dynamic import wrapper for BackgroundCanvas — loaded with ssr:false so the
 * Canvas 2D animation only runs in the browser. Mounted once in app/layout.tsx;
 * every route inherits the living background.
 */

import dynamic from "next/dynamic";

const BackgroundCanvas = dynamic(() => import("./BackgroundCanvas"), {
  ssr: false,
});

export function BackgroundCanvasWrapper() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <BackgroundCanvas />
    </div>
  );
}
