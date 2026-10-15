"use client";

import { useState } from "react";
import { BrandChip } from "@/components/brands";
import { RuntimeBadge } from "@/components/ui";
import { NORMS } from "@/sim/data/rooms";
import { can, isCeo } from "@/sim/people";
import { clockLabel, dmKey, useSim } from "@/sim/store";
import type { Pending, RoomConfig, RoomKey, TaskState, WhenBlocked } from "@/sim/types";
import { Bar, Btn, Dot, Face, Section, Segmented, Window } from "../bits";
import { useUI } from "../ui";
import { nameOf, roleOf } from "../who";
import { MemCard } from "./MemoryWindow";
import { ReadBack } from "./ReadBack";

type Tab = "spec" | "rules" | "board" | "channel" | "memory" | "members";
const BLOCKED: Record<WhenBlocked, string> = { park: "Park and switch", guess: "Best guess, flag it", wait: "Stop and wait" };

function diffRoom(a: RoomConfig, b: RoomConfig): string[] {
  const out: string[] = [];
  if (a.dod !== b.dod) out.push(`Definition of done: “${b.dod}”`);
  if (a.responsibilities.join() !== b.responsibilities.join()) out.push("Responsibilities updated");
  if (a.whenBlocked !== b.whenBlocked) out.push(`When blocked: ${BLOCKED[b.whenBlocked].toLowerCase()}`);
  if (a.publishing !== b.publishing) out.push(b.publishing === "direct" ? "Agents can publish directly" : "Drafts go to you before anything public");
  if (a.merge !== b.merge) out.push(b.merge === "head" ? "The head can merge after review" : "Every merge needs your approval");
  if (a.budget !== b.budget) out.push(`Weekly budget: $${a.budget} → $${b.budget}`);
  if (a.convBudget !== b.convBudget) out.push(`Per-conversation limit: $${a.convBudget} → $${b.convBudget}`);
  return out;
}

const COLS: { k: string; l: string; states: TaskState[] }[] = [
  { k: "q", l: "Queued", states: ["queued"] },
  { k: "o", l: "Ongoing", states: ["ongoing"] },
  { k: "w", l: "Needs you", states: ["question", "blocked", "review"] },
  { k: "d", l: "Done", states: ["done"] },
];

