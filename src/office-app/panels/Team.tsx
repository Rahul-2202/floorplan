"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { RuntimeBadge } from "@/components/ui";
import { CAST, ROOMS } from "@/office/layout";
import { ROLE_TEMPLATES } from "@/sim/data/agents";
import { ROOM_TEMPLATES } from "@/sim/data/rooms";
import { EXTRA_ROOM_AGENTS, useSim } from "@/sim/store";
import type { Pending, RoomKey } from "@/sim/types";
import { Btn, Dot, Face, Section, Segmented } from "../bits";
import { useUI } from "../ui";
import { ReadBack } from "../windows/ReadBack";
import { nameOf, roleOf } from "../who";

function AgentRow({ id }: { id: string }) {
  const { s } = useSim();
  const ui = useUI();
  const l = s.live[id];
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] px-2 py-2 hover:bg-[#f6f5f2]">
      <Face id={id} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          {nameOf(id)}
          {CAST[id]?.head && <span className="rounded bg-ink px-1 text-[9px] font-bold uppercase text-white">Head</span>}
          <Dot status={l?.paused ? "away" : (l?.status ?? "idle")} />
        </div>
        <div className="truncate text-[11.5px] text-muted">{l?.step ?? roleOf(id)}</div>
      </div>
      <RuntimeBadge runtime={s.configs[id]?.runtime} />
      <div className="flex gap-1">
        <button onClick={() => ui.openWin({ kind: "config", id })} className="rounded-full px-2 py-1 text-[11.5px] font-semibold text-ink-2 hover:bg-black/5">
          Config
        </button>
        <button onClick={() => ui.openWin({ kind: "chat", id, mode: "queue" })} className="rounded-full px-2 py-1 text-[11.5px] font-semibold text-ink-2 hover:bg-black/5">
          Message
        </button>
        <button
          onClick={() => {
            ui.closePanel();
            ui.summon(id);
          }}
          className="rounded-full bg-ink px-2.5 py-1 text-[11.5px] font-semibold text-white"
        >
          Call
        </button>
      </div>
    </div>
  );
}

