import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "RoadSafe",
  description: "Not just the fastest route. The safest one.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-[100dvh] flex-col overflow-hidden bg-surface-2 font-sans text-[16px] font-normal">
        <SiteHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
