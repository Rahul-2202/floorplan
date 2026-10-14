"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { Pinned } from "./Pinned";

const STEPS = [
  {
    title: "Layered like a company",
    text: "Company, room, agent and conversation. Every layer has an owner, so memory stays clean as it grows.",
  },
  {
    title: "Distill up",
    text: "Conversations become lessons, lessons become room knowledge, the important parts reach the company. Each step is approved by that layer's owner and links to its source.",
  },
  {
    title: "Derive down",
    text: "Heads turn company memory into what their room needs. When the source changes, every copy is flagged for a refresh.",
  },
  {
    title: "Superseded, never deleted",
    text: "Outdated facts are marked superseded and linked to what replaced them. Permanent, but never in the way.",
  },
  {
    title: "Exactly what the task needs",
    text: "Agents read a small index first, then pull only the pages that matter. Nothing missing, nothing extra.",
  },
  {
    title: "Works with every runtime",
    text: "Before each session, FloorPlan writes the agent's CLAUDE.md or AGENTS.md from its role card, lessons and index.",
  },
];

type Chip = { t: string; tone?: "new" | "derived" | "old" | "plain"; at: number; until?: number; sub?: string };

const LAYERS: { name: string; owner: string; ownerLabel: string; chips: Chip[] }[] = [
  {
    name: "Company",
    owner: "ada",
    ownerLabel: "Ada",
    chips: [
      { t: "Charter", at: 0 },
      { t: "CEO preferences", at: 0 },
      { t: "Decision: SMS in v1.1", tone: "new", at: 1, sub: "from minutes" },
      { t: "Launch: Fri, Mar 10", tone: "plain", at: 2 },
    ],
  },
  {
    name: "Development",
    owner: "pm",
    ownerLabel: "PM",
    chips: [
      { t: "Room charter", at: 0 },
      { t: "Launch: Mar 3", tone: "plain", at: 0, until: 3 },
      { t: "Launch: Mar 3", tone: "old", at: 3, sub: "superseded" },
      { t: "Decision log +1", tone: "new", at: 1 },
      { t: "Freeze API Thursday", tone: "derived", at: 2, sub: "from company" },
    ],
  },
  {
    name: "Backend",
    owner: "be",
    ownerLabel: "Backend · PM reviews",
    chips: [
      { t: "Role card", at: 0 },
      { t: "Lesson: email reminders first", tone: "new", at: 1, sub: "high confidence" },
      { t: "Launch checklist", tone: "derived", at: 2 },
    ],
  },
  {
    name: "Conversations",
    owner: "pm",
    ownerLabel: "Summaries",
    chips: [
      { t: "Transcript", at: 0, sub: "archived" },
      { t: "Minutes: launch scope", tone: "new", at: 1 },
    ],
  },
];

const CHIP_TONE: Record<NonNullable<Chip["tone"]>, string> = {
  plain: "bg-white text-ink ring-black/[0.07]",
  new: "bg-[#fff4ec] text-[#a24d1f] ring-[#f3cfb6]",
  derived: "bg-[#f1eefd] text-[#4a3fa8] ring-[#d8d1f7]",
  old: "bg-white/60 text-faint ring-black/[0.05] line-through",
};

const ROW = 96;
const GAP = 12;