export function TeamPanel({ initial }: { initial?: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const [mode, setMode] = useState<"org" | "hire" | "room">(initial === "hire" ? "hire" : initial?.startsWith("add-room") ? "room" : "org");
  const [pending, setPending] = useState<Pending | null>(null);
  const [role, setRole] = useState<string>(ROLE_TEMPLATES[0].role);
  const [hireRoom, setHireRoom] = useState<RoomKey>("marketing");
  const [runtime, setRuntime] = useState<"Claude Code" | "Codex">("Claude Code");
  const roomFromRef = initial?.split(":")[1];
  const [newRoom, setNewRoom] = useState<string>(roomFromRef ?? "sales");

  const rooms = (["dev", "marketing"] as RoomKey[]).map((r) => s.rooms[r]);

  return (
    <div className="relative flex flex-col gap-5">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { v: "org", l: "Org chart" },
          { v: "hire", l: "Hire an agent" },
          { v: "room", l: "Add a room" },
        ]}
      />

      {mode === "org" && (
        <>
          <div className="rounded-[18px] bg-[linear-gradient(135deg,#fff4ec,#ffffff)] p-3 ring-1 ring-[#f3cfb6]">
            <div className="flex items-center gap-3">
              <Face id="you" size={36} />
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold text-ink">You · CEO</div>
                <div className="text-[11.5px] text-muted">Decides. Locked rules, approvals, meetings.</div>
              </div>
            </div>
            <div className="mt-2 border-t border-[#f3cfb6] pt-2">
              <AgentRow id="ada" />
            </div>
          </div>
          {rooms.map((r) => (
            <Section
              key={r.id}
              title={`${r.name} · ${r.members.length + 1} agents`}
              right={
                <button onClick={() => ui.openWin({ kind: "room", id: r.id, tab: "spec" })} className="text-[12px] font-semibold text-ink hover:underline">
                  Room settings →
                </button>
              }
            >
              <div className="rounded-[18px] bg-white p-1.5 ring-1 ring-black/[0.06]">
                <AgentRow id={r.head} />
                <div className="ml-6 border-l-2 border-black/[0.06] pl-1.5">
                  {r.members.map((m) => (
                    <AgentRow key={m} id={m} />
                  ))}
                </div>
              </div>
            </Section>
          ))}
          {s.extraRooms.map((rid) => (
            <Section key={rid} title={`${ROOMS[rid as keyof typeof ROOMS].name} · new`}>
              <div className="rounded-[18px] bg-white p-1.5 ring-1 ring-black/[0.06]">
                {(EXTRA_ROOM_AGENTS[rid] ?? []).map((m) => (
                  <AgentRow key={m} id={m} />
                ))}
              </div>
            </Section>
          ))}
        </>
      )}

      {mode === "hire" && (
        <div className="flex flex-col gap-4">
          <Section title="Role">
            <div className="grid grid-cols-2 gap-2">
              {ROLE_TEMPLATES.map((t) => (
                <button
                  key={t.role}
                  onClick={() => {
                    setRole(t.role);
                    setHireRoom(t.room as RoomKey);
                    setRuntime(t.runtime as "Claude Code" | "Codex");
                  }}
                  className={`rounded-[14px] p-3 text-left ring-1 transition-colors ${role === t.role ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-black/[0.08] hover:bg-[#f6f5f2]"}`}
                >
                  <div className="text-[13px] font-semibold">{t.role}</div>
                  <div className={`text-[11.5px] ${role === t.role ? "text-white/60" : "text-muted"}`}>{t.tools.join(", ")}</div>
                </button>
              ))}
            </div>
          </Section>
          <div className="grid grid-cols-2 gap-3">
            <Section title="Room">
              <Segmented
                size="sm"
                value={hireRoom}
                onChange={setHireRoom}
                options={[
                  { v: "dev", l: "Development" },
                  { v: "marketing", l: "Marketing" },
                ]}
              />
            </Section>
            <Section title="Runtime">
              <Segmented
                size="sm"
                value={runtime}
                onChange={setRuntime}
                options={[
                  { v: "Claude Code", l: "Claude Code" },
                  { v: "Codex", l: "Codex" },
                ]}
              />
            </Section>
          </div>
          <Btn
            tone="dark"
            className="!py-2.5"
            onClick={() =>
              setPending({
                id: `hire-${s.clock}`,
                summary: `Hire a ${role.toLowerCase()} into ${hireRoom === "dev" ? "Development" : "Marketing"}`,
                items: [`Add ${role} to ${hireRoom === "dev" ? "Development" : "Marketing"}, reporting to ${nameOf(s.rooms[hireRoom].head)}`, `Runtime: ${runtime}`, "Can't post publicly or merge to main", "Budget: $30 a week from the room's budget", "Memory set up from the room charter"],
                apply: { hire: { id: role.toLowerCase(), room: hireRoom } },
              })
            }
          >
            Review and hire
          </Btn>
          <div className="text-[12px] text-muted">Or just tell Ada: “Add a designer to marketing”.</div>
        </div>
      )}

      {mode === "room" && (
        <div className="flex flex-col gap-3">
          {ROOM_TEMPLATES.slice(0, 3).map((t) => {
            const key = t.name.toLowerCase();
            const built = s.extraRooms.includes(key);
            return (
              <button
                key={t.name}
                disabled={built}
                onClick={() => setNewRoom(key)}
                className={`rounded-[16px] p-3.5 text-left ring-1 transition-colors disabled:opacity-50 ${newRoom === key && !built ? "bg-ink text-white ring-ink" : "bg-white ring-black/[0.08] hover:bg-[#f6f5f2]"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold">{t.name}</span>
                  {built && <span className="text-[11.5px] font-semibold">✓ Set up</span>}
                </div>
                <div className={`mt-0.5 text-[12px] ${newRoom === key && !built ? "text-white/65" : "text-muted"}`}>
                  {t.head} (head) · {t.members.join(" · ")} · {t.tools.join(", ")}
                </div>
                <div className="mt-2 flex -space-x-1">
                  {(EXTRA_ROOM_AGENTS[key] ?? []).map((a) => (
                    <span key={a} className="rounded-[9px] ring-2 ring-white">
                      <Face id={a} size={22} />
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
          <Btn
            tone="dark"
            className="!py-2.5"
            disabled={s.extraRooms.includes(newRoom)}
            onClick={() => {
              const t = ROOM_TEMPLATES.find((x) => x.name.toLowerCase() === newRoom)!;
              setPending({
                id: `room-${newRoom}-${s.clock}`,
                summary: `Add a ${t.name} room`,
                items: [`Create ${t.name} with a ${t.head.toLowerCase()} as head`, `Hire ${t.members.join(" and ").toLowerCase()}`, `Tools: ${t.tools.join(", ")}`, "Drafts to you, nothing public without approval", "When blocked: park and switch"],
                apply: {},
              });
            }}
          >
            Review and set up
          </Btn>
          <div className="text-[12px] text-muted">Ada would normally interview you first. In this demo she uses the template.</div>
        </div>
      )}

      <AnimatePresence>
        {pending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70]">
            <ReadBack
              pending={pending}
              onApplied={() => {
                if (pending.id.startsWith("room-")) {
                  d({ type: "addRoom", room: newRoom });
                  d({ type: "toast", toast: { id: `nr-${newRoom}`, who: "ada", text: `The ${newRoom} room is open and the team is settling in.`, action: { label: "Team", panel: "team" } } });
                } else {
                  d({ type: "toast", toast: { id: `nh-${s.clock}`, who: "ada", text: "Your new hire is in. Go say hi!", action: { label: "Team", panel: "team" } } });
                }
              }}
              onClose={() => {
                const wasRoom = pending.id.startsWith("room-");
                setPending(null);
                setMode("org");
                if (wasRoom && s.extraRooms.includes(newRoom)) {
                  ui.closePanel();
                  ui.walkTo(ROOMS[newRoom as keyof typeof ROOMS].x + 4, ROOMS[newRoom as keyof typeof ROOMS].y + 9);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
