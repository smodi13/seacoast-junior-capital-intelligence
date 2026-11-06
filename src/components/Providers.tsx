"use client";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { SandboxProvider } from "@/lib/sandbox";
import SmoothScroll from "./SmoothScroll";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll />
      <SandboxProvider>{children}</SandboxProvider>
    </MotionConfig>
  );
}
