"use client";

import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { BrandIcon } from "../brands";
import { Card, Reveal, SectionHead } from "../ui";

function Tile({ title, sub, children, delay = 0, className = "" }: { title: string; sub: string; children: ReactNode; delay?: number; className?: string }) {
  return (
    <Reveal delay={delay} className={`h-full ${className}`}>
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="flex min-h-[230px] flex-1 items-center justify-center bg-[#f6f5f2] p-5">{children}</div>
        <div className="p-5">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h3>
          <p className="mt-1 text-[14.5px] leading-[1.5] text-muted">{sub}</p>
        </div>
      </Card>
    </Reveal>
  );
}

function Drafts() {
  return (
    <div className="w-full max-w-[290px] rounded-[16px] bg-white p-3 ring-1 ring-black/[0.06] shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <Portrait look={CAST.cr1.look} size={26} />
        <div className="flex-1 text-[12.5px] font-semibold text-ink">
          Creator <span className="font-medium text-muted">drafted a post</span>
        </div>
        <BrandIcon name="LinkedIn" size={16} />
      </div>
      <div className="mt-2 rounded-[10px] bg-[#f6f5f2] p-2.5 text-[12.5px] leading-snug text-ink-2">
        Online booking is live for every clinic on our pilot. Patients book in under a minute.
      </div>
      <div className="mt-2.5 flex gap-2">
        <span className="flex-1 rounded-full bg-[#f2f0ec] py-1.5 text-center text-[12px] font-semibold text-ink">Edit</span>
        <span className="flex-1 rounded-full bg-ink py-1.5 text-center text-[12px] font-semibold text-white">Approve</span>
      </div>
    </div>
  );
}

function FirstUse() {
  return (
    <div className="w-full max-w-[290px] rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.06] shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-2">
        <Portrait look={CAST.ops.look} size={28} />
        <div className="text-[12px] font-semibold text-[#8a5a10]">First time using this permission</div>
      </div>
      <div className="mt-2 text-[14px] font-semibold leading-snug text-ink">DevOps wants to merge to main.</div>
      <div className="mt-0.5 text-[12.5px] text-muted">PR #51 · staging config. Checks passed.</div>
      <div className="mt-3 flex gap-2">
        <span className="flex-1 rounded-full bg-[#f2f0ec] py-1.5 text-center text-[12px] font-semibold text-ink">Not now</span>
        <span className="flex-1 rounded-full bg-ink py-1.5 text-center text-[12px] font-semibold text-white">Allow</span>
      </div>
    </div>
  );
}

function Locked() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  return (
    <div ref={ref} className="flex w-full max-w-[290px] flex-col gap-2">
      <div className="flex items-center gap-3 rounded-[16px] bg-white p-3 ring-1 ring-black/[0.06] shadow-[var(--shadow-card)]">
        <motion.div
          animate={inView ? { rotate: [0, -12, 10, 0] } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-ink text-white"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 7V5a4 4 0 1 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
          </svg>
        </motion.div>
        <div className="text-[13px] font-semibold leading-snug text-ink">Nobody posts publicly without my approval</div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.1 }}
        className="ml-6 flex items-start gap-2 rounded-[14px] bg-white/70 p-2.5 ring-1 ring-black/[0.05]"
      >
        <Portrait look={CAST.ada.look} size={22} bg="#fbe9de" />
        <div className="text-[12px] leading-snug text-ink-2">That rule is locked. Only you can change it, from your dashboard.</div>
      </motion.div>
    </div>
  );
}

