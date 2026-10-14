"use client";

import { AnimatePresence, motion, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
import { usePinProgress, useStep } from "@/lib/scroll";

export function Pinned({
  id,
  steps,
  per = 70,
  lead = 30,
  children,
}: {
  id?: string;
  steps: number;
  /** Scroll distance per step, in vh. */
  per?: number;
  /** Extra scroll before the first step advances, in vh. */
  lead?: number;
  children: (step: number, progress: MotionValue<number>) => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const p = usePinProgress(ref);
  const total = steps * per + lead;
  const step = useStep(p, steps, lead / total, 0.995);
  return (
    <section ref={ref} id={id} className="relative" style={{ height: `calc(100vh + ${total}vh)` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">{children(step, p)}</div>
    </section>
  );
}

/** Heading row used at the top of pinned stages. */
export function StageHead({ title, second, captions, step }: { title: ReactNode; second: ReactNode; captions: string[]; step: number }) {
  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-5 pt-[88px] md:flex-row md:items-end md:justify-between md:px-8 md:pt-[96px]">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-section text-[clamp(28px,3.4vw,44px)] text-ink"
      >
        {title}
        <br />
        <span className="text-second">{second}</span>
      </motion.h2>
      <div className="flex min-h-[44px] items-center gap-4 md:max-w-[440px]">
        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          {captions.map((_, i) => (
            <motion.span
              key={i}
              animate={{ width: i === step ? 18 : 6, backgroundColor: i <= step ? "#0a0a0a" : "rgba(10,10,10,0.15)" }}
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
        <div className="relative min-h-[44px] flex-1">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-[15px] leading-[1.45] text-muted"
            >
              {captions[step]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function Frame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[28px] shadow-[0_2px_4px_rgba(10,10,10,0.04),0_40px_100px_-30px_rgba(10,10,10,0.3)] ring-1 ring-black/[0.06] ${className}`}
    >
      {children}
    </div>
  );
}
