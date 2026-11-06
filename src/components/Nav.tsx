"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export const PAGES = [
  { href: "/", label: "Overview" },
  { href: "/company", label: "Company" },
  { href: "/operating", label: "Underwriting" },
  { href: "/capital", label: "Capital Structure" },
  { href: "/returns", label: "Returns" },
  { href: "/pricing", label: "Pricing Lab" },
  { href: "/diligence", label: "Diligence" },
  { href: "/evidence", label: "Evidence" },
  { href: "/documents", label: "Documents" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 28, restDelta: 0.001 });

  useEffect(() => {
    // one passive listener, state flips only when crossing the threshold
    const on = () => setSolid(window.scrollY > 32);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const landing = path === "/";
  const surface = landing && !solid ? "bg-ink-950 border-transparent" : "bg-ink-950/92 backdrop-blur-md border-white/10";
  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-300 ${surface} dark-surface`}>
      <nav aria-label="Primary" className="mx-auto max-w-[88rem] px-4 sm:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="group flex items-baseline gap-2 no-underline hover:no-underline" aria-label="Seacoast Junior Capital Intelligence, home">
            <span className="font-serif text-lg text-[#f4f1ea] sm:text-xl">Seacoast Junior Capital</span>
            <span className="eyebrow hidden !text-champagne sm:inline">Intelligence</span>
          </Link>
          <button type="button" className="border border-white/30 px-3 py-1 font-mono text-xs uppercase tracking-widest text-[#f4f1ea] hover:border-champagne xl:hidden"
            aria-expanded={open} aria-controls="nav-list" onClick={() => setOpen(!open)}>
            {open ? "Close" : "Menu"}
          </button>
          <ul id="nav-list" className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-14 flex-col border-b border-white/10 bg-ink-950 px-4 pb-3 xl:static xl:flex xl:flex-row xl:gap-0.5 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0`}>
            {PAGES.map((p) => {
              const active = p.href === "/" ? path === "/" : path.startsWith(p.href);
              return (
                <li key={p.href} className="relative">
                  <Link href={p.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                    className={`relative block px-3 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] no-underline transition-colors hover:text-white hover:no-underline xl:py-[1.1rem] ${active ? "text-white" : "text-[#b4c0d2]"}`}>
                    {p.label}
                    {active && <motion.span layoutId="nav-active" className="absolute inset-x-3 bottom-0 h-px bg-champagne" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <motion.div aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-teal-500" style={{ scaleX: progress }} />
    </header>
  );
}
