"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { ReactNode } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { BrandIcon } from "../brands";
import { Pinned, StageHead } from "./Pinned";

type Kind = "Decision" | "Approve" | "Review" | "Blocked" | "FYI";

interface Item {
  id: string;
  who: string;
  kind: Kind;
  title: string;
  sub: string;
  channel: string;
  slack: string;
  at: number;
  /** Step it gets resolved, and where. */
  done?: { at: number; via: "slack" | "dashboard"; reply: string };
  batch?: boolean;
}

const ITEMS: Item[] = [
  {
    id: "scope",
    who: "pm",
    kind: "Decision",
    title: "Launch Friday without SMS reminders?",
    sub: "Development · pre-read attached",
    channel: "#development",
    slack: "@you need a call on launch scope. Ship Friday without SMS, or wait a week? Pre-read is in FloorPlan.",
    at: 0,
  },
  {
    id: "merge",
    who: "ops",
    kind: "Approve",
    title: "First merge to main",
    sub: "Development · PR #51, checks passed",
    channel: "DevOps (DM)",
    slack: "First time merging to main. PR #51 is the staging config, all checks green. OK to merge?",
    at: 1,
    done: { at: 3, via: "slack", reply: "Approved ✅" },
  },
  {
    id: "drafts",
    who: "editor",
    kind: "Review",
    title: "3 LinkedIn drafts for the launch",
    sub: "Marketing · due Thursday",
    channel: "#marketing",
    slack: "@you three launch posts are ready for review. Nothing goes out without your yes.",
    at: 1,
    done: { at: 4, via: "dashboard", reply: "Approved by you in FloorPlan. Scheduling for Friday 9:00." },
  },
  {
    id: "fyi",
    who: "ada",
    kind: "FYI",
    title: "4 updates batched for Friday",
    sub: "Velocity, spend, two shipped tickets",
    channel: "Ada (DM)",
    slack: "Morning! 3 things need you today. I've batched 4 FYIs for Friday so they don't interrupt you.",
    at: 2,
    batch: true,
  },
  {
    id: "blocked",
    who: "qa",
    kind: "Blocked",
    title: "Needs real clinic test data",
    sub: "Development · parked, moved to next task",
    channel: "#development",
    slack: "@you blocked on test data for the clinics import. Parked it and moved on to the payments tests for now.",
    at: 5,
  },
];

const STEPS = [
  "Agents ping you where you already work. Every ping lands on your dashboard too.",
  "Approvals and reviews arrive from any room, any channel.",
  "Ada triages: what needs you today rises to the top, FYIs wait for Friday.",
  "Approve in Slack, and the dashboard ticks it off.",
  "Or approve on the dashboard, and the Slack thread gets the reply.",
  "A stuck agent flags it, then moves on. Nothing waits on you silently.",
];

const KIND: Record<Kind, { cls: string; dot: string }> = {
  Decision: { cls: "bg-[#fdecea] text-[#9b2c24]", dot: "#d9534a" },
  Approve: { cls: "bg-[#fdf3e0] text-[#8a5a10]", dot: "#d99a2b" },
  Review: { cls: "bg-[#f1eefd] text-[#4a3fa8]", dot: "#7b6cd9" },
  Blocked: { cls: "bg-[#fdf3e0] text-[#8a5a10]", dot: "#d99a2b" },
  FYI: { cls: "bg-[#f0efed] text-muted", dot: "#a19d96" },
};

const ORDER: Record<Kind, number> = { Decision: 0, Blocked: 1, Approve: 2, Review: 3, FYI: 9 };

/* --------------------------------------------------------------- dashboard */

