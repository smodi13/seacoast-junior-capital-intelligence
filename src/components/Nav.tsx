"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export const PAGES = [
  { href: "/", label: "Executive Screen" },
  { href: "/company", label: "Company Profile" },
  { href: "/capital", label: "Capital Structure" },
  { href: "/operating", label: "Operating Underwriting" },
  { href: "/returns", label: "Investor Returns" },
  { href: "/pricing", label: "Pricing Lab" },
  { href: "/diligence", label: "Risk & Diligence" },
  { href: "/evidence", label: "Evidence Library" },
  { href: "/documents", label: "Documents" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <nav aria-label="Primary" className="bg-navy-900 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-serif text-base font-semibold text-white no-underline sm:text-lg">
          Junior Capital Intelligence <span className="font-sans text-xs font-normal text-teal-50/80">| NFS illustrative screen</span>
        </Link>
        <button type="button" className="rounded-sm border border-white/40 px-3 py-1 text-sm lg:hidden" aria-expanded={open} aria-controls="nav-list" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <ul id="nav-list" className={`${open ? "block" : "hidden"} mx-auto max-w-7xl border-t border-white/15 px-2 pb-2 lg:flex lg:flex-wrap lg:border-t lg:px-4 lg:pb-0`}>
        {PAGES.map((p) => {
          const active = p.href === "/" ? path === "/" : path.startsWith(p.href);
          return (
            <li key={p.href}>
              <Link
                href={p.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                className={`block px-3 py-2 text-sm no-underline hover:bg-white/10 ${active ? "border-b-2 border-teal-500 font-semibold text-white" : "text-white/80"}`}
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
