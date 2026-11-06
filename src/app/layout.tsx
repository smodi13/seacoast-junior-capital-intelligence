import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { SandboxProvider } from "@/lib/sandbox";

export const metadata: Metadata = {
  title: "Seacoast Junior Capital Intelligence | NFS illustrative screen",
  description: "Independent, illustrative junior-capital underwriting analysis. Not affiliated with Seacoast Capital or National Fleet Services.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">Skip to content</a>
        <div role="note" aria-label="Disclosure" className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-navy-950 sm:text-sm">
          <strong>INDEPENDENT ILLUSTRATIVE PROJECT.</strong> Not affiliated with, endorsed by, or connected to Seacoast Capital or National Fleet Services. NFS has not disclosed financial statements to this project and has not solicited an investment. All financial figures are analyst assumptions.
        </div>
        <SandboxProvider>
          <Nav />
          <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:py-8">{children}</main>
        </SandboxProvider>
        <footer className="mx-auto max-w-7xl border-t border-rule px-4 py-6 text-xs text-muted">
          Independent analyst portfolio project. Research date 6 Nov 2026. Illustrative transaction only: not an offer, term sheet, management forecast or actual Seacoast investment. Gross returns exclude fund expenses, carried interest and investor taxes.
        </footer>
      </body>
    </html>
  );
}
