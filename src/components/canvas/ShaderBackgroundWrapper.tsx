"use client";

/**
 * Dynamic import wrapper for ShaderBackground — loaded with ssr:false
 * to prevent WebGL from running during server-side rendering.
 */

import dynamic from "next/dynamic";

const ShaderBackground = dynamic(() => import("./ShaderBackground"), {
  ssr: false,
});

export function ShaderBackgroundWrapper() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <ShaderBackground />
    </div>
  );
}
