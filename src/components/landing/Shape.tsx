"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { BrandChip } from "../brands";
import { Card, Reveal, SectionHead } from "../ui";

function StepCard({ n, title, children, delay = 0 }: { n: number; title: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 pt-6">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[12px] font-bold text-white">{n}</span>
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h3>
        </div>
        <div className="flex flex-1 flex-col p-4 pt-5">{children}</div>
      </Card>
    </Reveal>
  );
}

function useCycle(active: boolean, n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), ms);
    return () => clearInterval(t);
  }, [active, n, ms]);
  return i;
}

function Describe() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const lines = [
    { from: "you", text: "We need someone who owns testing." },
    { from: "ada", text: "Happy to. What should block a release?" },
    { from: "you", text: "Anything that breaks booking or payments." },
    { from: "ada", text: "Meet your Tester. I've drafted the setup." },
  ];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let k = 0;
    const t = setInterval(() => {
      k++;
      setShown(k);
      if (k >= lines.length + 1) clearInterval(t);
    }, 650);
    return () => clearInterval(t);
  }, [inView, lines.length]);
  return (
    <div ref={ref} className="flex flex-1 flex-col justify-between gap-4 rounded-[18px] bg-[#f6f5f2] p-3.5">
      <div className="flex min-h-[200px] flex-col gap-2">
        {lines.slice(0, shown).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={`max-w-[85%] rounded-[16px] px-3 py-2 text-[13.5px] leading-snug ${
              l.from === "you" ? "self-end rounded-br-[6px] bg-ink text-white" : "self-start rounded-bl-[6px] bg-white text-ink ring-1 ring-black/[0.05]"
            }`}
          >
            {l.text}
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {shown > lines.length && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="flex items-center gap-3 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]"
          >
            <Portrait look={CAST.qa.look} size={36} />
            <div className="flex-1">
              <div className="text-[13.5px] font-semibold text-ink">Tester</div>
              <div className="text-[12px] text-muted">Development · reports to PM</div>
            </div>
            <span className="rounded-full bg-[#eaf6ee] px-2 py-0.5 text-[11px] font-semibold text-[#24603a]">Hired</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-black/[0.05] py-2.5 last:border-0">
      <span className="pt-0.5 text-[12.5px] font-medium text-muted">{label}</span>
      <div className="flex flex-wrap justify-end gap-1.5 text-right text-[12.5px] font-semibold text-ink">{children}</div>
    </div>
  );
}

function Shape() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });
  const rt = useCycle(inView, 2, 2600);
  return (
    <div ref={ref} className="flex flex-1 flex-col rounded-[18px] bg-[#f6f5f2] p-3.5">
      <div className="flex items-center gap-3 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]">
        <Portrait look={CAST.qa.look} size={36} />
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-ink">Tester</div>
          <div className="text-[12px] text-muted">Development</div>
        </div>
      </div>
      <div className="mt-2 rounded-[14px] bg-white px-3 ring-1 ring-black/[0.06]">
        <Row label="Runtime">
          <div className="relative flex rounded-full bg-[#f2f0ec] p-0.5 text-[11.5px]">
            {["Claude Code", "Codex"].map((r, i) => (
              <span key={r} className="relative z-10 px-2 py-0.5" style={{ color: rt === i ? "#0a0a0a" : "#8d8b86" }}>
                {rt === i && (
                  <motion.span layoutId="rt-pill" className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                {r}
              </span>
            ))}
          </div>
        </Row>
        <Row label="Tools">
          <BrandChip name="GitHub" size="sm" />
          <BrandChip name="Linear" size="sm" />
          <BrandChip name="Slack" size="sm" />
        </Row>
        <Row label="Done means">
          <span className="max-w-[170px] font-medium text-ink-2">Every PR has passing tests and a QA note</span>
        </Row>
        <Row label="When blocked">Park and switch</Row>
        <Row label="Budget">$40 a week</Row>
        <Row label="Memory">
          <span className="text-muted">12 lessons</span>
        </Row>
      </div>
    </div>
  );
}

const CHECKS = [
  { text: "The Tester can open and comment on pull requests", ok: true },
  { text: "The Tester can move tickets in Linear", ok: true },
  { text: "The Tester can't merge to main", ok: false },
  { text: "The Tester can spend up to $40 a week", ok: true },
];

function Confirm() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let k = 0;
    const t = setInterval(() => {
      k++;
      setN(k);
      if (k > CHECKS.length + 1) clearInterval(t);
    }, 520);
    return () => clearInterval(t);
  }, [inView]);
  const applied = n > CHECKS.length;
  return (
    <div ref={ref} className="flex flex-1 flex-col rounded-[18px] bg-[#f6f5f2] p-3.5">
      <div className="rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.06]">
        <div className="flex items-center gap-2">
          <Portrait look={CAST.ada.look} size={24} bg="#fbe9de" />
          <div className="text-[12.5px] font-semibold text-ink">Ada read this back before applying</div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {CHECKS.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <motion.span
                animate={i < n ? { scale: [0.6, 1.15, 1], opacity: 1 } : { scale: 1, opacity: 0.35 }}
                transition={{ duration: 0.35 }}
                className={`mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${
                  i < n ? (c.ok ? "bg-ok" : "bg-ink") : "bg-black/20"
                }`}
              >
                {c.ok ? "✓" : "✕"}
              </motion.span>
              <span className={`text-[13px] leading-snug transition-colors duration-300 ${i < n ? "text-ink" : "text-faint"}`}>{c.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
          <span className="rounded-md bg-white px-1.5 py-0.5 ring-1 ring-black/[0.06]">v3</span>
          <span>→</span>
          <motion.span animate={{ opacity: applied ? 1 : 0.4 }} className="rounded-md bg-white px-1.5 py-0.5 text-ink ring-1 ring-black/[0.06]">
            v4
          </motion.span>
        </div>
        <motion.div
          animate={applied ? { backgroundColor: "#3f9b5f" } : { backgroundColor: "#0a0a0a" }}
          className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-white"
        >
          {applied ? "✓ Applied" : "Confirm changes"}
        </motion.div>
      </div>
      <div className="pt-2 text-right text-[11.5px] text-muted">One click rolls back to any earlier version.</div>
    </div>
  );
}

export function ShapeSection() {
  return (
    <section id="teams" className="relative px-5 py-[clamp(96px,14vh,160px)] md:px-8">
      <SectionHead
        title="Every agent is yours to shape."
        second="Hire in a sentence. Change anything."
        sub="Ada handles setup, but nothing is hidden. Role, runtime, tools, permissions, budget and what done means are all plain settings you can see and edit."
      />
      <div className="mx-auto mt-14 grid max-w-[1180px] gap-5 md:grid-cols-3">
        <StepCard n={1} title="Describe who you need">
          <Describe />
        </StepCard>
        <StepCard n={2} title="Shape every detail" delay={0.08}>
          <Shape />
        </StepCard>
        <StepCard n={3} title="Confirm every change" delay={0.16}>
          <Confirm />
        </StepCard>
      </div>
    </section>
  );
}
