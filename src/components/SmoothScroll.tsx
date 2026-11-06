"use client";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Lenis smooth scrolling: desktop pointers only, never for reduced-motion or touch users.
 * One instance, one RAF loop (autoRaf), destroyed on unmount. Anchor links are handled by Lenis.
 * Nested scrollers (tables, selects) opt out with data-lenis-prevent.
 */
export default function SmoothScroll() {
  const path = usePathname();
  const lenis = useRef<Lenis | null>(null);
  useEffect(() => {
    const ok = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)").matches;
    if (!ok) return;
    const l = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: -72 }, allowNestedScroll: true });
    lenis.current = l;
    return () => { l.destroy(); lenis.current = null; };
  }, []);
  useEffect(() => { lenis.current?.scrollTo(0, { immediate: true }); }, [path]);
  return null;
}
