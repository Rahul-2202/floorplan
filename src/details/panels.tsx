"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import type { Line } from "@/lib/meeting";
import { BrandIcon } from "@/components/brands";
import { ChatPanel } from "@/components/chat/Chat";
import { FeedRow } from "@/components/feed/Feed";
import { IndexView } from "@/components/landing/Memory";
import { SoundButton, Transcript } from "@/components/meeting/Transcript";
import { RuntimeBadge } from "@/components/ui";
import type { Built, Ctx, ListItem, Mem, MemOp } from "./types";

/* ------------------------------------------------------------------ shell */

export function PanelShell({ title, subtitle, right, children, className = "" }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] bg-[#f6f5f2] shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] bg-white px-4 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold text-ink">{title}</div>
          {subtitle && <div className="truncate text-[11.5px] text-muted">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

const TAG: Record<NonNullable<ListItem["tone"]>, string> = {
  high: "bg-[#fdecea] text-[#9b2c24]",
  approve: "bg-[#fdf3e0] text-[#8a5a10]",
  fyi: "bg-[#f0efed] text-muted",
  ok: "bg-[#eaf6ee] text-[#24603a]",
  violet: "bg-[#f1eefd] text-[#4a3fa8]",
  warn: "bg-[#fdf3e0] text-[#8a5a10]",
};

function Who({ id, size = 26 }: { id?: string; size?: number }) {
  if (!id || !CAST[id]) return null;
  return <Portrait look={CAST[id].look} size={size} bg={id === "ada" ? "#fbe9de" : undefined} />;
}

/* ------------------------------------------------------------ ctx views */

function ListView({ c }: { c: Extract<Ctx, { kind: "list" }> }) {
  return (
    <div className="flex flex-col gap-2 p-3">
      {c.items.map((it, i) => (
        <motion.div
          key={it.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.08, type: "spring", stiffness: 260, damping: 28 }}
          className="flex items-start gap-2.5 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]"
        >
          {it.brand ? (
            <span className="grid h-[26px] w-[26px] place-items-center rounded-[8px] bg-[#f6f5f2]">
              <BrandIcon name={it.brand} size={14} />
            </span>
          ) : (
            <Who id={it.who} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className={`text-[13px] font-semibold leading-snug ${it.done ? "text-muted line-through decoration-black/25" : "text-ink"}`}>{it.title}</div>
              {it.tag && <span className={`shrink-0 rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide ${TAG[it.tone ?? "fyi"]}`}>{it.tag}</span>}
              {it.done && <span className="text-[13px] text-ok">✓</span>}
            </div>
            {it.sub && <div className="mt-0.5 text-[12px] leading-snug text-muted">{it.sub}</div>}
          </div>
        </motion.div>
      ))}
      {c.footer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="px-1 pt-1 text-[12px] font-medium text-muted">
          {c.footer}
        </motion.div>
      )}
    </div>
  );
}

function KvView({ c }: { c: Extract<Ctx, { kind: "kv" }> }) {
  return (
    <div className="p-3">
      <div className="rounded-[14px] bg-white px-3.5 ring-1 ring-black/[0.06]">
        {c.rows.map(([k, v], i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            className="flex items-start justify-between gap-3 border-b border-black/[0.05] py-2.5 last:border-0"
          >
            <span className="text-[12.5px] font-medium text-muted">{k}</span>
            <span className="max-w-[60%] text-right text-[12.5px] font-semibold text-ink">{v}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ChecklistView({ c }: { c: Extract<Ctx, { kind: "checklist" }> }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let k = 0;
    const t = setInterval(() => {
      k++;
      setN(k);
      if (k > c.items.length) clearInterval(t);
    }, 420);
    return () => clearInterval(t);
  }, [c.items.length]);
  const applied = n > c.items.length;
  return (
    <div className="flex h-full flex-col p-3">
      <div className="rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.06]">
        <div className="flex flex-col gap-2.5">
          {c.items.map((it, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <motion.span
                animate={i < n ? { scale: [0.6, 1.15, 1], opacity: 1 } : { scale: 1, opacity: 0.35 }}
                transition={{ duration: 0.35 }}
                className={`mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${i < n ? (it.ok ? "bg-ok" : "bg-ink") : "bg-black/20"}`}
              >
                {it.ok ? "✓" : "✕"}
              </motion.span>
              <span className={`text-[12.5px] leading-snug transition-colors duration-300 ${i < n ? "text-ink" : "text-faint"}`}>{it.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-[11.5px] text-muted">{c.footer}</span>
        <motion.span
          animate={applied ? { backgroundColor: "#3f9b5f" } : { backgroundColor: "#0a0a0a" }}
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          {applied ? "✓ Applied" : "Confirm"}
        </motion.span>
      </div>
    </div>
  );
}

function OrgView() {
  const rooms = [
    { name: "Development", ids: ["pm", "fe", "be", "ops", "qa"] },
    { name: "Marketing", ids: ["strat", "cr1", "cr2", "editor"] },
  ];
  return (
    <div className="flex flex-col gap-2.5 p-3">
      {rooms.map((r, ri) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ri * 0.15 }}
          className="rounded-[14px] bg-white p-2 ring-1 ring-black/[0.06]"
        >
          <div className="px-1.5 pb-1 pt-0.5 text-[12px] font-semibold text-muted">{r.name}</div>
          {r.ids.map((id) => {
            const m = CAST[id];
            return (
              <div key={id} className="flex items-center gap-2 rounded-[10px] px-1.5 py-1">
                <Portrait look={m.look} size={22} />
                <span className="flex-1 text-[12.5px] font-semibold text-ink">
                  {m.role}
                  {m.head && <span className="ml-1.5 rounded bg-ink px-1 py-[1px] text-[9px] font-bold uppercase text-white">Head</span>}
                </span>
                <RuntimeBadge runtime={m.runtime} />
              </div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}

function PreReadView() {
  const pos = [
    { id: "pm", t: "B. SMS needs a provider contract; that's a week on its own." },
    { id: "be", t: "B. Reminders are a separate service, easy to add after launch." },
    { id: "strat", t: "Either works. I need a firm date today." },
  ];
  return (
    <div className="flex flex-col gap-2.5 p-3">
      <div className="rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.06]">
        <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Question</div>
        <div className="mt-1 text-[13.5px] font-semibold leading-snug text-ink">Launch sooner without SMS, or wait for it?</div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {[
            { k: "A", t: "Wait for SMS, launch Wed the 15th" },
            { k: "B", t: "Launch Fri the 10th, SMS in v1.1" },
          ].map((o) => (
            <div key={o.k} className={`rounded-[10px] p-2.5 ring-1 ${o.k === "B" ? "bg-[#f1eefd] ring-[#d8d1f7]" : "bg-[#f6f5f2] ring-black/[0.05]"}`}>
              <div className="text-[10.5px] font-bold text-muted">Option {o.k}</div>
              <div className="text-[12px] font-semibold leading-snug text-ink">{o.t}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.06]">
        <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Positions</div>
        <div className="mt-2 flex flex-col gap-2">
          {pos.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="flex gap-2">
              <Who id={p.id} size={22} />
              <div className="text-[12px] leading-snug text-ink-2">
                <span className="font-semibold text-ink">{CAST[p.id].name}: </span>
                {p.t}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeView({ c }: { c: Extract<Ctx, { kind: "code" }> }) {
  const [tab, setTab] = useState(0);
  const t = c.tabs[tab];
  return (
    <div className="h-full p-3">
      <div className="h-full overflow-hidden rounded-[16px] bg-[#16151a] text-white">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 px-2 py-1.5">
          {c.tabs.map((x, i) => (
            <button key={x.name} onClick={() => setTab(i)} className={`relative shrink-0 rounded-[8px] px-2.5 py-1 font-mono text-[11.5px] ${i === tab ? "text-white" : "text-white/45 hover:text-white/70"}`}>
              {i === tab && <motion.span layoutId="d-file-tab" className="absolute inset-0 rounded-[8px] bg-white/10" />}
              <span className="relative">{x.name}</span>
            </button>
          ))}
        </div>
        <div className="p-3.5 font-mono text-[12px] leading-[1.75]">
          {t.lines.map(([k, v], i) => (
            <motion.div key={tab + "-" + i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <span className={k.startsWith("#") ? "text-[#f0a37a]" : "text-white/35"}>{k} </span>
              <span className={k.startsWith("#") ? "font-semibold text-white" : "text-white/80"}>{v}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VersionsView({ c }: { c: Extract<Ctx, { kind: "versions" }> }) {
  return (
    <div className="p-3">
      <div className="rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]">
        {c.rows.map((r, i) => (
          <div key={r.v} className="flex items-center gap-2.5 border-b border-black/[0.05] py-2.5 last:border-0">
            <span className="rounded-md bg-[#f6f5f2] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-2">{r.v}</span>
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: r.state === "reverted" ? 0.45 : 1 }}
              transition={{ delay: 0.9 }}
              className={`flex-1 text-[12.5px] leading-snug text-ink ${r.state === "reverted" ? "line-through decoration-black/40" : ""}`}
            >
              {r.text}
              <span className="ml-1 text-[11px] font-medium text-faint no-underline">· {r.who}</span>
            </motion.span>
            {r.state === "current" && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1 + i * 0 }} className="rounded-full bg-[#eaf6ee] px-2 py-0.5 text-[10.5px] font-bold text-[#24603a]">
                Current
              </motion.span>
            )}
          </div>
        ))}
        {c.footer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-2 rounded-full bg-ink py-1.5 text-center text-[12px] font-semibold text-white">
            ↺ {c.footer}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatsView() {
  const weeks = [23, 9];
  const rows = [
    ["Preferences you had to repeat", "0"],
    ["Times an agent used outdated info", "1 → 0"],
    ["Questions memory already answered", "6 → 1"],
    ["Memory tokens per task", "2.1k avg"],
  ];
  return (
    <div className="flex flex-col gap-2.5 p-3">
      <div className="rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.06]">
        <div className="text-[12px] font-semibold text-muted">Questions to you, per week</div>
        <div className="mt-3 flex items-end gap-3">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[13px] font-semibold text-ink">{w}</span>
              <motion.div initial={{ height: 0 }} animate={{ height: (w / 23) * 90 }} transition={{ delay: 0.1 + i * 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="w-full rounded-[8px]" style={{ background: i ? "#e8743b" : "rgba(10,10,10,0.1)" }} />
              <span className="text-[11px] text-faint">Week {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[14px] bg-white px-3.5 ring-1 ring-black/[0.06]">
        <div className="pt-2.5 text-[10.5px] font-bold uppercase tracking-wide text-faint">Memory health</div>
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-black/[0.05] py-2 text-[12.5px] last:border-0">
            <span className="text-muted">{k}</span>
            <span className="font-semibold text-ink">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MINUTES: Record<"sync" | "joint", { title: string; why: string; actions: { id: string; t: string }[] }> = {
  sync: {
    title: "Banner queued · launch date needs the CEO",
    why: "Dropping SMS to launch sooner is above both heads' authority.",
    actions: [
      { id: "pm", t: "Add BOOK-148 launch banner for Thursday" },
      { id: "strat", t: "Hold the campaign date" },
      { id: "pm", t: "Invite the CEO and Ada, with a pre-read" },
    ],
  },
  joint: {
    title: "Launch Fri Mar 10 · SMS in v1.1",
    why: "SMS needs a provider contract; email covers launch.",
    actions: [
      { id: "pm", t: "Create BOOK-150 for v1.1" },
      { id: "be", t: "Shortlist two SMS providers" },
      { id: "strat", t: "Re-date the launch plan" },
    ],
  },
};

const CTX_TITLE: Record<Ctx["kind"], [string, string?]> = {
  chat: ["Ada", "Office manager"],
  list: ["", ""],
  kv: ["", ""],
  checklist: ["", ""],
  org: ["Proposed structure", "By Ada · 9 agents, 2 rooms"],
  preread: ["Pre-read", "Meeting room · 2:00 · 10 min"],
  meeting: ["Meeting room", "You, PM, Strategist · chaired by Ada"],
  code: ["", ""],
  index: ["Backend's memory", "BOOK-151 · add timezone to /slots"],
  versions: ["Configuration history", "Every change versioned"],
  stats: ["Two weeks in", "How the company is learning"],
};

export function ContextPanel({
  ctx,
  ctxKey,
  meeting,
}: {
  ctx: Ctx;
  ctxKey: string;
  meeting: { lines: Line[]; index: number; speaking: boolean; sound: boolean; toggle: () => void };
}) {
  if (ctx.kind === "chat")
    return <ChatPanel messages={ctx.msgs.map((m, i) => ({ id: `${ctxKey}-${i}-${m.text.slice(0, 12)}`, from: m.from, text: m.text }))} className="!rounded-[22px] !shadow-[var(--shadow-card)]" />;

  let [title, subtitle] = CTX_TITLE[ctx.kind];
  if ("title" in ctx && ctx.title) title = ctx.title;
  if ("subtitle" in ctx && ctx.subtitle) subtitle = ctx.subtitle;
  if (ctx.kind === "meeting") {
    title = ctx.id === "sync" ? "Meeting room · heads' sync" : "Meeting room";
    subtitle = ctx.id === "sync" ? "PM, Strategist · cross-team" : "You, PM, Strategist · chaired by Ada";
    if (ctx.minutes) subtitle = "Minutes written";
  }
  const right =
    ctx.kind === "meeting" ? (
      <SoundButton sound={meeting.sound} onToggle={meeting.toggle} speaking={meeting.speaking} />
    ) : "who" in ctx && ctx.who ? (
      <Who id={ctx.who} size={28} />
    ) : null;

  return (
    <PanelShell
      title={
        <span className="flex items-center gap-1.5">
          {ctx.kind === "meeting" && !ctx.minutes && <span className="h-2 w-2 rounded-full bg-bad" style={{ animation: "led 1.4s steps(2) infinite" }} />}
          {title}
        </span>
      }
      subtitle={subtitle}
      right={right}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={ctx.kind === "meeting" ? "meeting" : ctxKey}
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {ctx.kind === "list" && <ListView c={ctx} />}
          {ctx.kind === "kv" && <KvView c={ctx} />}
          {ctx.kind === "checklist" && <ChecklistView c={ctx} />}
          {ctx.kind === "org" && <OrgView />}
          {ctx.kind === "preread" && <PreReadView />}
          {ctx.kind === "code" && <CodeView c={ctx} />}
          {ctx.kind === "index" && (
            <div className="origin-top scale-[0.92] p-1">
              <IndexView />
            </div>
          )}
          {ctx.kind === "versions" && <VersionsView c={ctx} />}
          {ctx.kind === "stats" && <StatsView />}
          {ctx.kind === "meeting" && (
            <div className="flex h-full flex-col gap-2.5 p-3">
              <div className="min-h-0 flex-1">
                <Transcript lines={meeting.lines} index={meeting.index} speaking={meeting.speaking} />
              </div>
              <AnimatePresence>
                {ctx.minutes && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="shrink-0 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]"
                  >
                    <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Minutes</div>
                    <div className="mt-1 text-[13px] font-semibold text-ink">{MINUTES[ctx.id].title}</div>
                    <div className="text-[11.5px] text-muted">{MINUTES[ctx.id].why}</div>
                    <div className="mt-2 flex flex-col gap-1">
                      {MINUTES[ctx.id].actions.map((a) => (
                        <div key={a.t} className="flex items-center gap-2 text-[12px] text-ink-2">
                          <Who id={a.id} size={16} />
                          {a.t}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </PanelShell>
  );
}

/* ---------------------------------------------------------------- memory */

const OP: Record<MemOp, { label: string; cls: string; icon: string }> = {
  add: { label: "Added", cls: "bg-[#fff4ec] text-[#a24d1f] ring-[#f3cfb6]", icon: "+" },
  derive: { label: "Derived", cls: "bg-[#f1eefd] text-[#4a3fa8] ring-[#d8d1f7]", icon: "↓" },
  supersede: { label: "Superseded", cls: "bg-[#f0efed] text-muted ring-black/[0.08]", icon: "⤳" },
  flag: { label: "Flagged stale", cls: "bg-[#fdf3e0] text-[#8a5a10] ring-[#f1d9a6]", icon: "⚑" },
  review: { label: "Approved", cls: "bg-[#eaf6ee] text-[#24603a] ring-[#bfe2cb]", icon: "↑" },
  read: { label: "Read", cls: "bg-[#e8eefb] text-[#2c56b0] ring-[#c9d8f6]", icon: "◎" },
  generate: { label: "Generated", cls: "bg-[#16151a] text-white ring-black/20", icon: "⚙" },
};

const LAYERS = ["Company", "CEO profile", "Room · Development", "Room · Marketing", "Agents", "Conversation"];
const SHORT: Record<string, string> = {
  Company: "Company",
  "CEO profile": "CEO",
  "Room · Development": "Dev room",
  "Room · Marketing": "Mkt room",
  Agents: "Agents",
  Conversation: "Convos",
};

function layerOf(l: string) {
  if (l.startsWith("Agent")) return "Agents";
  return LAYERS.includes(l) ? l : "Agents";
}

export function MemoryPanel({ all, index }: { all: Built[]; index: number }) {
  const current = all[index].step.memory ?? [];
  const counts: Record<string, number> = Object.fromEntries(LAYERS.map((l) => [l, 0]));
  for (let i = 0; i <= index; i++)
    (all[i].step.memory ?? []).forEach((m) => {
      if (m.op === "add" || m.op === "derive" || m.op === "generate") counts[layerOf(m.layer)] += 1;
    });
  let lastIdx = index;
  while (lastIdx >= 0 && !(all[lastIdx].step.memory ?? []).length) lastIdx--;
  const shown: Mem[] = current.length ? current : lastIdx >= 0 ? (all[lastIdx].step.memory ?? []) : [];
  const stale = !current.length;

  return (
    <PanelShell title="Memory" subtitle={current.length ? `${current.length} change${current.length > 1 ? "s" : ""} this step` : "No changes this step"}>
      <div className="flex h-full flex-col">
        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-3" data-lenis-prevent>
          {!shown.length && <div className="grid h-full place-items-center text-center text-[12.5px] text-faint">Memory starts filling as soon as the CEO talks to Ada.</div>}
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((m, i) => (
              <motion.div
                key={`${lastIdx}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: stale ? 0.45 : 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ delay: stale ? 0 : 0.15 + i * 0.22, type: "spring", stiffness: 260, damping: 28 }}
                className="mb-2 flex gap-2.5 rounded-[14px] bg-white p-2.5 ring-1 ring-black/[0.06]"
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-[13px] font-bold ring-1 ${OP[m.op].cls}`}>{OP[m.op].icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10.5px] font-bold uppercase tracking-wide text-faint">{m.layer}</span>
                    <span className={`rounded-full px-1.5 py-[0.5px] text-[10px] font-semibold ring-1 ${OP[m.op].cls}`}>{OP[m.op].label}</span>
                  </div>
                  <div className={`mt-0.5 text-[12.5px] font-semibold leading-snug text-ink ${m.op === "supersede" ? "line-through decoration-black/30" : ""}`}>{m.text}</div>
                  {(m.note || m.who) && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                      {m.who && <Who id={m.who} size={14} />}
                      {m.who && <span>{CAST[m.who]?.name}</span>}
                      {m.note && <span>· {m.note}</span>}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="grid shrink-0 grid-cols-6 gap-0.5 border-t border-black/[0.06] bg-white px-2 py-1.5">
          {LAYERS.map((l) => (
            <div key={l} className="rounded-[8px] px-1 py-0.5 text-center">
              <div className="truncate text-[9.5px] font-semibold text-faint">{SHORT[l]}</div>
              <motion.div key={counts[l]} initial={{ scale: 1.3, color: "#e8743b" }} animate={{ scale: 1, color: "#0a0a0a" }} className="text-[13px] font-semibold">
                {counts[l]}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

/* ---------------------------------------------------------------- events */

export function EventLog({ built, index }: { built: Built; index: number }) {
  const fresh = new Set((built.step.events ?? []).map((_, k) => `${index}-${k}`));
  const items = built.events.slice(-8);
  return (
    <PanelShell title="Event log" subtitle={`${built.events.length} events so far`}>
      <div className="absolute inset-0 flex flex-col justify-end gap-3 overflow-hidden px-3.5 pb-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[#f6f5f2] to-transparent" />
        {!items.length && <div className="pb-6 text-center text-[12.5px] text-faint">Nothing has happened yet.</div>}
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((e) => (
            <motion.div
              key={e.id}
              layout="position"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: fresh.has(e.id) ? 1 : 0.55, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <FeedRow item={{ id: e.id, kind: e.kind, who: e.who, to: e.to, text: e.text, meta: e.t }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PanelShell>
  );
}
