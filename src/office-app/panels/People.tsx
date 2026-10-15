"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { ROLE_TEMPLATES } from "@/sim/data/agents";
import { requestAgent } from "@/sim/actions";
import { can, canReach, isCeo, me } from "@/sim/people";
import { dmKey, roomName, useSim } from "@/sim/store";
import type { AgentRequest, OrgRules, Pending, Person, RoomKey } from "@/sim/types";
import { Btn, Empty, Face, Section, Segmented, Toggle } from "../bits";
import { AssignRoom, PRESENCE } from "../cards/PersonCard";
import { Icon } from "../icons";
import { useUI } from "../ui";
import { ReadBack } from "../windows/ReadBack";
import { nameOf } from "../who";

type Tab = "directory" | "invites" | "hierarchy" | "requests";

const ROOMS: RoomKey[] = ["dev", "marketing"];

function copy(text: string) {
  try {
    void navigator.clipboard?.writeText(text);
  } catch {
    /* clipboard blocked: the code is on screen anyway */
  }
}

function PersonRow({ p, open, onToggle }: { p: Person; open: boolean; onToggle: () => void }) {
  const { s } = useSim();
  const ui = useUI();
  const reach = canReach(s, p.id);
  const self = p.id === s.me;
  return (
    <div className={`rounded-[14px] ${open ? "bg-[#f6f5f2]" : ""}`}>
      <div className="flex items-center gap-2.5 px-2 py-2 hover:bg-[#f6f5f2] rounded-[14px]">
        <span className="relative">
          <Face id={p.id} size={32} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: PRESENCE[p.presence].c }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            {p.id === "you" ? "CEO" : p.full}
            {self && <span className="rounded bg-[#eef2fc] px-1 text-[9.5px] font-bold uppercase text-[#21409a]">You</span>}
            {p.role === "lead" && <span className="rounded bg-[#2b4fb8] px-1 text-[9px] font-bold uppercase text-white">Lead</span>}
          </div>
          <div className="truncate text-[11.5px] text-muted">
            {p.title} · {PRESENCE[p.presence].l}
          </div>
        </div>
        {!self && (
          <div className="flex gap-1">
            <button
              disabled={!reach.ok}
              title={reach.why}
              onClick={() => ui.openChat(dmKey(s.me, p.id))}
              className="rounded-full px-2 py-1 text-[11.5px] font-semibold text-ink-2 hover:bg-black/5 disabled:opacity-35"
            >
              Message
            </button>
            <button
              onClick={() => {
                ui.closePanel();
                ui.summon(p.id);
              }}
              className="rounded-full px-2 py-1 text-[11.5px] font-semibold text-ink-2 hover:bg-black/5"
            >
              Ask over
            </button>
            {can(s, "assignPeople") && p.role !== "ceo" && (
              <button onClick={onToggle} className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${open ? "bg-ink text-white" : "bg-[#2b4fb8] text-white"}`}>
                {p.room ? "Move" : "Assign"}
              </button>
            )}
          </div>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-2 pb-2">
            <AssignRoom id={p.id} onDone={onToggle} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Directory({ focus }: { focus?: string }) {
  const { s } = useSim();
  const [open, setOpen] = useState<string | null>(focus && can(s, "assignPeople") && s.people[focus]?.role !== "ceo" ? focus : null);
  const people = Object.values(s.people);
  const lobby = people.filter((p) => !p.room && p.role !== "ceo");
  const toggle = (id: string) => setOpen((v) => (v === id ? null : id));
  const rooms = [...ROOMS, ...s.extraRooms];
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[18px] bg-[linear-gradient(135deg,#eef2fc,#ffffff)] p-2 ring-1 ring-[#d5def5]">
        <PersonRow p={s.people.you} open={false} onToggle={() => {}} />
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Face id="ada" size={32} />
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink">Ada · office manager</div>
            <div className="text-[11.5px] text-muted">Assigns rooms with the CEO and reviews every agent request</div>
          </div>
        </div>
      </div>

      {lobby.length > 0 && (
        <Section title={`Lobby · ${lobby.length} waiting for a room`}>
          <div className="rounded-[18px] bg-white p-1.5 ring-1 ring-[#d5def5]">
            {lobby.map((p) => (
              <PersonRow key={p.id} p={p} open={open === p.id} onToggle={() => toggle(p.id)} />
            ))}
            {!can(s, "assignPeople") && <div className="px-2 pb-1.5 text-[11.5px] text-muted">The CEO or Ada assigns rooms to people who join with the office code.</div>}
          </div>
        </Section>
      )}

      {rooms.map((r) => {
        const inRoom = people.filter((p) => p.room === r).sort((a, b) => (a.role === "lead" ? -1 : b.role === "lead" ? 1 : 0));
        const cfg = r === "dev" || r === "marketing" ? s.rooms[r] : null;
        return (
          <Section key={r} title={`${roomName(r)} · ${inRoom.length} ${inRoom.length === 1 ? "person" : "people"}`}>
            <div className="rounded-[18px] bg-white p-1.5 ring-1 ring-black/[0.06]">
              {inRoom.length ? inRoom.map((p) => <PersonRow key={p.id} p={p} open={open === p.id} onToggle={() => toggle(p.id)} />) : <div className="px-2 py-2 text-[12px] text-muted">No people yet. Agents only.</div>}
              {cfg && (
                <div className="mx-2 mb-1 mt-1 flex items-center gap-2 rounded-[12px] bg-[#f6f5f2] px-2.5 py-2 text-[11.5px] text-ink-2">
                  <Face id={cfg.head} size={20} />
                  <span className="flex-1">
                    <b>{nameOf(cfg.head)}</b> + {cfg.members.length} agents · head reports to <b>{cfg.lead && cfg.reportsTo !== "ceo" ? nameOf(cfg.lead) : "the CEO"}</b>
                  </span>
                </div>
              )}
            </div>
          </Section>
        );
      })}

      {s.emailInvites.some((e) => e.status === "sent") && (
        <Section title="Invited, not joined yet">
          <div className="flex flex-col gap-1.5">
            {s.emailInvites
              .filter((e) => e.status === "sent")
              .map((e) => (
                <div key={e.id} className="flex items-center gap-2.5 rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-dashed ring-black/[0.08]">
                  <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#f2f0ec] text-[12px] font-bold text-muted">{e.name.charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-ink">{e.name}</div>
                    <div className="truncate text-[11.5px] text-muted">
                      {e.email} · to {roomName(e.room)} · by {nameOf(e.by)}, {e.at}
                    </div>
                  </div>
                  <span className="rounded-full bg-[#fdf3e0] px-2 py-0.5 text-[10.5px] font-bold text-[#8a5a10]">Invited</span>
                </div>
              ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function CodeCard({ code, title, sub, by, uses, max, expires, canManage, onRevoke }: { code: string; title: string; sub: string; by: string; uses: number; max: number; expires: string; canManage: boolean; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = `floorplan.app/join/${code}`;
  return (
    <div className="rounded-[18px] bg-white p-3.5 ring-1 ring-black/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-ink">{title}</div>
          <div className="text-[11.5px] text-muted">{sub}</div>
        </div>
        <span className="text-[11px] text-faint">
          {uses}/{max} used · {expires}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex-1 rounded-[12px] bg-[#f6f5f2] px-3 py-2">
          <div className="font-mono text-[15px] font-semibold tracking-[0.06em] text-ink">{code}</div>
          <div className="truncate text-[11px] text-muted">{url}</div>
        </div>
        <Btn
          tone="dark"
          onClick={() => {
            copy(`https://${url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </Btn>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11.5px] text-muted">
        <span>Created by {nameOf(by)}</span>
        {canManage && (
          <button onClick={onRevoke} className="font-semibold text-[#9b2c24] hover:underline">
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}

const rand = () => Math.random().toString(36).slice(2, 6);

function Invites() {
  const { s, d } = useSim();
  const office = s.invites.filter((i) => i.kind === "office" && !i.revoked);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState<string>(me(s).room ?? "lobby");
  const sendable = name.trim() && /.+@.+\..+/.test(email);
  const myRoom = me(s).room;
  const canOffice = can(s, "invite:office");

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Office invite code"
        right={
          canOffice && (
            <button
              onClick={() => d({ type: "addInvite", invite: { code: `BKW-${rand().toUpperCase()}`, kind: "office", role: "member", by: s.me, uses: 0, max: 10, expires: "in 7 days" } })}
              className="text-[12px] font-semibold text-ink hover:underline"
            >
              + New code
            </button>
          )
        }
      >
        {canOffice ? (
          <div className="flex flex-col gap-2">
            {office.map((i) => (
              <CodeCard key={i.code} code={i.code} title="Anyone with this joins the office" sub="They wait in the lobby until you or Ada assigns a room" by={i.by} uses={i.uses} max={i.max} expires={i.expires} canManage onRevoke={() => d({ type: "revokeInvite", code: i.code })} />
            ))}
            {!office.length && <Empty>No active office code. Create one to invite people.</Empty>}
          </div>
        ) : (
          <div className="rounded-[16px] bg-[#f6f5f2] px-3.5 py-3 text-[12.5px] text-muted">Only the CEO and Ada hand out the office code. You can invite people straight into {myRoom ? roomName(myRoom) : "a room"} with a room link{s.org.roomLinks === "leads" && me(s).role !== "lead" ? " (ask your lead)" : ""}.</div>
        )}
      </Section>

      <Section title="Room links">
        <div className="flex flex-col gap-2">
          {[...ROOMS, ...s.extraRooms].map((r) => {
            const links = s.invites.filter((i) => i.kind === "room" && i.room === r && !i.revoked);
            const allowed = can(s, "invite:room", r);
            return (
              <div key={r} className="flex flex-col gap-2">
                {links.map((i) => (
                  <CodeCard key={i.code} code={i.code} title={`Joins ${roomName(r)} directly`} sub={`As a ${i.role}, no lobby. The room lead is notified.`} by={i.by} uses={i.uses} max={i.max} expires={i.expires} canManage={allowed} onRevoke={() => d({ type: "revokeInvite", code: i.code })} />
                ))}
                {allowed && (
                  <button
                    onClick={() => d({ type: "addInvite", invite: { code: `${r.slice(0, 3)}-${rand()}`, kind: "room", room: r as RoomKey, role: "member", by: s.me, uses: 0, max: 5, expires: "in 14 days" } })}
                    className="flex items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-ink ring-1 ring-black/[0.08] hover:ring-black/20"
                  >
                    {Icon.link} Generate a {roomName(r)} link
                  </button>
                )}
              </div>
            );
          })}
          <div className="text-[11.5px] text-muted">{s.org.roomLinks === "leads" ? "Room leads and the CEO can generate links for their rooms." : "Only the CEO generates room links."}</div>
        </div>
      </Section>

      <Section title="Invite by email">
        <div className="flex flex-col gap-2 rounded-[18px] bg-white p-3 ring-1 ring-black/[0.06]">
          <div className="grid grid-cols-2 gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-10 rounded-[12px] bg-[#f6f5f2] px-3 text-[13px] outline-none ring-1 ring-black/[0.05] focus:ring-black/20" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="h-10 rounded-[12px] bg-[#f6f5f2] px-3 text-[13px] outline-none ring-1 ring-black/[0.05] focus:ring-black/20" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(canOffice ? ["lobby", ...ROOMS, ...s.extraRooms] : myRoom ? [myRoom] : []).map((r) => (
              <button key={r} onClick={() => setRoom(r)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${room === r ? "bg-ink text-white ring-ink" : "bg-white text-ink-2 ring-black/[0.08]"}`}>
                {r === "lobby" ? "Lobby (assign later)" : roomName(r)}
              </button>
            ))}
          </div>
          <Btn
            tone="dark"
            disabled={!sendable || (!canOffice && !can(s, "invite:room", myRoom))}
            onClick={() => {
              const id = `p-${name.trim().toLowerCase().replace(/\W+/g, "")}-${s.clock}`;
              const target = room === "lobby" ? null : room;
              d({ type: "emailInvite", invite: { id: `ei-${id}`, email: email.trim(), name: name.trim(), room: target, by: s.me, at: "just now", status: "sent" } });
              d({ type: "toast", toast: { id: `inv-${id}`, who: "ada", text: `Invite sent to ${name.trim()}. I'll let you know when they join.` } });
              const first = name.trim().split(/\s+/)[0];
              const person: Person = { id, name: first, full: name.trim(), title: target ? "New teammate" : "New joiner", role: "member", room: target, presence: "online", email: email.trim(), joined: "Thu just now", via: "email invite" };
              setTimeout(() => {
                d({ type: "addPerson", person, at: target ? (target === "dev" ? "dev:new" : target === "marketing" ? "mkt:new" : "hall:mid") : "lobby:2" });
                d({ type: "post", channel: "general", msg: { id: `j-${id}`, who: "ada", t: "now", agent: true, text: `${first} just joined${target ? ` ${roomName(target)}` : " and is in the lobby"}. Welcome! 👋` } });
                d({ type: "toast", toast: { id: `joined-${id}`, who: "ada", text: `${first} accepted the invite and walked in${target ? ` to ${roomName(target)}` : " to the lobby"}.`, action: { label: "People", panel: "people" } } });
              }, 5000);
              setName("");
              setEmail("");
            }}
          >
            Send invite
          </Btn>
          <div className="text-[11.5px] text-muted">Demo: they accept after a few seconds and walk in.</div>
        </div>
      </Section>
    </div>
  );
}

const RULES: { k: keyof OrgRules; l: string; d: string; opts?: { v: string; l: string }[] }[] = [
  { k: "roomEdit", l: "Who can change a room", d: "Spec, rules and board. Every change is versioned and the lead is told.", opts: [{ v: "room", l: "Everyone in it" }, { v: "lead", l: "Lead only" }] },
  { k: "memberReach", l: "Members can message", d: "Who people can DM directly.", opts: [{ v: "anyone", l: "Anyone" }, { v: "room+leads", l: "Room + leads" }, { v: "room", l: "Own room" }] },
  { k: "leadReach", l: "Leads can reach", d: "Leads talk to any person, room or agent.", opts: [{ v: "anyone", l: "Anyone" }, { v: "leads", l: "Other leads" }] },
  { k: "crossRoom", l: "New work for another room", d: "Questions go direct either way.", opts: [{ v: "lead", l: "Via its lead" }, { v: "anyone", l: "Anyone can assign" }] },
  { k: "roomLinks", l: "Room invite links", d: "Who can bring people straight into a room.", opts: [{ v: "leads", l: "Leads + CEO" }, { v: "ceo", l: "CEO only" }] },
  { k: "agentsInCalls", l: "Agents join calls and chats", d: "Mention an agent, or add it to a call, and it joins in." },
];

const LABEL = (k: keyof OrgRules, v: unknown) => (typeof v === "boolean" ? (v ? "on" : "off") : (RULES.find((r) => r.k === k)?.opts?.find((o) => o.v === v)?.l ?? String(v)).toLowerCase());

function Hierarchy() {
  const { s } = useSim();
  const [org, setOrg] = useState<OrgRules>(s.org);
  const [reports, setReports] = useState<Record<RoomKey, "lead" | "ceo">>({ dev: s.rooms.dev.reportsTo ?? "lead", marketing: s.rooms.marketing.reportsTo ?? "lead" });
  const [pending, setPending] = useState<Pending | null>(null);
  const editable = can(s, "org");
  const changes = [
    ...(Object.keys(org) as (keyof OrgRules)[]).filter((k) => org[k] !== s.org[k]).map((k) => `${RULES.find((r) => r.k === k)?.l}: ${LABEL(k, s.org[k])} → ${LABEL(k, org[k])}`),
    ...ROOMS.filter((r) => reports[r] !== (s.rooms[r].reportsTo ?? "lead")).map((r) => `${s.rooms[r].name}: the ${nameOf(s.rooms[r].head)} reports to ${reports[r] === "lead" ? nameOf(s.rooms[r].lead ?? "you") : "the CEO"}`),
  ];

  return (
    <div className="relative flex flex-col gap-5">
      {!editable && <div className="rounded-[14px] bg-[#f6f5f2] px-3.5 py-2.5 text-[12.5px] text-muted">View only. The CEO and Ada set the hierarchy.</div>}
      <Section title="Reporting lines">
        <div className="flex flex-col gap-2">
          {ROOMS.map((r) => {
            const cfg = s.rooms[r];
            const viaLead = reports[r] === "lead" && cfg.lead;
            return (
              <div key={r} className="rounded-[18px] bg-white p-3.5 ring-1 ring-black/[0.06]">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-ink">{cfg.name}</span>
                  {cfg.lead && (
                    <fieldset disabled={!editable}>
                      <Segmented size="sm" value={reports[r]} onChange={(v) => setReports({ ...reports, [r]: v })} options={[{ v: "lead", l: `To ${nameOf(cfg.lead)}` }, { v: "ceo", l: "To the CEO" }]} />
                    </fieldset>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <Node id={cfg.members[0]} label={`${cfg.members.length} agents`} stack={cfg.members} />
                  <Arrow />
                  <Node id={cfg.head} label={`${nameOf(cfg.head)} · head`} />
                  <Arrow />
                  {viaLead && (
                    <>
                      <Node id={cfg.lead!} label={`${nameOf(cfg.lead!)} · lead`} human />
                      <Arrow />
                    </>
                  )}
                  <Node id="you" label="CEO" human />
                </div>
                <div className="mt-2 text-[11.5px] text-muted">
                  {viaLead ? `Questions and blockers from the ${nameOf(cfg.head)} go to ${nameOf(cfg.lead!)}. Approvals under your locked rules still come to you.` : `The ${nameOf(cfg.head)} brings everything to you. ${cfg.lead ? `${nameOf(cfg.lead)} still owns the room.` : ""}`}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Rules for people">
        <fieldset disabled={!editable} className="flex flex-col gap-1 rounded-[18px] bg-white p-1.5 ring-1 ring-black/[0.06]">
          {RULES.map((r) => (
            <div key={r.k} className="flex items-center justify-between gap-3 rounded-[12px] px-2.5 py-2">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-ink">{r.l}</div>
                <div className="text-[11.5px] text-muted">{r.d}</div>
              </div>
              {r.opts ? (
                <Segmented size="sm" value={org[r.k] as string} onChange={(v) => setOrg({ ...org, [r.k]: v })} options={r.opts} />
              ) : (
                <Toggle on={org[r.k] as boolean} onChange={(v) => setOrg({ ...org, [r.k]: v })} disabled={!editable} />
              )}
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-[12px] px-2.5 py-2">
            <div>
              <div className="text-[13px] font-semibold text-ink">Adding agents</div>
              <div className="text-[11.5px] text-muted">Anyone can ask. Ada reviews, the CEO approves.</div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">🔒 Ada + CEO</span>
          </div>
        </fieldset>
      </Section>

      {editable && (
        <div className="sticky bottom-0 flex items-center justify-between rounded-[16px] bg-white/95 p-2.5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] backdrop-blur">
          <span className="pl-1 text-[12px] text-muted">{changes.length ? `${changes.length} change${changes.length > 1 ? "s" : ""}` : "Change anything above"}</span>
          <Btn
            tone="dark"
            disabled={!changes.length}
            onClick={() =>
              setPending({
                id: `org-${s.clock}`,
                summary: `Hierarchy: ${changes[0]}${changes.length > 1 ? ` +${changes.length - 1}` : ""}`,
                items: changes,
                apply: { org, rooms: Object.fromEntries(ROOMS.map((r) => [r, { reportsTo: reports[r] }])) },
              })
            }
          >
            Review changes
          </Btn>
        </div>
      )}

      <AnimatePresence>
        {pending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70]">
            <ReadBack pending={pending} onClose={() => setPending(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Node({ id, label, human, stack }: { id: string; label: string; human?: boolean; stack?: string[] }) {
  return (
    <div className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 ring-1 ${human ? "bg-[#eef2fc] ring-[#d5def5]" : "bg-[#f6f5f2] ring-black/[0.05]"}`}>
      {stack ? (
        <span className="flex -space-x-1.5">
          {stack.slice(0, 3).map((a) => (
            <span key={a} className="rounded-[8px] ring-2 ring-[#f6f5f2]">
              <Face id={a} size={20} />
            </span>
          ))}
        </span>
      ) : (
        <Face id={id} size={22} />
      )}
      <span className={`whitespace-nowrap text-[11.5px] font-semibold ${human ? "text-[#21409a]" : "text-ink-2"}`}>{label}</span>
    </div>
  );
}

const Arrow = () => <span className="shrink-0 text-[12px] text-faint">→</span>;

function Step({ label, state, note }: { label: string; state: "done" | "pending" | "declined" | "idle"; note?: ReactNode }) {
  const c = { done: "bg-ok text-white", pending: "bg-[#fdf3e0] text-[#8a5a10]", declined: "bg-[#fdecea] text-[#9b2c24]", idle: "bg-[#f2f0ec] text-faint" }[state];
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[10px] font-bold ${c}`}>{state === "done" ? "✓" : state === "declined" ? "✕" : "·"}</span>
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold text-ink">{label}</div>
        {note && <div className="text-[11.5px] leading-snug text-muted">{note}</div>}
      </div>
    </div>
  );
}

export function RequestCard({ r }: { r: AgentRequest }) {
  const { s, d } = useSim();
  const st = (v: AgentRequest["ada"]) => (v === "approved" ? "done" : v === "declined" ? "declined" : "pending");
  const done = !!r.hired || r.ceo === "declined" || r.ada === "declined";
  return (
    <div className={`rounded-[18px] bg-white p-3.5 ring-1 ${done ? "ring-black/[0.05]" : "ring-[#d5def5]"}`}>
      <div className="flex items-start gap-2.5">
        <Face id={r.by} size={30} />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-ink">
            {r.role} for {roomName(r.room)}
          </div>
          <div className="text-[11.5px] text-muted">
            Asked by {nameOf(r.by)} at {r.at} · “{r.why}”
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 pl-1">
        <Step label="Ada reviews it" state={st(r.ada)} note={r.adaNote ?? (r.ada === "pending" ? "Checking budget, overlap and permissions…" : undefined)} />
        <Step label="CEO approves" state={st(r.ceo)} note={r.ceo === "pending" ? "Waiting for the CEO" : r.ceo === "approved" ? "Approved" : "Declined"} />
        <Step label="Agent walks in" state={r.hired ? "done" : "idle"} note={r.hired ? `${nameOf(r.hired)} is in ${roomName(r.room)}` : undefined} />
      </div>
      {isCeo(s) && r.ceo === "pending" && (
        <div className="mt-3 flex gap-1.5 pl-9">
          <Btn tone="dark" className="!py-1 !text-[12px]" onClick={() => d({ type: "decideRequest", id: r.id, by: "ceo", decision: "approved" })}>
            Approve{r.ada === "pending" ? " (after Ada)" : " and hire"}
          </Btn>
          <Btn className="!py-1 !text-[12px]" onClick={() => d({ type: "decideRequest", id: r.id, by: "ceo", decision: "declined" })}>
            Decline
          </Btn>
        </div>
      )}
    </div>
  );
}

function Requests() {
  const { s, d } = useSim();
  const mine = me(s);
  const [role, setRole] = useState<string>(ROLE_TEMPLATES[0].role);
  const [room, setRoom] = useState<RoomKey>(mine.room === "marketing" ? "marketing" : "dev");
  const [why, setWhy] = useState("");
  const open = s.requests.filter((r) => !r.hired && r.ceo !== "declined" && r.ada !== "declined");
  const closed = s.requests.filter((r) => !open.includes(r));
  const canAsk = !!mine.room || mine.role === "ceo";
  return (
    <div className="flex flex-col gap-5">
      <Section title={`Open · ${open.length}`}>
        <div className="flex flex-col gap-2">{open.length ? open.map((r) => <RequestCard key={r.id} r={r} />) : <Empty>No open requests.</Empty>}</div>
      </Section>
      <Section title="Ask for an agent">
        {canAsk ? (
          <div className="flex flex-col gap-2.5 rounded-[18px] bg-white p-3 ring-1 ring-black/[0.06]">
            <div className="grid grid-cols-2 gap-1.5">
              {ROLE_TEMPLATES.map((t) => (
                <button
                  key={t.role}
                  onClick={() => {
                    setRole(t.role);
                    if (mine.role === "ceo") setRoom(t.room as RoomKey);
                  }}
                  className={`rounded-[12px] px-3 py-2 text-left text-[12.5px] font-semibold ring-1 ${role === t.role ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-black/[0.08]"}`}
                >
                  {t.role}
                </button>
              ))}
            </div>
            {mine.role === "ceo" ? (
              <Segmented size="sm" value={room} onChange={setRoom} options={[{ v: "dev", l: "Development" }, { v: "marketing", l: "Marketing" }]} />
            ) : (
              <div className="text-[12px] text-muted">For {roomName(mine.room)}, your room.</div>
            )}
            <textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Why does the room need it?" rows={2} className="resize-none rounded-[12px] bg-[#f6f5f2] px-3 py-2 text-[13px] outline-none ring-1 ring-black/[0.05] focus:ring-black/20" />
            <Btn tone="dark" onClick={() => {
              requestAgent(s, d, { role, room: mine.role === "ceo" ? room : (mine.room as RoomKey), why: why.trim() });
              setWhy("");
            }}>
              Send to Ada and the CEO
            </Btn>
          </div>
        ) : (
          <Empty>You can ask for agents once you&apos;re in a room.</Empty>
        )}
      </Section>
      {closed.length > 0 && (
        <Section title="Decided">
          <div className="flex flex-col gap-2 opacity-75">
            {closed.map((r) => (
              <RequestCard key={r.id} r={r} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

export function PeoplePanel({ initial }: { initial?: string }) {
  const { s } = useSim();
  const first = initial?.startsWith("person:") ? "directory" : ((initial as Tab) ?? "directory");
  const [tab, setTab] = useState<Tab>(["directory", "invites", "hierarchy", "requests"].includes(first) ? first : "directory");
  const openReq = s.requests.filter((r) => r.ceo === "pending" && !r.hired).length;
  return (
    <div className="flex flex-col gap-5">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { v: "directory", l: "People" },
          { v: "invites", l: "Invite" },
          { v: "hierarchy", l: "Hierarchy" },
          { v: "requests", l: `Agent requests${openReq ? ` · ${openReq}` : ""}` },
        ]}
      />
      {tab === "directory" && <Directory focus={initial?.startsWith("person:") ? initial.slice(7) : undefined} />}
      {tab === "invites" && <Invites />}
      {tab === "hierarchy" && <Hierarchy />}
      {tab === "requests" && <Requests />}
    </div>
  );
}
