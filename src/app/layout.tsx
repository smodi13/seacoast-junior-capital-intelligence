import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Providers from "@/components/Providers";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display" });
const ui = Geist({ subsets: ["latin"], variable: "--font-ui" });
const data = Geist_Mono({ subsets: ["latin"], variable: "--font-data" });

export const metadata: Metadata = {
  title: "Seacoast Junior Capital Intelligence | NFS illustrative screen",
  description: "Independent, illustrative junior-capital underwriting analysis. Not affiliated with Seacoast Capital or National Fleet Services.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable} ${data.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2 focus:text-ink-950">Skip to content</a>
        <div role="note" aria-label="Disclosure" className="dark-surface border-b border-white/10 px-4 py-2 text-center text-[0.7rem] leading-relaxed text-[#c9d3e1] sm:text-xs">
          <strong className="font-mono uppercase tracking-widest text-champagne">Independent illustrative project.</strong>{" "}
          Not affiliated with, endorsed by, or connected to Seacoast Capital or National Fleet Services. NFS has not disclosed financial statements to this project and has not solicited an investment. All financial figures are analyst assumptions.
        </div>
        <Providers>
          <Nav />
          <main id="main">{children}</main>
        </Providers>
        <footer className="dark-surface bg-grid border-t border-white/10">
          <div className="mx-auto max-w-[88rem] px-4 py-12 sm:px-8">
            <p className="font-serif text-2xl text-[#f4f1ea]">Seacoast Junior Capital Intelligence</p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              An independent analyst portfolio project. Research date 6 Nov 2026. The illustrative transaction is not an offer, term sheet, management forecast or actual Seacoast investment. NFS historical financial results are not publicly verified; all projections are analyst assumptions. Gross returns exclude fund expenses, carried interest and investor taxes.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
