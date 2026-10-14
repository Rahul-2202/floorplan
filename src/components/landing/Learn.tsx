"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { Card, Reveal, SectionHead } from "../ui";

const WEEKS = [23, 19, 14, 11, 8, 6, 5, 4];

const STAGES = [
  {
    week: "Week 1",
    mode: "Asks",
    who: "fe",
    text: "Should the booking page use the clinic's brand colours or ours?",
  },
  {
    week: "Week 4",
    mode: "Suggests",
    who: "pm",
    text: "Three clinics asked for Saturday slots. Want me to add it to next sprint?",
    actions: true,
  },
  {
    week: "Week 8",
    mode: "Acts",
    who: "be",
    text: "Reminder emails were failing for one clinic, so I fixed the template and resent them.",
  },
];

export function LearnSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  return (
    <section className="relative px-5 py-[clamp(96px,14vh,160px)] md:px-8">
      <SectionHead
        title="Cautious on day one."
        second="Quiet by week eight."
        sub="Agents start out asking about everything. Every answer and correction you give goes into memory, so they ask less, suggest more and act on what you always approve."
      />
      <div className="mx-auto mt-14 grid max-w-[1180px] gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <Card className="flex h-full flex-col p-6">
            <div className="text-[13px] font-semibold text-muted">Questions to you, per week</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[44px] font-semibold tracking-[-0.03em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                23 → 4
              </span>
              <span className="text-[13px] text-muted">first 8 weeks</span>
            </div>
            <div ref={ref} className="mt-auto flex h-[180px] items-end gap-2.5 pt-6">
              {WEEKS.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={inView ? { height: `${(v / 23) * 150}px` } : {}}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full rounded-[8px]"
                    style={{ background: i === WEEKS.length - 1 ? "#e8743b" : "rgba(10,10,10,0.1)" }}
                  />
                  <span className="text-[11px] font-medium text-faint">W{i + 1}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
        <div className="flex flex-col gap-3">
          {STAGES.map((s, i) => (
            <Reveal key={s.week} delay={0.08 * i}>
              <Card className="flex gap-3.5 p-4">
                <Portrait look={CAST[s.who].look} size={38} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">{CAST[s.who].name}</span>
                    <span
                      className={`rounded-full px-2 py-[1px] text-[11px] font-bold ${
                        i === 0 ? "bg-[#f0efed] text-muted" : i === 1 ? "bg-[#f1eefd] text-[#4a3fa8]" : "bg-[#eaf6ee] text-[#24603a]"
                      }`}
                    >
                      {s.mode}
                    </span>
                    <span className="ml-auto text-[12px] text-faint">{s.week}</span>
                  </div>
                  <p className="mt-1 text-[14.5px] leading-[1.45] text-ink-2">{s.text}</p>
                  {s.actions && (
                    <div className="mt-2.5 flex gap-2">
                      <span className="rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-white">Yes, add it</span>
                      <span className="rounded-full bg-[#f2f0ec] px-3 py-1 text-[12px] font-semibold text-ink">Not now</span>
                    </div>
                  )}
                  {i === 2 && <div className="mt-2 text-[12px] font-semibold text-ink underline decoration-black/20 underline-offset-4">See what changed</div>}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
