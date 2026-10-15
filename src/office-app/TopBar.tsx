"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { CAST, ROOMS } from "@/office/layout";
import { LiveButton } from "@/live/LiveButton";
import { inboxFor, me } from "@/sim/people";
import { clearSaved, clockLabel, roomName, useSim } from "@/sim/store";
import type { PanelKey } from "@/sim/types";
import { Dot, Face } from "./bits";
import { Icon } from "./icons";
import { useUI } from "./ui";
import { ROOM_LABEL } from "./who";

const TOOLS: { k: PanelKey; l: string; icon: React.ReactNode }[] = [
  { k: "dashboard", l: "Dashboard", icon: Icon.dashboard },
  { k: "team", l: "Agents & teams", icon: Icon.team },
  { k: "people", l: "People", icon: Icon.people },
  { k: "calendar", l: "Calendar", icon: Icon.calendar },
  { k: "outputs", l: "Outputs", icon: Icon.outputs },
  { k: "conversations", l: "Transcripts & chats", icon: Icon.convo },
  { k: "memory", l: "Company memory", icon: Icon.memory },
  { k: "inbox", l: "Needs your attention", icon: Icon.inbox },
  { k: "governance", l: "Rules & settings", icon: Icon.settings },
];

function Jump() {
  const { s } = useSim();
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const agents = Object.keys(s.live).filter((id) => (CAST[id]?.name ?? id).toLowerCase().includes(q.toLowerCase()) || (CAST[id]?.role ?? "").toLowerCase().includes(q.toLowerCase()));
  const rooms = (["ceo", "dev", "marketing", "meeting"] as const).filter((r) => ROOM_LABEL[r].toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="relative" data-tour="jump">
      <button onClick={() => setOpen((v) => !v)} className="flex h-9 items-center gap-2 rounded-full bg-[#f2f0ec] px-3 text-[12.5px] font-medium text-muted hover:bg-[#e9e6df]">
        {Icon.search} Jump to a room or agent
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-11 z-50 w-[300px] overflow-hidden rounded-[18px] bg-white p-2 shadow-[var(--shadow-float)] ring-1 ring-black/[0.06]"
          >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Search…"
              className="mb-1 w-full rounded-[12px] bg-[#f6f5f2] px-3 py-2 text-[13px] outline-none"
            />
            <div className="max-h-[320px] overflow-y-auto">
              {rooms.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    const rr = ROOMS[r];
                    ui.walkTo(rr.x + rr.w / 2, rr.y + rr.h - 2.5);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[13px] hover:bg-[#f6f5f2]"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-[#f2f0ec] text-[11px]">⌂</span>
                  {ROOM_LABEL[r]}
                </button>
              ))}
              {agents.map((id) => (
                <div key={id} className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 hover:bg-[#f6f5f2]">
                  <Face id={id} size={24} />
                  <span className="flex-1 text-[13px]">
                    {CAST[id]?.name} <span className="text-muted">· {CAST[id]?.role}</span>
                  </span>
                  <Dot status={s.live[id].status} />
                  <button
                    onClick={() => {
                      ui.summon(id);
                      setOpen(false);
                    }}
                    className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    Call
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ROLE_L = { ceo: "CEO", lead: "Lead", member: "Member" } as const;

/** Play the office as anyone: their inbox, permissions and reporting line. */
function Viewer() {
  const { s, d } = useSim();
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const p = me(s);
  const people = Object.values(s.people).filter((x) => !x.real);
  return (
    <div className="relative" data-tour="viewer">
      <button onClick={() => setOpen((v) => !v)} className="flex h-9 items-center gap-2 rounded-full bg-[#eef2fc] py-1 pl-1 pr-3 text-left ring-1 ring-[#d5def5] hover:bg-[#e4eafb]">
        <Face id={p.id} size={26} />
        <span className="leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-[#21409a]/70">Viewing as</span>
          <span className="block text-[12.5px] font-semibold text-[#21409a]">
            {p.id === "you" ? "CEO" : p.name} <span className="font-medium text-[#21409a]/60">· {p.id === "you" ? "everything" : p.room ? `${ROLE_L[p.role]}, ${roomName(p.room)}` : "Lobby"}</span>
          </span>
        </span>
        <span className="text-[10px] text-[#21409a]/60">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-11 z-50 w-[320px] overflow-hidden rounded-[18px] bg-white p-2 shadow-[var(--shadow-float)] ring-1 ring-black/[0.06]"
          >
            <div className="px-2 pb-2 pt-1 text-[12px] leading-snug text-muted">See the office as anyone in it. Their inbox, permissions and reporting line change with them.</div>
            {people.map((x) => (
              <button
                key={x.id}
                onClick={() => {
                  setOpen(false);
                  if (x.id === s.me) return;
                  ui.closePanel();
                  ui.closeWin();
                  d({ type: "viewer", id: x.id });
                  d({ type: "toast", toast: { id: `as-${x.id}-${s.clock}`, who: "ada", text: x.id === "you" ? "You're the CEO again. Everything routes to you." : `You're now ${x.full}, ${x.title.toLowerCase()}${x.room ? ` in ${roomName(x.room)}` : ", waiting in the lobby"}.` } });
                }}
                className={`flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left hover:bg-[#f6f5f2] ${x.id === s.me ? "bg-[#eef2fc]" : ""}`}
              >
                <Face id={x.id} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink">{x.id === "you" ? "CEO" : x.full}</span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {x.title} · {x.role === "ceo" ? "sees everything" : x.room ? `${ROLE_L[x.role]} in ${roomName(x.room)}` : "in the lobby"}
                  </span>
                </span>
                {x.id === s.me && <span className="text-[11px] font-semibold text-[#21409a]">Current</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopBar() {
  const { s, d } = useSim();
  const ui = useUI();
  const mine = me(s);
  const box = inboxFor(s);
  const badge: Partial<Record<PanelKey, number>> = {
    inbox: box.open.filter((i) => !i.batched).length,
    people: Object.values(s.people).filter((p) => !p.room && p.role !== "ceo").length * (mine.role === "ceo" ? 1 : 0) + (mine.role === "ceo" ? s.requests.filter((r) => r.ceo === "pending" && r.ada === "approved").length : 0),
    outputs: mine.role === "ceo" ? s.outputs.filter((o) => !o.viewed).length : 0,
    dashboard: s.tasks.filter((t) => (t.state === "question" || t.state === "blocked") && (mine.role === "ceo" || t.room === mine.room)).length,
    calendar: s.calendar.filter((e) => e.status === "pending").length,
  };
  return (
    <div className="absolute inset-x-3 top-3 z-50 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 rounded-full bg-white/95 py-1.5 pl-1.5 pr-2 shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] backdrop-blur">
        <Link href="/" className="flex items-center gap-2 pl-1 pr-1">
          <LogoMark size={26} />
        </Link>
        <div className="pr-1 leading-tight">
          <div className="text-[13.5px] font-semibold text-ink">Bookwell HQ</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" style={{ animation: "led 1.6s steps(2) infinite" }} />
            Live simulation · {clockLabel(s.clock)}
          </div>
        </div>
        {!mine.real && <Viewer />}
        <LiveButton />
        <div className="hidden 2xl:block">
          <Jump />
        </div>
        <button
          onClick={() => {
            clearSaved();
            d({ type: "reset" });
          }}
          className="hidden rounded-full px-2.5 py-1.5 text-[11.5px] font-medium text-faint hover:bg-black/5 hover:text-ink xl:block"
          title="Start the demo over"
        >
          Reset demo
        </button>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-white/95 p-1.5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] backdrop-blur">
        <button
          data-tour="assign"
          disabled={!mine.room && mine.role !== "ceo"}
          title={!mine.room && mine.role !== "ceo" ? "You can assign work once you're in a room" : undefined}
          onClick={() => ui.openWin({ kind: "assign" })}
          className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white hover:bg-black disabled:opacity-35"
        >
          {Icon.plus} Assign task
        </button>
        {TOOLS.map((t) => (
          <button
            key={t.k}
            data-tour={t.k}
            onClick={() => (ui.panel === t.k ? ui.closePanel() : ui.openPanel(t.k))}
            title={t.l}
            className={`group relative grid h-9 w-9 place-items-center rounded-full transition-colors ${ui.panel === t.k ? "bg-ink text-white" : "text-ink-2 hover:bg-black/5"}`}
          >
            {t.icon}
            {!!badge[t.k] && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white ring-2 ring-white">{badge[t.k]}</span>
            )}
            <span className="pointer-events-none absolute right-0 top-11 whitespace-nowrap rounded-[8px] bg-ink px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {t.l}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