export function RoomWindow({ id, tab: initial }: { id: RoomKey; tab?: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const [tab, setTab] = useState<Tab>((initial as Tab) ?? "spec");
  const base = s.rooms[id];
  const [r, setR] = useState<RoomConfig>(base);
  const [pending, setPending] = useState<Pending | null>(null);
  const [msg, setMsg] = useState("");
  const changes = diffRoom(base, r);
  const lockPublic = s.locked.find((l) => l.id === "lock-public")?.locked;
  const lockMerge = s.locked.find((l) => l.id === "lock-merge")?.locked;
  const convo = s.conversations.find((c) => c.id === (id === "dev" ? "c-dev" : "c-mkt"));
  const tasks = s.tasks.filter((t) => t.room === id);
  const editable = can(s, "editRoom", id);
  const people = Object.values(s.people).filter((p) => p.room === id).sort((a, b) => (a.role === "lead" ? -1 : b.role === "lead" ? 1 : 0));
  const lockedNote = s.people[s.me]?.room !== id ? `View only. You're not in ${base.name}.` : "View only. In this office only the lead changes rooms.";

  const save = () =>
    setPending({ id: `room-${id}-${s.clock}`, summary: `${base.name}: ${changes[0]}${changes.length > 1 ? ` +${changes.length - 1}` : ""}`, items: changes, apply: { rooms: { [id]: r } } });

  const post = () => {
    const text = msg.trim();
    if (!text || !convo) return;
    setMsg("");
    d({ type: "convo", id: convo.id, msg: { who: s.me, t: clockLabel(s.clock, false), text } });
    setTimeout(() => d({ type: "convo", id: convo.id, msg: { who: base.head, t: "now", text: "Thanks, noted. I'll fold it into today's plan and update the team." } }), 1800);
  };

  return (
    <Window
      width={720}
      onClose={ui.closeWin}
      icon={<Face id={base.head} size={32} />}
      title={`${base.name} room`}
      sub={`Head: ${nameOf(base.head)} · ${base.members.length + 1} agents · ${base.channel}`}
      footer={
        tab === "spec" || tab === "rules" ? (
          <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] px-4 py-3">
            <span className="text-[12px] text-muted">
              {!editable ? lockedNote : changes.length ? `${changes.length} unsaved change${changes.length > 1 ? "s" : ""}` : isCeo(s) ? "Edit anything here, no need to ask Ada" : base.lead && base.lead !== s.me ? `Anyone in the room can edit. ${nameOf(base.lead)} is told.` : "Edit anything here. Every change is versioned."}
            </span>
            <div className="flex gap-2">
              <Btn onClick={() => setR(base)} disabled={!changes.length}>
                Reset
              </Btn>
              <Btn tone="dark" onClick={save} disabled={!changes.length}>
                Review changes
              </Btn>
            </div>
          </div>
        ) : tab === "channel" ? (
          <form
            className="flex gap-2 border-t border-black/[0.06] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              post();
            }}
          >
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Message ${base.channel} (${nameOf(base.head)} is always copied)`} className="h-10 flex-1 rounded-full bg-[#f6f5f2] px-4 text-[13px] outline-none ring-1 ring-black/[0.06]" />
            <Btn tone="dark">Send</Btn>
          </form>
        ) : undefined
      }
    >
      <div className="flex gap-1 overflow-x-auto border-b border-black/[0.05] bg-[#fbfaf8] px-3 py-2">
        {(["spec", "rules", "board", "channel", "memory", "members"] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold capitalize ${tab === k ? "bg-ink text-white" : "text-ink-2 hover:bg-black/5"}`}>
            {k}
          </button>
        ))}
      </div>
      <div className="relative">
        <div className="max-h-[min(540px,60vh)] overflow-y-auto p-4">
          <fieldset disabled={!editable} className="contents">
          {tab === "spec" && (
            <div className="flex flex-col gap-5">
              <Section title="Responsibilities">
                <div className="flex flex-col gap-1.5">
                  {r.responsibilities.map((x, i) => (
                    <input
                      key={i}
                      value={x}
                      onChange={(e) => setR({ ...r, responsibilities: r.responsibilities.map((y, j) => (j === i ? e.target.value : y)) })}
                      className="h-10 rounded-[12px] bg-[#f6f5f2] px-3 text-[13px] outline-none ring-1 ring-black/[0.05] focus:ring-black/20"
                    />
                  ))}
                  <button onClick={() => setR({ ...r, responsibilities: [...r.responsibilities, ""] })} className="self-start text-[12.5px] font-semibold text-ink hover:underline">
                    + Add responsibility
                  </button>
                </div>
              </Section>
              <Section title="Definition of done">
                <input value={r.dod} onChange={(e) => setR({ ...r, dod: e.target.value })} className="h-10 w-full rounded-[12px] bg-[#f6f5f2] px-3 text-[13px] outline-none ring-1 ring-black/[0.05] focus:ring-black/20" />
              </Section>
              <Section title="Outputs">
                <div className="flex flex-wrap gap-1.5">
                  {r.outputs.map((o) => (
                    <span key={o} className="rounded-full bg-[#f2f0ec] px-2.5 py-1 text-[12.5px] font-semibold text-ink-2">
                      {o}
                    </span>
                  ))}
                </div>
              </Section>
              <Section title="Tools">
                <div className="flex flex-wrap gap-1.5">
                  {r.tools.map((t) => (
                    <BrandChip key={t} name={t} size="sm" />
                  ))}
                </div>
              </Section>
            </div>
          )}

          {tab === "rules" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-[16px] bg-[#f6f5f2] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-ink">When blocked</div>
                    <div className="text-[11.5px] text-muted">For gaps the spec didn&apos;t cover</div>
                  </div>
                  <Segmented
                    size="sm"
                    value={r.whenBlocked}
                    onChange={(v) => setR({ ...r, whenBlocked: v })}
                    options={[
                      { v: "park", l: "Park" },
                      { v: "guess", l: "Best guess" },
                      { v: "wait", l: "Wait" },
                    ]}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      Publishing {lockPublic && <span className="rounded-full bg-ink px-1.5 text-[10px] font-bold text-white">🔒 locked</span>}
                    </div>
                    <div className="text-[11.5px] text-muted">{lockPublic ? "Locked by you: drafts always come to you" : "Whether agents may post directly"}</div>
                  </div>
                  <Segmented
                    size="sm"
                    value={lockPublic ? "drafts" : r.publishing}
                    onChange={(v) => !lockPublic && setR({ ...r, publishing: v })}
                    options={[
                      { v: "drafts", l: "Drafts to you" },
                      { v: "direct", l: "Direct" },
                    ]}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      Merging to main {lockMerge && <span className="rounded-full bg-ink px-1.5 text-[10px] font-bold text-white">🔒 locked</span>}
                    </div>
                    <div className="text-[11.5px] text-muted">{lockMerge ? "Locked by you: every merge needs your approval" : "Who approves merges"}</div>
                  </div>
                  <Segmented
                    size="sm"
                    value={lockMerge ? "approval" : r.merge}
                    onChange={(v) => !lockMerge && setR({ ...r, merge: v })}
                    options={[
                      { v: "approval", l: "You approve" },
                      { v: "head", l: "Head approves" },
                    ]}
                  />
                </div>
              </div>
              <div className="rounded-[16px] bg-[#f6f5f2] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-ink">Weekly budget</div>
                  <span className="text-[13px] font-semibold">${r.budget}</span>
                </div>
                <input type="range" min={50} max={1000} step={10} value={r.budget} onChange={(e) => setR({ ...r, budget: Number(e.target.value) })} className="mt-2 w-full accent-[#0a0a0a]" />
                <div className="mt-1">
                  <Bar value={(base.spent / r.budget) * 100} color={base.spent / r.budget > 0.8 ? "#d99a2b" : "#3f9b5f"} />
                </div>
                <div className="mt-1 text-[11.5px] text-muted">Spent ${base.spent} this week</div>
                <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-3">
                  <div>
                    <div className="text-[13px] font-semibold text-ink">Per-conversation limit</div>
                    <div className="text-[11.5px] text-muted">Stops chatty threads from burning budget</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="range" min={5} max={60} value={r.convBudget} onChange={(e) => setR({ ...r, convBudget: Number(e.target.value) })} className="w-[120px] accent-[#0a0a0a]" />
                    <span className="w-10 text-right text-[13px] font-semibold">${r.convBudget}</span>
                  </div>
                </div>
              </div>
              <Section title="Communication norms (defaults)">
                <div className="flex flex-col gap-2">
                  {NORMS.map((n, i) => (
                    <div key={n.t} className="flex gap-2.5 rounded-[12px] bg-white p-3 ring-1 ring-black/[0.06]">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-[10.5px] font-bold text-white">{i + 1}</span>
                      <div>
                        <div className="text-[13px] font-semibold text-ink">{n.t}</div>
                        <div className="text-[12px] text-muted">{n.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          </fieldset>
          {tab === "board" && (
            <div className="grid grid-cols-4 gap-2.5">
              {COLS.map((c) => {
                const items = tasks.filter((t) => c.states.includes(t.state));
                return (
                  <div key={c.k} className="rounded-[14px] bg-[#f6f5f2] p-2">
                    <div className="mb-2 flex items-center justify-between px-1 text-[11.5px] font-bold uppercase tracking-wide text-faint">
                      {c.l} <span>{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {items.map((t) => (
                        <button key={t.id} onClick={() => ui.openWin({ kind: "task", id: t.id })} className="rounded-[10px] bg-white p-2 text-left ring-1 ring-black/[0.05] hover:ring-black/15">
                          <div className="font-mono text-[10.5px] text-faint">{t.key}</div>
                          <div className="text-[12px] font-semibold leading-snug text-ink">{t.title}</div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <Face id={t.owner} size={18} />
                            {t.state !== "done" && <span className="text-[10.5px] text-muted">{t.progress}%</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "channel" && convo && (
            <div className="flex flex-col gap-3">
              {convo.messages.map((m, i) => (
                <div key={i} className="flex gap-2.5">
                  <Face id={m.who} size={28} />
                  <div>
                    <div className="text-[12px]">
                      <span className="font-semibold text-ink">{nameOf(m.who)}</span> <span className="text-faint">{m.t}</span>
                    </div>
                    <div className="text-[13px] text-ink-2">{m.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "memory" && (
            <div className="flex flex-col gap-2">
              {s.memory
                .filter((m) => m.layer === `room:${id}`)
                .map((m) => (
                  <MemCard key={m.id} m={m} />
                ))}
            </div>
          )}

          {tab === "members" && (
            <div className="flex flex-col gap-2">
              {people.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-[14px] bg-[#eef2fc] p-3 ring-1 ring-[#d5def5]">
                  <Face id={p.id} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                      {p.id === s.me ? `${p.full} (you)` : p.full}
                      <span className="rounded bg-[#2b4fb8] px-1 text-[9px] font-bold uppercase text-white">{p.role === "lead" ? "Lead" : "Person"}</span>
                    </div>
                    <div className="truncate text-[12px] text-[#21409a]">
                      {p.title}
                      {p.role === "lead" && ` · the ${nameOf(base.head)} reports to ${p.name}`}
                    </div>
                  </div>
                  {p.id !== s.me && (
                    <>
                      <Btn
                        onClick={() => {
                          ui.closeWin();
                          ui.openChat(dmKey(s.me, p.id));
                        }}
                      >
                        Message
                      </Btn>
                      <Btn
                        tone="dark"
                        onClick={() => {
                          ui.closeWin();
                          ui.summon(p.id);
                        }}
                      >
                        Ask over
                      </Btn>
                    </>
                  )}
                </div>
              ))}
              {[base.head, ...base.members].map((m) => (
                <div key={m} className="flex items-center gap-3 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]">
                  <Face id={m} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                      {nameOf(m)} <Dot status={s.live[m]?.status ?? "idle"} />
                    </div>
                    <div className="truncate text-[12px] text-muted">
                      {roleOf(m)} · {s.live[m]?.step}
                    </div>
                  </div>
                  <RuntimeBadge runtime={s.configs[m]?.runtime} />
                  <Btn onClick={() => ui.openWin({ kind: "config", id: m })}>Config</Btn>
                  <Btn
                    tone="dark"
                    onClick={() => {
                      ui.closeWin();
                      ui.summon(m);
                    }}
                  >
                    Call
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </div>
        <ReadBack
          pending={pending}
          onClose={() => setPending(null)}
          onApplied={() => {
            if (base.lead && base.lead !== s.me && pending)
              d({ type: "addInbox", item: { id: `i-roomedit-${s.clock}-${s.me}`, kind: "fyi", from: s.me, title: `${s.people[s.me]?.name ?? "Someone"} changed ${base.name}`, sub: pending.items.slice(0, 2).join(" · "), priority: "low", at: clockLabel(s.clock, false), to: [base.lead] } });
          }}
        />
      </div>
    </Window>
  );
}