function Meter({ label, value, max, color, delay }: { label: string; value: number; max: number; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const v = useMotionValue(0);
  const text = useTransform(v, (n) => `$${Math.round(n)}`);
  const width = useTransform(v, (n) => `${(n / max) * 100}%`);
  useEffect(() => {
    if (!inView) return;
    const c = animate(v, value, { duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, v, value, delay]);
  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-muted">
          <motion.span className="font-semibold text-ink">{text}</motion.span> of ${max}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <motion.div className="h-full rounded-full" style={{ width, background: color }} />
      </div>
    </div>
  );
}

function Budgets() {
  return (
    <div className="flex w-full max-w-[290px] flex-col gap-3.5 rounded-[16px] bg-white p-4 ring-1 ring-black/[0.06] shadow-[var(--shadow-card)]">
      <Meter label="Development" value={212} max={400} color="#3f9b5f" delay={0.2} />
      <Meter label="Marketing" value={96} max={150} color="#7b6cd9" delay={0.35} />
      <Meter label="This meeting" value={3} max={5} color="#e8743b" delay={0.5} />
    </div>
  );
}

const POLICIES = [
  { k: "Park and switch", d: "Flag it, move to other work." },
  { k: "Best guess", d: "Continue on an assumption, mark it for review." },
  { k: "Stop and wait", d: "Pause until the head or you answer." },
];

function WhenBlocked() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setI((v) => (v + 1) % POLICIES.length), 2400);
    return () => clearInterval(t);
  }, [inView]);
  return (
    <div ref={ref} className="w-full max-w-[300px] rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.06] shadow-[var(--shadow-card)]">
      <div className="text-[12px] font-semibold text-muted">When Development is blocked</div>
      <div className="mt-2 flex flex-col gap-1">
        {POLICIES.map((p, k) => (
          <div key={p.k} className="relative rounded-[10px] px-3 py-2">
            {k === i && <motion.div layoutId="policy" className="absolute inset-0 rounded-[10px] bg-[#f1eefd] ring-1 ring-[#d8d1f7]" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
            <div className="relative flex items-center gap-2">
              <span className={`grid h-4 w-4 place-items-center rounded-full ring-1 ${k === i ? "bg-violet ring-violet" : "ring-black/20"}`}>
                {k === i && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span className="text-[13px] font-semibold text-ink">{p.k}</span>
            </div>
            <AnimatePresence initial={false}>
              {k === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="relative overflow-hidden pl-6 text-[12px] text-muted">
                  {p.d}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function Versions() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const rows = [
    { v: "v14", t: "Tester can merge to main", who: "Ada", bad: true },
    { v: "v13", t: "Marketing budget raised to $150", who: "You" },
    { v: "v12", t: "Editor added to Marketing", who: "Ada" },
  ];
  return (
    <div ref={ref} className="w-full max-w-[300px] rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.06] shadow-[var(--shadow-card)]">
      <div className="flex flex-col">
        {rows.map((r, k) => (
          <div key={r.v} className="flex items-center gap-2.5 border-b border-black/[0.05] py-2 last:border-0">
            <span className="rounded-md bg-[#f6f5f2] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-2">{r.v}</span>
            <motion.span
              animate={inView && r.bad ? { opacity: 0.45 } : { opacity: 1 }}
              transition={{ delay: 1.2 }}
              className={`flex-1 text-[12.5px] leading-snug text-ink ${inView && r.bad ? "line-through decoration-black/40" : ""}`}
              style={{ transition: "text-decoration-color 0.4s 1.2s" }}
            >
              {r.t}
            </motion.span>
            {k === 1 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1.3, type: "spring", stiffness: 400, damping: 22 }}
                className="rounded-full bg-[#eaf6ee] px-2 py-0.5 text-[10.5px] font-bold text-[#24603a]"
              >
                Current
              </motion.span>
            )}
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-ink py-1.5 text-[12px] font-semibold text-white"
      >
        ↺ Rolled back to v13
      </motion.div>
    </div>
  );
}

export function RulesSection() {
  return (
    <section id="rules" className="relative px-5 py-[clamp(96px,14vh,160px)] md:px-8">
      <SectionHead
        title="You set the rules."
        second="Ada makes sure they hold."
        sub="Permissions, approvals and budgets live as plain, versioned settings. Agents start cautious and ask before anything that matters."
      />
      <div className="mx-auto mt-14 grid max-w-[1180px] gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Tile title="Drafts come to you" sub="Nothing goes public by default. Direct publishing is something you switch on, per room.">
          <Drafts />
        </Tile>
        <Tile title="First-use checks" sub="The first time an agent uses a powerful permission, it pauses and asks you." delay={0.06}>
          <FirstUse />
        </Tile>
        <Tile title="Locked settings" sub="Lock the rules that matter. Ada can never change them from a chat." delay={0.12}>
          <Locked />
        </Tile>
        <Tile title="Budgets everywhere" sub="Limits per room and per conversation, so always-on teams never burn unbounded spend.">
          <Budgets />
        </Tile>
        <Tile title="A plan for when they're stuck" sub="Each room has a when-blocked policy, chosen with Ada during setup." delay={0.06}>
          <WhenBlocked />
        </Tile>
        <Tile title="Every change, versioned" sub="Ada reads every change back before applying it. One click rolls back to any version." delay={0.12}>
          <Versions />
        </Tile>
      </div>
    </section>
  );
}