function Stack({ step }: { step: number }) {
  return (
    <div className="relative flex flex-col" style={{ gap: GAP }}>
      {LAYERS.map((l, i) => (
        <motion.div
          key={l.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center gap-4 rounded-[18px] bg-white/85 px-4 ring-1 ring-black/[0.05] shadow-[0_8px_24px_-14px_rgba(60,40,90,0.35)] backdrop-blur"
          style={{ height: ROW, marginLeft: i * 14, marginRight: (3 - i) * 14 }}
        >
          <div className="w-[118px] shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">{i === 0 ? "Company" : i === 1 ? "Room" : i === 2 ? "Agent" : "Conversation"}</div>
            <div className="mt-0.5 text-[14px] font-semibold text-ink">{l.name}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
              <Portrait look={CAST[l.owner].look} size={16} bg={l.owner === "ada" ? "#fbe9de" : undefined} />
              {l.ownerLabel}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap content-center gap-1.5">
            <AnimatePresence initial={false}>
              {l.chips
                .filter((c) => step >= c.at && (c.until === undefined || step < c.until))
                .map((c) => (
                  <motion.span
                    key={c.t + c.tone}
                    layout
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26, delay: c.at === step && step === 1 ? 0.6 + (3 - i) * 0.7 : c.at === step ? 0.25 + i * 0.15 : 0 }}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${CHIP_TONE[c.tone ?? "plain"]}`}
                  >
                    {c.tone === "derived" && <span className="text-[10px]">↓</span>}
                    {c.tone === "new" && <span className="text-[10px]">↑</span>}
                    {c.t}
                    {c.sub && <span className="font-medium opacity-60">· {c.sub}</span>}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}

      {/* the travelling note for "distill up" */}
      <AnimatePresence>
        {step === 1 && (
          <motion.div
            key="up"
            className="pointer-events-none absolute right-6 z-10"
            initial={{ y: 3 * (ROW + GAP) + ROW / 2 - 14, opacity: 0 }}
            animate={{
              y: [3, 3, 2, 2, 1, 1, 0, 0].map((k) => k * (ROW + GAP) + ROW / 2 - 14),
              opacity: [0, 1, 1, 1, 1, 1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.2, times: [0, 0.1, 0.3, 0.42, 0.62, 0.74, 0.92, 1], ease: "easeInOut" }}
          >
            <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(232,116,59,0.7)]">
              ↑ SMS moves to v1.1
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* derive-down connectors */}
      <AnimatePresence>
        {step === 2 && (
          <motion.svg
            key="down"
            className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1].map((k) => (
              <motion.line
                key={k}
                x1="88%"
                x2="88%"
                y1={k * (ROW + GAP) + ROW - 8}
                y2={(k + 1) * (ROW + GAP) + 10}
                stroke="#7b6cd9"
                strokeWidth={2}
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3 + k * 0.4, duration: 0.5 }}
              />
            ))}
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IndexView() {
  const items = Array.from({ length: 24 }, (_, i) => i);
  const picked = new Set([3, 11, 17]);
  const names: Record<number, string> = { 3: "contract.md · /slots", 11: "Lesson: email reminders first", 17: "Decision: SMS in v1.1" };
  return (
    <div className="rounded-[20px] bg-white p-4 ring-1 ring-black/[0.06] shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-2.5">
        <Portrait look={CAST.be.look} size={30} />
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-ink">Backend picks up BOOK-151</div>
          <div className="text-[12px] text-muted">Add the clinic timezone to /slots</div>
        </div>
      </div>
      <div className="mt-3.5 text-[11px] font-bold uppercase tracking-wide text-faint">Reads the index · 186 items it may see</div>
      <div className="mt-2 grid grid-cols-6 gap-1">
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, backgroundColor: picked.has(i) ? "#e8743b" : "rgba(10,10,10,0.07)" }}
            transition={{ delay: 0.02 * i + (picked.has(i) ? 0.9 : 0) }}
            className="h-2.5 rounded-full"
          />
        ))}
      </div>
      <div className="mt-3.5 text-[11px] font-bold uppercase tracking-wide text-faint">Pulls only what the task needs</div>
      <div className="mt-2 flex flex-col gap-1.5">
        {[...picked].map((i, k) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + k * 0.15 }}
            className="flex items-center gap-2 rounded-[10px] bg-[#fff4ec] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#a24d1f]"
          >
            <span className="text-[10px]">◈</span>
            {names[i]}
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="mt-3.5 flex items-baseline justify-between border-t border-black/[0.06] pt-3">
        <span className="text-[12.5px] text-muted">Memory loaded for this task</span>
        <span className="text-[14px] font-semibold text-ink">
          2.1k tokens <span className="text-[12px] font-medium text-faint line-through">48k</span>
        </span>
      </motion.div>
    </div>
  );
}

function FileView() {
  const [tab, setTab] = useState<"CLAUDE.md" | "AGENTS.md">("CLAUDE.md");
  const lines: [string, string][] = [
    ["#", "Backend · Development room"],
    ["", "Runtime: " + (tab === "CLAUDE.md" ? "Claude Code" : "Codex") + " · reports to PM"],
    ["##", "Role"],
    ["-", "Own the booking API. Questions go direct, new work goes through the PM."],
    ["##", "Lessons"],
    ["-", "Email reminders until SMS ships (minutes, Mar 7)"],
    ["-", "Never merge to main without approval (locked)"],
    ["##", "Index"],
    ["-", "contract.md · decisions/sms-v1-1 · launch-checklist"],
  ];
  return (
    <div className="overflow-hidden rounded-[20px] bg-[#16151a] text-white shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-1 border-b border-white/10 px-3 py-2">
        {(["CLAUDE.md", "AGENTS.md"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative rounded-[8px] px-2.5 py-1 font-mono text-[12px] ${tab === t ? "text-white" : "text-white/45 hover:text-white/70"}`}
          >
            {tab === t && <motion.span layoutId="file-tab" className="absolute inset-0 -z-0 rounded-[8px] bg-white/10" />}
            <span className="relative">{t}</span>
          </button>
        ))}
        <span className="ml-auto text-[11px] text-white/40">generated before each session</span>
      </div>
      <div className="p-4 font-mono text-[12.5px] leading-[1.75]">
        {lines.map(([k, t], i) => (
          <motion.div key={tab + i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <span className={k.startsWith("#") ? "text-[#f0a37a]" : "text-white/35"}>{k} </span>
            <span className={k.startsWith("#") ? "font-semibold text-white" : "text-white/80"}>{t}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Visual({ step }: { step: number }): ReactNode {
  const overlay = step >= 4;
  return (
    <div className="relative">
      <motion.div animate={{ opacity: overlay ? 0.25 : 1, scale: overlay ? 0.94 : 1, filter: overlay ? "blur(2px)" : "blur(0px)" }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
        <Stack step={Math.min(step, 3)} />
      </motion.div>
      <AnimatePresence mode="wait">
        {overlay && (
          <motion.div
            key={step}
            className="absolute inset-0 flex items-center justify-center px-2"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-full max-w-[440px]">{step === 4 ? <IndexView /> : <FileView />}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MemorySection() {
  return (
    <Pinned id="memory" steps={STEPS.length} per={72}>
      {(step) => (
        <div className="mx-auto flex h-full max-w-[1320px] flex-col gap-6 px-5 pb-6 pt-[88px] md:px-8 lg:flex-row lg:items-center lg:gap-14 lg:pt-[72px]">
          <div className="lg:w-[42%]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4ec] px-3 py-1 text-[12.5px] font-semibold text-[#a24d1f] ring-1 ring-[#f3cfb6]">
              ◈ The part that compounds
            </div>
            <h2 className="h-section mt-4 text-[clamp(28px,3.2vw,46px)] text-ink">
              A company that remembers.
              <br />
              <span className="text-second">Nothing missing. Nothing stale.</span>
            </h2>
            <div className="mt-6 hidden flex-col gap-1 lg:flex">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.title}
                  animate={{ opacity: i === step ? 1 : 0.38 }}
                  transition={{ duration: 0.4 }}
                  className="relative border-l-2 py-2 pl-4"
                  style={{ borderColor: i === step ? "#0a0a0a" : "rgba(10,10,10,0.1)" }}
                >
                  <div className="text-[15.5px] font-semibold text-ink">{s.title}</div>
                  <AnimatePresence initial={false}>
                    {i === step && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden pt-1 text-[14.5px] leading-[1.5] text-muted"
                      >
                        {s.text}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 lg:hidden">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="text-[15px] font-semibold text-ink">{STEPS[step].title}</div>
                  <p className="mt-1 text-[14px] leading-[1.5] text-muted">{STEPS[step].text}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <div className="rounded-[32px] bg-[linear-gradient(140deg,#efe9f7_0%,#f6efea_55%,#f3f1ec_100%)] p-4 ring-1 ring-black/[0.04] md:p-8">
              <Visual step={step} />
            </div>
          </div>
        </div>
      )}
    </Pinned>
  );
}
