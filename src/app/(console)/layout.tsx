/**
 * Console Shell Layout
 * SideNavBar + TopAppBar + persistent demo banner.
 * Reserved for interactive demo routes.
 */

import { SideNavBar } from "@/components/layout/SideNavBar";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { ConsoleDemoBanner } from "@/components/layout/ConsoleDemoBanner";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 flex h-full w-full overflow-hidden">
      {/* SideNavBar — fixed left, hidden on mobile */}
      <SideNavBar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64 h-full overflow-hidden">
        <ConsoleDemoBanner />
        <TopAppBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
