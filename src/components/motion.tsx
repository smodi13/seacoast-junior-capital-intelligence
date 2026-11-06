"use client";
import { animate, motion, useInView, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fade-and-rise on first entering the viewport. Opacity/transform only. */
export function Reveal({ children, delay = 0, y = 22, className = "", as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" }) {
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }} transition={{ duration: 0.7, delay, ease: EASE }}>
      {children}
    </Tag>
  );
}

/** Hairline that draws left→right. */
export function Rule({ className = "", delay = 0, onMount = false }: { className?: string; delay?: number; onMount?: boolean }) {
  const common = { style: { transformOrigin: "left" }, className: `h-px w-full bg-current opacity-30 ${className}`, initial: { scaleX: 0 }, transition: { duration: 1.1, delay, ease: EASE } };
  return onMount
    ? <motion.div {...common} animate={{ scaleX: 1 }} aria-hidden="true" />
    : <motion.div {...common} whileInView={{ scaleX: 1 }} viewport={{ once: true }} aria-hidden="true" />;
}

const lineV: Variants = { hidden: { y: "108%" }, show: (i: number) => ({ y: 0, transition: { duration: 0.9, delay: 0.25 + i * 0.12, ease: EASE } }) };

/** Staggered line-mask headline. Each entry is one visual line. Screen readers get the text once via the heading itself. */
export function Headline({ lines, className = "", as: Tag = "h2", onMount = false }: { lines: ReactNode[]; className?: string; as?: "h1" | "h2"; onMount?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const on = onMount || inView;
  return (
    <Tag className={`display ${className}`}>
      <span ref={ref} className="block">
        {lines.map((l, i) => (
          <span key={i} className="block overflow-hidden pb-[0.08em]">
            <motion.span className="block" custom={i} variants={lineV} initial="hidden" animate={on ? "show" : "hidden"}>{l}</motion.span>
          </span>
        ))}
      </span>
    </Tag>
  );
}

/** Large index numeral + drawn rule + heading, used to open every narrative section. */
export function SectionHead({ no, label, title, children }: { no: string; label: string; title: ReactNode[]; children?: ReactNode }) {
  return (
    <header className="mb-10 sm:mb-14">
      <div className="flex items-end gap-4">
        <Reveal y={14}><span className="num text-5xl font-light leading-none text-accent sm:text-7xl" aria-hidden="true">{no}</span></Reveal>
        <Reveal y={10} delay={0.1}><span className="eyebrow pb-1.5 sm:pb-2.5"><span className="sr-only">Section {no}: </span>{label}</span></Reveal>
      </div>
      <Rule className="mt-4 text-ink" />
      <Headline className="mt-6 max-w-4xl text-4xl sm:text-6xl" lines={title} />
      {children && <Reveal delay={0.25} className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{children}</Reveal>}
    </header>
  );
}

/**
 * Shows the exact formatted value. On later value changes (e.g. scenario switch) it tweens from the
 * previous actual value to the new actual value. Nothing is simulated; endpoints are always engine values.
 */
export function AnimatedNumber({ value, format, className = "" }: { value: number; format: (v: number) => string; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (reduce || from === value || !el.current) return;
    const node = el.current;
    const c = animate(from, value, { duration: 0.55, ease: EASE, onUpdate: (v) => { node.textContent = format(v); }, onComplete: () => { node.textContent = format(value); } });
    return () => c.stop();
  }, [value, format, reduce]);
  return <span ref={el} className={className}>{format(value)}</span>;
}
