"use client";

import { useMemo, useState } from "react";
import { CAST } from "@/office/layout";
import { findRoom, newTask } from "@/sim/intents";
import { can } from "@/sim/people";
import { clockLabel, useSim } from "@/sim/store";
import type { RoomKey, Task } from "@/sim/types";
import { Btn, Face, Segmented, Toggle, Window } from "../bits";
import { useUI } from "../ui";
import { nameOf } from "../who";

const EXAMPLES = ["Add a 'Book again' button to the confirmation email", "Write a launch-day thank-you email to pilot clinics", "Fix the slow slot search on clinics with 10+ therapists", "Draft an X thread about the launch"];

export function AssignWindow({ agent }: { agent?: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const presetRoom = agent ? ((CAST[agent]?.room === "marketing" ? "marketing" : "dev") as RoomKey) : undefined;
  const [title, setTitle] = useState("");
  const [roomPick, setRoomPick] = useState<RoomKey | undefined>(presetRoom);
  const guessed = useMemo(() => findRoom(title.toLowerCase()) ?? (/(post|tweet|thread|email|blog|video|copy|campaign|social)/i.test(title) ? "marketing" : /(fix|bug|api|button|deploy|test|page|search)/i.test(title) ? "dev" : undefined), [title]);
  const room: RoomKey = roomPick ?? guessed ?? "dev";
  const cfg = s.rooms[room];
  const [owner, setOwner] = useState<string | undefined>(agent);
  const who = owner && [cfg.head, ...cfg.members].includes(owner) ? owner : cfg.head;
  const [priority, setPriority] = useState<Task["priority"]>("P2");
  const [due, setDue] = useState("This week");
  const [dod, setDod] = useState("");
  const [linear, setLinear] = useState(true);

  const allowed = can(s, "assignTask", room);
  const from = s.me === "you" ? "the CEO" : (s.people[s.me]?.name ?? "the CEO");

  const submit = () => {
    if (!title.trim()) return;
    if (!allowed) {
      // New work for another room goes through its lead.
      const lead = cfg.lead ?? "you";
      d({ type: "addInbox", item: { id: `i-xroom-${s.clock}-${s.me}`, kind: "approval", from: s.me, title: `${from} asks ${cfg.name} for: ${title.trim()}`, sub: `${priority} · due ${due}. New work for your room comes through you.`, priority: "normal", at: clockLabel(s.clock, false), to: [lead] } });
      d({ type: "toast", toast: { id: `xr-${s.clock}`, who: lead, text: `Sent to ${nameOf(lead)}, ${cfg.name}'s lead. New work for their room goes through them.` } });
      ui.closeWin();
      return;
    }
    const t = newTask(s, title.trim(), room, who, "you", { priority, due, dod: dod || cfg.dod, step: "Waiting for the head to plan it" });
    d({ type: "addTask", task: t });
    const head = cfg.head;
    d({ type: "live", id: head, patch: { bubble: `New from ${from}: ${t.key}. Planning it.` } });
    d({ type: "toast", toast: { id: `as-${t.id}`, who: head, text: `Got it: ${t.key} ${t.title}${who !== head ? ` → ${nameOf(who)}` : ""}`, action: { label: "Dashboard", panel: "dashboard" } } });
    if (linear) d({ type: "convo", id: room === "dev" ? "c-dev" : "c-mkt", msg: { who: head, t: "now", text: `New from ${from}: ${t.key} ${t.title}. ${who !== head ? `Assigning to ${nameOf(who)}.` : "Planning it."}` } });
    // The head plans it, then the owner picks it up.
    setTimeout(() => {
      d({ type: "live", id: head, patch: { bubble: null } });
      d({ type: "task", id: t.id, patch: { state: "ongoing", step: "Reading the brief", progress: 5, updates: [...t.updates, { t: "now", who: head, text: `Planned and assigned to ${nameOf(who)}` }] } });
      const cur = s.live[who];
      d({ type: "live", id: who, patch: { upNext: [t.id, ...(cur?.upNext ?? [])], bubble: "Picked it up, starting after this step." } });
    }, 3500);
    setTimeout(() => d({ type: "live", id: who, patch: { bubble: null } }), 7500);
    ui.closeWin();
  };

  return (
    <Window
      width={580}
      onClose={ui.closeWin}
      title="Assign a task"
      sub={agent ? `To ${nameOf(agent)} · ${nameOf(cfg.head)} is copied` : "Work goes through the room's head"}
      footer={
        <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-4 py-3">
          <span className="flex items-center gap-2 text-[12px] text-muted">
            <Face id={allowed ? who : (cfg.lead ?? "you")} size={22} /> {!allowed ? `New work for ${cfg.name} goes through ${nameOf(cfg.lead ?? "you")}, its lead` : who === cfg.head ? `${nameOf(who)} will plan it into the room's work` : `${nameOf(who)} gets it, ${nameOf(cfg.head)} is copied`}
          </span>
          <Btn tone="dark" onClick={submit} disabled={!title.trim()}>
            {allowed ? "Assign" : `Send to ${nameOf(cfg.lead ?? "you")}`}
          </Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <div>
          <textarea
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="What needs doing?"
            className="h-24 w-full resize-none rounded-[16px] bg-[#f6f5f2] p-3.5 text-[15px] outline-none ring-1 ring-black/[0.06] focus:ring-black/20"
          />
          {!title && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((e) => (
                <button key={e} onClick={() => setTitle(e)} className="rounded-full bg-white px-2.5 py-1 text-[12px] text-ink-2 ring-1 ring-black/[0.08] hover:bg-[#f6f5f2]">
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-muted">
              Room {!roomPick && guessed && <span className="rounded-full bg-[#fff4ec] px-1.5 text-[10.5px] text-[#a24d1f]">suggested</span>}
            </div>
            <Segmented
              value={room}
              onChange={(v) => {
                setRoomPick(v);
                setOwner(undefined);
              }}
              options={[
                { v: "dev", l: "Development" },
                { v: "marketing", l: "Marketing" },
              ]}
            />
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-muted">Owner</div>
            <div className="flex flex-wrap gap-1">
              {[cfg.head, ...cfg.members].map((m) => (
                <button key={m} onClick={() => setOwner(m)} title={nameOf(m)} className={`rounded-[10px] p-0.5 ring-2 transition-all ${who === m ? "ring-ink" : "ring-transparent opacity-60 hover:opacity-100"}`}>
                  <Face id={m} size={28} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-muted">Priority</div>
            <Segmented
              value={priority}
              onChange={setPriority}
              options={[
                { v: "P1", l: "Urgent" },
                { v: "P2", l: "Normal" },
                { v: "P3", l: "Low" },
              ]}
            />
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-muted">Due</div>
            <select value={due} onChange={(e) => setDue(e.target.value)} className="h-9 rounded-full bg-[#f2f0ec] px-3 text-[12.5px] font-semibold outline-none">
              {["Today", "Tomorrow", "This week", "Next week"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-muted">Definition of done</div>
          <input value={dod} onChange={(e) => setDod(e.target.value)} placeholder={cfg.dod} className="h-10 w-full rounded-[12px] bg-[#f6f5f2] px-3 text-[13px] outline-none ring-1 ring-black/[0.06]" />
        </div>
        <label className="flex items-center justify-between rounded-[14px] bg-[#f6f5f2] px-3.5 py-2.5 text-[13px] text-ink-2">
          {room === "dev" ? "Create the ticket in Linear and post in #development" : "Add to the content calendar and post in #marketing"}
          <Toggle on={linear} onChange={setLinear} />
        </label>
      </div>
    </Window>
  );
}
