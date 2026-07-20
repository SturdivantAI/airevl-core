import type { Metadata } from "next";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/contact"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
