"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BrandIcon } from "@/components/brands";
import { DAYS, EXTERNAL, TODAY } from "@/sim/data/calendar";
import { START_MIN, useSim } from "@/sim/store";
import type { CalEvent } from "@/sim/types";
import { Btn, Face, Section } from "../bits";
import { useUI } from "../ui";
import { nameOf } from "../who";

const H0 = 9;
const H1 = 17;
const PX = 46; // per hour

const KIND: Record<CalEvent["kind"], string> = {
  standup: "bg-[#eef0e8] text-[#4a5a3c] ring-[#d6dccb]",
  review: "bg-[#e8eefb] text-[#2c56b0] ring-[#c9d8f6]",
  ceo: "bg-[#f1eefd] text-[#4a3fa8] ring-[#d8d1f7]",
  request: "bg-[#fdf3e0] text-[#8a5a10] ring-[#f1d9a6] border border-dashed border-[#d99a2b]",
  external: "bg-[repeating-linear-gradient(135deg,#f0efed,#f0efed_6px,#e9e7e3_6px,#e9e7e3_12px)] text-muted ring-black/[0.06]",
  focus: "bg-[#fff4ec] text-[#a24d1f] ring-[#f3cfb6]",
  meeting: "bg-[#eaf6ee] text-[#24603a] ring-[#bfe2cb]",
};

const toMin = (t: string) => Number(t.split(":")[0]) * 60 + Number(t.split(":")[1]);

