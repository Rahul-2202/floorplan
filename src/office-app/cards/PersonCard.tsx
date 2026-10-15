"use client";

import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { CAST } from "@/office/layout";
import { myPublic, relayCmd, toWire } from "@/live/LiveSync";
import { canReach, can, isCeo } from "@/sim/people";
import { dmKey, roomName, useSim, type Action, type SimState } from "@/sim/store";
import type { Person } from "@/sim/types";
import { Btn, Face, Segmented } from "../bits";
import { Icon } from "../icons";
import { useUI } from "../ui";
import { nameOf } from "../who";

export const PRESENCE: Record<Person["presence"], { l: string; c: string }> = {
  online: { l: "Online", c: "#3f9b5f" },
  call: { l: "On a call", c: "#7b6cd9" },
  focus: { l: "Focus time", c: "#d99a2b" },
  away: { l: "Away", c: "#c7c3bc" },
  offline: { l: "Offline", c: "#c7c3bc" },
};

export function PresenceChip({ p }: { p: Person }) {
  const st = PRESENCE[p.presence];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2fc] px-2.5 py-[3px] text-[11.5px] font-semibold text-[#21409a]">
      <span className="h-2 w-2 rounded-full" style={{ background: st.c }} /> {st.l}
    </span>
  );
}

/** "Lead · Development", "Member · Marketing", "Lobby". */
export function placeOf(p: Person) {
  if (p.role === "ceo") return "Runs the company";
  if (!p.room) return "In the lobby · waiting for a room";
  return `${p.role === "lead" ? "Lead" : "Member"} · ${roomName(p.room)}`;
}