function ItemRow({ it, step, active }: { it: Item; step: number; active: boolean }) {
  const done = it.done && step >= it.done.at;
  const m = CAST[it.who];
  return (
    <motion.div
      layout
      layoutId={`dash-${it.id}`}
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: done ? 0.6 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className={`relative flex items-center gap-3 rounded-[14px] bg-white p-3 ring-1 transition-shadow duration-500 ${
        active ? "shadow-[0_0_0_3px_rgba(232,116,59,0.25)] ring-[#f3cfb6]" : "ring-black/[0.06]"
      }`}
    >
      <Portrait look={m.look} size={34} bg={it.who === "ada" ? "#fbe9de" : undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide ${KIND[it.kind].cls}`}>{it.kind}</span>
          <span className="truncate text-[11.5px] text-faint">{m.name}</span>
        </div>
        <div className={`mt-0.5 truncate text-[13.5px] font-semibold ${done ? "text-muted line-through decoration-black/25" : "text-ink"}`}>{it.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted">
          <span className="truncate">{it.sub}</span>
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#f6f5f2] px-1.5 py-[1px] text-[10.5px] font-semibold text-ink-2 sm:inline-flex">
            <BrandIcon name="Slack" size={10} />
            {it.channel}
          </span>
        </div>
      </div>
      <div className="hidden shrink-0 md:block">
        {done ? (
          <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 rounded-full bg-[#eaf6ee] px-2.5 py-1 text-[11.5px] font-semibold text-[#24603a]">
            ✓ {it.done!.via === "slack" ? "Done in Slack" : "Approved"}
          </motion.span>
        ) : it.kind === "Decision" ? (
          <span className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-white">Open pre-read</span>
        ) : it.kind === "Blocked" ? (
          <span className="rounded-full bg-[#f2f0ec] px-3 py-1.5 text-[12px] font-semibold text-ink">Reply</span>
        ) : (
          <motion.span
            animate={active && it.done && step === it.done.at - 1 ? { scale: [1, 1.06, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="block rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Approve
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

function DashboardView({ step, activeId }: { step: number; activeId: string }) {
  const visible = ITEMS.filter((i) => i.at <= step);
  const triaged = step >= 2;
  const open = visible.filter((i) => !(i.done && step >= i.done.at) && !(triaged && i.batch));
  const sorted = triaged ? [...open].sort((a, b) => ORDER[a.kind] - ORDER[b.kind]) : [...open].reverse();
  const done = visible.filter((i) => i.done && step >= i.done.at);
  const batched = triaged ? visible.filter((i) => i.batch) : [];

  const stats = [
    { l: "Needs you", v: open.length, c: "#d9534a" },
    { l: "Working", v: 7, c: "#3f9b5f" },
    { l: "Blocked", v: step >= 5 ? 1 : 0, c: "#d99a2b" },
    { l: "Spend", v: "$212", c: "#0a0a0a" },
  ];

  return (
    <div className="flex h-full overflow-hidden rounded-[24px] bg-[#f6f5f2] shadow-[0_2px_4px_rgba(10,10,10,0.04),0_30px_80px_-30px_rgba(10,10,10,0.3)] ring-1 ring-black/[0.06]">
      {/* app rail */}
      <div className="hidden w-[60px] shrink-0 flex-col items-center gap-2 border-r border-black/[0.06] bg-white py-4 sm:flex">
        <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-ink">
          <svg width="16" height="16" viewBox="0 0 28 28" style={{ shapeRendering: "crispEdges" }}>
            <rect x="4" y="4" width="9" height="9" fill="#e8743b" />
            <rect x="15" y="4" width="9" height="9" fill="#fff" />
            <rect x="4" y="15" width="9" height="9" fill="#fff" />
            <rect x="15" y="15" width="9" height="9" fill="#fff" fillOpacity=".35" />
          </svg>
        </div>
        {["Office", "Inbox", "Rooms", "Memory", "Rules"].map((l, i) => (
          <div key={l} className={`flex w-[48px] flex-col items-center gap-0.5 rounded-[10px] py-1.5 text-[9.5px] font-semibold ${i === 1 ? "bg-[#f6f5f2] text-ink" : "text-faint"}`}>
            <span className={`h-4 w-4 rounded-[5px] ${i === 1 ? "bg-ink" : "bg-black/10"}`} />
            {l}
          </div>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div>
            <div className="text-[12px] font-semibold text-muted">Thursday, 9:41</div>
            <div className="text-[20px] font-semibold tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
              Good morning. Here&apos;s what needs you.
            </div>
          </div>
          <Portrait look={CAST.you.look} size={34} />
        </div>
        <div className="grid grid-cols-4 gap-2 px-5">
          {stats.map((s) => (
            <div key={s.l} className="rounded-[12px] bg-white px-3 py-2 ring-1 ring-black/[0.05]">
              <div className="text-[10.5px] font-semibold text-muted">{s.l}</div>
              <motion.div key={String(s.v)} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[18px] font-semibold" style={{ color: s.c }}>
                {s.v}
              </motion.div>
            </div>
          ))}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden px-5 pb-4 pt-4">
          <LayoutGroup id="dash">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[12px] font-bold uppercase tracking-wide text-faint">Needs you · {open.length}</div>
              {triaged && (
                <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#a24d1f]">
                  <Portrait look={CAST.ada.look} size={16} bg="#fbe9de" />
                  Sorted by Ada
                </motion.div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false} mode="popLayout">
                {sorted.map((it) => (
                  <ItemRow key={it.id} it={it} step={step} active={it.id === activeId} />
                ))}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {batched.length > 0 && (
                <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 rounded-[12px] border border-dashed border-black/15 px-3 py-2 text-[12px] text-muted">
                  <span className="font-semibold text-ink-2">Batched for Friday</span>
                  <span>· 4 FYIs from Ada</span>
                </motion.div>
              )}
            </AnimatePresence>
            {done.length > 0 && (
              <motion.div layout className="mt-4">
                <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-faint">Done today · {done.length}</div>
                <div className="flex flex-col gap-2">
                  {done.map((it) => (
                    <ItemRow key={it.id} it={it} step={step} active={it.id === activeId} />
                  ))}
                </div>
              </motion.div>
            )}
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- slack */

function SlackMsg({ who, children, time, app = true }: { who: string; children: ReactNode; time: string; app?: boolean }) {
  const m = CAST[who];
  return (
    <div className="flex gap-2.5">
      <Portrait look={m.look} size={32} bg={who === "ada" ? "#fbe9de" : undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13.5px] font-bold text-[#1d1c1d]">{who === "you" ? "You" : m.name}</span>
          {app && <span className="rounded-[3px] bg-[#e8e8e8] px-1 text-[9.5px] font-bold text-[#616061]">APP</span>}
          <span className="text-[11px] text-[#616061]">{time}</span>
        </div>
        <div className="text-[13.5px] leading-[1.45] text-[#1d1c1d]">{children}</div>
      </div>
    </div>
  );
}

function SlackView({ step, activeId }: { step: number; activeId: string }) {
  const visible = ITEMS.filter((i) => i.at <= step).reverse();
  const times: Record<string, string> = { scope: "9:12", merge: "9:20", drafts: "9:24", fyi: "9:30", blocked: "9:38" };
  return (
    <div className="flex h-full overflow-hidden rounded-[24px] bg-white shadow-[0_2px_4px_rgba(10,10,10,0.04),0_30px_80px_-30px_rgba(10,10,10,0.3)] ring-1 ring-black/[0.06]">
      <div className="hidden w-[150px] shrink-0 flex-col gap-0.5 bg-[#3f0e40] px-2 py-3 text-[12.5px] text-white/70 xl:flex">
        <div className="mb-2 flex items-center gap-1.5 px-2 text-[14px] font-bold text-white">Bookwell</div>
        {[
          { l: "Activity", on: true, n: visible.length },
          { l: "# development", n: 0 },
          { l: "# marketing", n: 0 },
          { l: "# launch", n: 0 },
        ].map((c) => (
          <div key={c.l} className={`flex items-center justify-between rounded-[6px] px-2 py-1 ${c.on ? "bg-[#1164a3] text-white" : ""}`}>
            <span className="truncate">{c.l}</span>
            {c.n > 0 && <span className="rounded-full bg-[#e01e5a] px-1.5 text-[10px] font-bold text-white">{c.n}</span>}
          </div>
        ))}
        <div className="mt-3 px-2 text-[11px] font-semibold text-white/50">Direct messages</div>
        {["ada", "pm", "ops"].map((id) => (
          <div key={id} className="flex items-center gap-1.5 rounded-[6px] px-2 py-1">
            <Portrait look={CAST[id].look} size={16} bg={id === "ada" ? "#fbe9de" : undefined} />
            <span className="truncate">{CAST[id].name}</span>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-black/[0.08] px-4 py-3">
          <BrandIcon name="Slack" size={16} />
          <span className="text-[15px] font-bold text-[#1d1c1d]">Activity</span>
          <span className="text-[12px] text-[#616061]">· mentions and DMs</span>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0 flex flex-col gap-1 overflow-hidden p-2">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((it) => {
                const done = it.done && step >= it.done.at;
                const active = it.id === activeId;
                return (
                  <motion.div
                    key={it.id}
                    layout="position"
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 32 }}
                    className={`rounded-[10px] px-2.5 py-2 transition-colors duration-500 ${active ? "bg-[#fff8e6]" : ""}`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 pl-[42px] text-[11px] font-semibold text-[#616061]">
                      {it.channel}
                      {active && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-full bg-[#fbe9de] px-1.5 text-[10px] font-bold text-[#a24d1f]">
                          On your dashboard
                        </motion.span>
                      )}
                    </div>
                    <SlackMsg who={it.who} time={times[it.id]}>
                      {it.slack.startsWith("@you") ? (
                        <>
                          <span className="rounded-[3px] bg-[#e8f5fa] px-0.5 font-semibold text-[#1264a3]">@you</span>
                          {it.slack.slice(4)}
                        </>
                      ) : (
                        it.slack
                      )}
                    </SlackMsg>
                    <AnimatePresence>
                      {done && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="ml-[42px] mt-1.5 overflow-hidden border-l-2 border-[#e8e8e8] pl-2.5"
                        >
                          {it.done!.via === "slack" ? (
                            <SlackMsg who="you" time="9:44" app={false}>
                              {it.done!.reply}
                            </SlackMsg>
                          ) : (
                            <SlackMsg who="ada" time="9:46">
                              {it.done!.reply}
                            </SlackMsg>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- section */

const ACTIVE = ["scope", "drafts", "fyi", "merge", "drafts", "blocked"];

export function DashboardSection() {
  return (
    <Pinned id="dashboard" steps={STEPS.length} per={60}>
      {(step) => (
        <div className="flex h-full flex-col">
          <StageHead title="One dashboard for what needs you." second="Synced with Slack, both ways." captions={STEPS} step={step} />
          <div className="mx-auto grid min-h-0 w-full max-w-[1320px] flex-1 gap-3 px-3 pb-3 pt-5 md:grid-cols-[1.25fr_1fr] md:gap-5 md:px-8 md:pb-7">
            <DashboardView step={step} activeId={ACTIVE[step]} />
            <div className="hidden min-h-0 md:block">
              <SlackView step={step} activeId={ACTIVE[step]} />
            </div>
          </div>
        </div>
      )}
    </Pinned>
  );
}