function EventDetail({ e, onClose }: { e: CalEvent; onClose: () => void }) {
  const { d } = useSim();
  const ui = useUI();
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="rounded-[18px] bg-white p-4 shadow-[var(--shadow-float)] ring-1 ring-black/[0.08]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[15px] font-semibold text-ink">{e.title}</div>
          <div className="text-[12px] text-muted">
            {DAYS[e.day]} · {e.start}–{e.end} · organised by {nameOf(e.organizer)}
            {e.source && ` · from ${e.source === "google" ? "Google" : "Apple"} Calendar`}
          </div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-ink">
          ✕
        </button>
      </div>
      <div className="mt-3 flex -space-x-1.5">
        {e.attendees.map((a) => (
          <span key={a} className="rounded-[10px] ring-2 ring-white" title={nameOf(a)}>
            <Face id={a} size={26} />
          </span>
        ))}
      </div>
      {e.agenda && (
        <div className="mt-3">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Agenda</div>
          <ol className="mt-1 list-decimal pl-4 text-[12.5px] text-ink-2">
            {e.agenda.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </div>
      )}
      {e.preread && (
        <div className="mt-3 rounded-[12px] bg-[#f6f5f2] p-3 text-[12.5px] text-ink-2">
          <span className="font-semibold text-ink">Pre-read: </span>
          {e.preread}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {e.status === "pending" ? (
          <>
            <Btn tone="dark" onClick={() => d({ type: "event", id: e.id, patch: { status: "confirmed" } })}>
              Accept
            </Btn>
            <Btn onClick={() => d({ type: "event", id: e.id, patch: { day: Math.min(4, e.day + 1), status: "confirmed" } })}>Tomorrow instead</Btn>
            <Btn
              tone="ghost"
              onClick={() => {
                d({ type: "event", id: e.id, patch: { status: "confirmed", kind: "meeting", title: `${e.title} (async)` } });
                onClose();
              }}
            >
              Make it async
            </Btn>
          </>
        ) : (
          e.kind !== "external" &&
          e.kind !== "focus" &&
          e.kind !== "standup" && (
            <>
              <Btn
                tone="dark"
                onClick={() => {
                  ui.closePanel();
                  ui.openWin({ kind: "meeting", id: e.id });
                }}
              >
                {e.conversationId && e.day < TODAY ? "Replay" : "Join in the meeting room"}
              </Btn>
              <Btn onClick={() => d({ type: "event", id: e.id, patch: { day: Math.min(4, e.day + 1) } })}>Move to next day</Btn>
            </>
          )
        )}
      </div>
    </motion.div>
  );
}

export function CalendarPanel({ initial }: { initial?: string }) {
  const { s, d } = useSim();
  const [open, setOpen] = useState<string | null>(initial && s.calendar.some((e) => e.id === initial) ? initial : null);
  const [connecting, setConnecting] = useState<"google" | "apple" | null>(null);
  const external = EXTERNAL.filter((e) => (e.source === "google" && s.connected.google) || (e.source === "apple" && s.connected.apple));
  const events = [...s.calendar, ...external].filter((e) => toMin(e.start) >= H0 * 60 - 60);
  const pending = s.calendar.filter((e) => e.status === "pending");
  const nowMin = START_MIN + s.clock;
  const openEv = [...s.calendar, ...external].find((e) => e.id === open);

  const connect = (src: "google" | "apple") => {
    setConnecting(src);
    setTimeout(() => {
      d({ type: "connect", source: src });
      setConnecting(null);
      d({ type: "toast", toast: { id: `cal-${src}`, who: "ada", text: `${src === "google" ? "Google" : "Apple"} Calendar connected. I'll schedule around your busy time.` } });
    }, 1400);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {(["google", "apple"] as const).map((src) => (
          <button
            key={src}
            disabled={s.connected[src] || connecting === src}
            onClick={() => connect(src)}
            className="flex items-center gap-2.5 rounded-[14px] bg-white p-3 text-left ring-1 ring-black/[0.06] hover:bg-[#fbfaf8] disabled:hover:bg-white"
          >
            {src === "google" ? <BrandIcon name="Google Calendar" size={20} /> : <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-[#ff3b30] text-[9px] font-bold text-white">31</span>}
            <span className="flex-1">
              <span className="block text-[12.5px] font-semibold text-ink">{src === "google" ? "Google Calendar" : "Apple Calendar"}</span>
              <span className="block text-[11px] text-muted">{s.connected[src] ? "Connected · ceo@bookwell.app" : connecting === src ? "Connecting…" : "Connect so Ada sees your busy time"}</span>
            </span>
            {s.connected[src] ? <span className="text-[12px] text-ok">✓</span> : <span className="text-[12px] font-semibold text-ink">Connect</span>}
          </button>
        ))}
      </div>

      {pending.length > 0 && (
        <Section title={`Meeting requests · ${pending.length}`}>
          {pending.map((e) => (
            <button key={e.id} onClick={() => setOpen(e.id)} className="flex w-full items-center gap-2.5 rounded-[14px] bg-[#fdf3e0] p-3 text-left ring-1 ring-[#f1d9a6]">
              <Face id={e.organizer} size={28} />
              <span className="flex-1">
                <span className="block text-[13px] font-semibold text-ink">{e.title}</span>
                <span className="block text-[11.5px] text-[#8a5a10]">
                  {DAYS[e.day]} {e.start} · requested by {nameOf(e.organizer)} · checked by Ada
                </span>
              </span>
              <span className="text-[12px] font-semibold text-ink">Review</span>
            </button>
          ))}
        </Section>
      )}

      <AnimatePresence>{openEv && <EventDetail key={openEv.id} e={openEv} onClose={() => setOpen(null)} />}</AnimatePresence>

      <div className="overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.06]">
        <div className="grid grid-cols-[34px_repeat(5,1fr)] border-b border-black/[0.06]">
          <div />
          {DAYS.map((x, i) => (
            <div key={x} className={`py-2 text-center text-[11.5px] font-semibold ${i === TODAY ? "text-accent" : "text-muted"}`}>
              {x}
              {i === TODAY && <span className="ml-1 rounded-full bg-accent px-1.5 text-[9.5px] text-white">today</span>}
            </div>
          ))}
        </div>
        <div className="relative grid grid-cols-[34px_repeat(5,1fr)]" style={{ height: (H1 - H0) * PX }}>
          <div className="relative">
            {Array.from({ length: H1 - H0 }, (_, i) => (
              <div key={i} className="absolute right-1 text-[10px] text-faint" style={{ top: i * PX - 6 }}>
                {H0 + i}
              </div>
            ))}
          </div>
          {DAYS.map((_, day) => (
            <div key={day} className={`relative border-l border-black/[0.05] ${day === TODAY ? "bg-[#fffaf6]" : ""}`}>
              {Array.from({ length: H1 - H0 }, (_, i) => (
                <div key={i} className="absolute inset-x-0 border-t border-black/[0.04]" style={{ top: i * PX }} />
              ))}
              {events
                .filter((e) => e.day === day)
                .map((e) => {
                  const top = ((toMin(e.start) - H0 * 60) / 60) * PX;
                  const h = Math.max(16, ((toMin(e.end) - toMin(e.start)) / 60) * PX - 2);
                  return (
                    <button
                      key={e.id}
                      onClick={() => setOpen(e.id)}
                      className={`absolute inset-x-0.5 overflow-hidden rounded-[6px] px-1 text-left text-[9.5px] font-semibold leading-tight ring-1 ${KIND[e.kind]}`}
                      style={{ top: Math.max(0, top), height: h }}
                      title={e.title}
                    >
                      {e.start} {e.title}
                    </button>
                  );
                })}
              {day === TODAY && nowMin < H1 * 60 && (
                <div className="absolute inset-x-0 z-10 h-0.5 bg-accent" style={{ top: ((nowMin - H0 * 60) / 60) * PX }}>
                  <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-accent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Section title="Ada's scheduling rules">
        <div className="flex flex-col gap-1.5 text-[12.5px] text-ink-2">
          {["Meetings default to 10 minutes, always with a pre-read", "Never during your focus time (13:30–15:00)", "Related requests are merged; small ones become inbox items", "Agents keep working until the meeting starts", "If you miss one, it goes to the top of your inbox"].map((r) => (
            <div key={r} className="flex gap-2 rounded-[10px] bg-white px-3 py-2 ring-1 ring-black/[0.05]">
              <span className="text-accent">•</span>
              {r}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
