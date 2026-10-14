"use client";

import { useMotionValueEvent, useScroll, type MotionValue } from "motion/react";
import { useState, type RefObject } from "react";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Progress through a tall pinned section (0 at top-pin, 1 at release). */
export function usePinProgress(ref: RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return scrollYProgress;
}

/** Turns a progress value into a discrete step index between `from` and `to`. */
export function useStep(progress: MotionValue<number>, steps: number, from = 0, to = 1) {
  const calc = (v: number) => Math.min(steps - 1, Math.max(0, Math.floor(range(v, from, to) * steps)));
  const [step, setStep] = useState(() => calc(progress.get()));
  useMotionValueEvent(progress, "change", (v) => {
    const s = calc(v);
    setStep((prev) => (prev === s ? prev : s));
  });
  return step;
}