function Action({ icon, label, note, onClick, disabled, title }: { icon: ReactNode; label: string; note?: string; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      disabled={disabled}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-2.5 rounded-[14px] px-2.5 py-1.5 text-left transition-colors hover:bg-[#f6f5f2] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#eef2fc] text-[#21409a]">{icon}</span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[13px] font-semibold text-ink">{label}</span>
        {note && <span className="block whitespace-nowrap text-[11px] text-muted">{note}</span>}
      </span>
    </button>
  );
}

/** Lets the CEO (or Ada) put someone from the lobby into a room. */
export function AssignRoom({ id, onDone }: { id: string; onDone?: () => void }) {
  const { s, d } = useSim();
  const rooms = ["dev", "marketing", ...s.extraRooms];
  const [room, setRoom] = useState<string>(rooms.includes("sales") ? "sales" : "marketing");
  const [role, setRole] = useState<"member" | "lead">("member");
  const p = s.people[id];
  return (
    <div className="flex flex-col gap-2 rounded-[16px] bg-[#f6f5f2] p-3">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">Give {p.name} a room</div>
      <div className="flex flex-wrap gap-1.5">
        {rooms.map((r) => (
          <button key={r} onClick={() => setRoom(r)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${room === r ? "bg-ink text-white ring-ink" : "bg-white text-ink-2 ring-black/[0.08] hover:ring-black/20"}`}>
            {roomName(r)}
          </button>
        ))}
        {!s.extraRooms.includes("sales") && (
          <span title="Add the Sales room first (Agents & teams → Add a room)" className="cursor-not-allowed rounded-full bg-white/60 px-3 py-1 text-[12px] font-semibold text-faint ring-1 ring-black/[0.05]">
            Sales · not set up
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Segmented size="sm" value={role} onChange={setRole} options={[{ v: "member", l: "Member" }, { v: "lead", l: "Lead" }]} />
        <Btn
          tone="dark"
          onClick={() => {
            d({ type: "assignPerson", id, room, role, by: s.me });
            if (p.real) relayCmd(s, { type: "assign", id, room, role }, [id]);
            d({ type: "toast", toast: { id: `as-${id}-${s.clock}`, who: "ada", text: `${p.name} is joining ${roomName(room)}${role === "lead" ? " as lead" : ""}. I've briefed the room.` } });
            onDone?.();
          }}
        >
          Assign
        </Btn>
      </div>
      {role === "lead" && (room === "dev" || room === "marketing") && (
        <div className="text-[11.5px] text-muted">
          {nameOf(s.rooms[room].head)} (agent head) will report to {p.name} instead of {s.rooms[room].lead ? nameOf(s.rooms[room].lead!) : "the CEO"}.
        </div>
      )}
    </div>
  );
}

/** Call someone: join their call, ring a real person, or start a 1:1 with a simulated one. */
export function callPerson(s: SimState, d: (a: Action) => void, id: string) {
  const p = s.people[id];
  const callKey = Object.keys(s.calls).find((k) => s.calls[k].people.includes(id));
  if (callKey) {
    if (!s.calls[callKey].people.includes(s.me)) d({ type: "joinCall", room: callKey, id: s.me });
    return;
  }
  const key = `p2p:${[s.me, id].sort().join("|")}`;
  if (p?.real) {
    d({ type: "joinCall", room: key, id: s.me, topic: `Calling ${p.name}…` });
    relayCmd(s, { type: "ring", call: toWire(s, key)!, from: myPublic(s) }, [id]);
    return;
  }
  d({ type: "joinCall", room: key, id: s.me, topic: `${nameOf(id)} and ${nameOf(s.me)}` });
  d({ type: "joinCall", room: key, id });
}

export function PersonCard({ id, summoned, onSendBack, onClose }: { id: string; summoned: boolean; onSendBack: () => void; onClose: () => void }) {
  const { s, d } = useSim();
  const ui = useUI();
  const p = s.people[id];
  const l = s.live[id];
  const [assigning, setAssigning] = useState(false);
  if (!p) return null;
  const reach = canReach(s, id);
  const room = p.room === "dev" || p.room === "marketing" ? s.rooms[p.room] : null;
  const agents = room ? [room.head, ...room.members] : [];
  const callKey = Object.keys(s.calls).find((k) => s.calls[k].people.includes(id));
  const inMyCall = callKey && s.calls[callKey].people.includes(s.me);
  const reportsTo = p.role === "member" && room?.lead ? room.lead : p.role === "lead" ? "you" : null;

  const startCall = () => {
    callPerson(s, d, id);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      data-tour="person-card"
      className="my-2 w-[400px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_60px_-16px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.06]"
    >
      <div className="flex items-center gap-3.5 bg-[linear-gradient(135deg,#eef2fc,#ffffff_70%)] px-5 pb-3.5 pt-4">
        <Face id={id} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{id === "you" ? "CEO" : p.full}</span>
            <span className="rounded-[5px] bg-[#2b4fb8] px-1.5 py-[2px] text-[9.5px] font-bold uppercase tracking-wide text-white">{p.role === "ceo" ? "CEO" : p.role === "lead" ? "Lead" : "Person"}</span>
            {p.real && <span className="rounded-[5px] bg-[#ff5a4f] px-1.5 py-[2px] text-[9.5px] font-bold uppercase tracking-wide text-white">Live</span>}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted">
            {p.title} · {placeOf(p)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <PresenceChip p={p} />
            {callKey && <span className="rounded-full bg-[#f1eefd] px-2.5 py-[3px] text-[11.5px] font-semibold text-[#4a3fa8]">{s.calls[callKey].topic}</span>}
          </div>
        </div>
        <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-muted hover:bg-black/5" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="mx-5 mt-1 rounded-[18px] bg-[#f6f5f2] px-4 py-3">
        <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">{p.role === "lead" ? "Their room" : p.role === "ceo" ? "Reports here" : "Reporting line"}</div>
        {p.role === "lead" && room ? (
          <>
            <div className="text-[13px] leading-snug text-ink-2">
              {room.reportsTo === "ceo" ? (
                <>The {nameOf(room.head)} reports to the CEO directly. {p.name} owns the room.</>
              ) : (
                <>
                  The <b className="text-ink">{nameOf(room.head)}</b> (agent head) reports to {p.name}. {p.name} reports to the CEO.
                </>
              )}
            </div>
            <div className="mt-2 flex -space-x-1">
              {agents.map((a) => (
                <span key={a} className="rounded-[9px] ring-2 ring-[#f6f5f2]" title={nameOf(a)}>
                  <Face id={a} size={22} />
                </span>
              ))}
            </div>
          </>
        ) : p.role === "ceo" ? (
          <div className="text-[13px] leading-snug text-ink-2">Ada and the room leads. Locked rules, agent requests and anything above a lead come here.</div>
        ) : !p.room ? (
          <div className="text-[13px] leading-snug text-ink-2">
            Joined with <span className="font-mono text-[12px]">{p.via}</span> at {p.joined.replace("Thu ", "")}. The CEO or Ada will assign a room.
          </div>
        ) : (
          <div className="text-[13px] leading-snug text-ink-2">
            Reports to <b className="text-ink">{reportsTo ? nameOf(reportsTo) : "the CEO"}</b>. Works with the {nameOf(room?.head ?? "pm")} and {agents.length - 1} other agents.
          </div>
        )}
        <div className="mt-2 border-t border-black/[0.06] pt-2 text-[12px] text-muted">Now: {l?.step ?? "—"}</div>
      </div>

      {assigning && (
        <div className="mx-5 mt-3">
          <AssignRoom id={id} onDone={() => setAssigning(false)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 px-5 pt-3">
        <button
          disabled={!reach.ok}
          title={reach.why}
          onClick={() => {
            ui.openChat(dmKey(s.me, id));
            onClose();
          }}
          className="flex items-center gap-3 rounded-[16px] bg-[#2b4fb8] px-3.5 py-2.5 text-left text-white hover:bg-[#22409a] disabled:opacity-40"
        >
          {Icon.chat}
          <span>
            <span className="block text-[13px] font-semibold">Message</span>
            <span className="block text-[11px] text-white/65">{reach.ok ? "Direct message" : reach.why}</span>
          </span>
        </button>
        <button onClick={startCall} className="flex items-center gap-3 rounded-[16px] bg-[#f6f5f2] px-3.5 py-2.5 text-left ring-1 ring-black/[0.05] hover:bg-[#efede8]">
          {Icon.video}
          <span>
            <span className="block text-[13px] font-semibold text-ink">{callKey ? (inMyCall ? "In the call" : "Join their call") : "Call"}</span>
            <span className="block text-[11px] text-muted">{callKey ? `${s.calls[callKey].people.length} on the call` : "Voice or video"}</span>
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 px-3 pb-3 pt-2.5">
        <Action
          icon={Icon.wave}
          label="Wave"
          note="A friendly nudge"
          onClick={() => {
            d({ type: "live", id: s.me, patch: { bubble: "👋" } });
            setTimeout(() => d({ type: "live", id, patch: { bubble: "👋 Hi!" } }), 700);
            setTimeout(() => {
              d({ type: "live", id: s.me, patch: { bubble: null } });
              d({ type: "live", id, patch: { bubble: null } });
            }, 3500);
          }}
        />
        {!p.room && p.role !== "ceo" && can(s, "assignPeople") ? (
          <Action icon={Icon.door} label="Assign a room" note="Member or lead" onClick={() => setAssigning((v) => !v)} />
        ) : room ? (
          <Action icon={Icon.board} label={`${room.name} room`} note="Spec, rules, members" onClick={() => ui.openWin({ kind: "room", id: room.id, tab: "members" })} />
        ) : (
          <Action icon={Icon.inbox} label="Inbox" note="What's waiting" onClick={() => ui.openPanel("inbox")} />
        )}
        <Action icon={Icon.people} label="In People" note="Directory and hierarchy" onClick={() => ui.openPanel("people", `person:${id}`)} />
        {p.role === "lead" && room ? (
          <Action icon={Icon.convo} label={`Talk to the ${nameOf(room.head)}`} note="Their agent head" onClick={() => ui.summon(room.head)} />
        ) : (
          <Action icon={Icon.convo} label="Room chat" note={p.room ? `#${p.room === "dev" ? "development" : p.room}` : "#general"} onClick={() => ui.openChat(p.room === "dev" || p.room === "marketing" ? `room:${p.room}` : "general")} />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-black/[0.06] bg-[#fbfaf8] px-5 py-2.5 text-[12px] text-muted">
        <span>{p.email}</span>
        {summoned ? (
          <button onClick={onSendBack} className="font-semibold text-ink hover:underline">
            Thanks, see you later
          </button>
        ) : (
          <span>{isCeo(s) || id === "you" ? `Joined ${p.joined}` : CAST[id]?.role}</span>
        )}
      </div>
    </motion.div>
  );
}
