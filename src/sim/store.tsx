"use client";

import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import type { Look } from "@/office/sprites";
import type { Pt } from "@/office/types";
import { CALENDAR } from "./data/calendar";
import { CONVERSATIONS } from "./data/conversations";
import { CONFIGS, LIVE } from "./data/agents";
import { INBOX } from "./data/inbox";
import { MEMORY } from "./data/memory";
import { OUTPUTS } from "./data/outputs";
import { CALLS, CHANNELS, EMAIL_INVITES, INVITES, NEW_SPOT, NEW_SPOT2, ORG, PEOPLE, PEOPLE_INBOX, PEOPLE_LIVE, REQUESTS } from "./data/people";
import { LOCKED, ROOM_CONFIGS } from "./data/rooms";
import { TASKS } from "./data/tasks";
import { TIMELINE } from "./timeline";
import type {
  AgentConfig,
  AgentLive,
  AgentRequest,
  EmailInvite,
  Invite,
  OrgRules,
  Person,
  PMsg,
  CalEvent,
  ChatMsg,
  Conversation,
  InboxItem,
  LockedRule,
  MemItem,
  Output,
  Pending,
  RoomConfig,
  RoomKey,
  Task,
  Toast,
  Version,
} from "./types";

export interface Hire {
  id: string;
  name: string;
  role: string;
  room: RoomKey;
  runtime: AgentConfig["runtime"];
  look: Look;
  spot: string;
}

export interface SimState {
  clock: number;
  live: Record<string, AgentLive>;
  configs: Record<string, AgentConfig>;
  rooms: Record<RoomKey, RoomConfig>;
  locked: LockedRule[];
  tasks: Task[];
  outputs: Output[];
  calendar: CalEvent[];
  connected: { google: boolean; apple: boolean };
  conversations: Conversation[];
  memory: MemItem[];
  inbox: InboxItem[];
  toasts: Toast[];
  versions: Version[];
  pending: Pending | null;
  chats: Record<string, ChatMsg[]>;
  hires: Hire[];
  extraRooms: string[];
  timelineAt: number;
  /** Who you're playing. "you" is the CEO. */
  me: string;
  people: Record<string, Person>;
  invites: Invite[];
  emailInvites: EmailInvite[];
  requests: AgentRequest[];
  org: OrgRules;
  /** "general" and "dm:a|b" threads. Room chat lives in conversations. */
  channels: Record<string, PMsg[]>;
  calls: Record<string, { people: string[]; agents: string[]; topic: string }>;
  /** Messages read, per "viewer|channel". */
  reads: Record<string, number>;
}

export const dmKey = (a: string, b: string) => `dm:${[a, b].sort().join("|")}`;

export const EXTRA_ROOM_AGENTS: Record<string, string[]> = {
  sales: ["lead", "sdr", "res"],
  legal: ["counsel", "reviewer", "para"],
  finance: ["ctrl", "book", "analyst"],
};

export const START_MIN = 9 * 60 + 40;

export function clockLabel(clock: number, withDay = true) {
  const m = START_MIN + clock;
  const h = Math.floor(m / 60) % 24;
  const mm = String(m % 60).padStart(2, "0");
  return `${withDay ? "Thu " : ""}${String(h).padStart(2, "0")}:${mm}`;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Everyone starts with older messages read; the newest few stay unread. */
function seedReads(convos: Conversation[]): Record<string, number> {
  const out: Record<string, number> = {};
  Object.keys(PEOPLE).forEach((pid) => {
    Object.entries(CHANNELS).forEach(([k, msgs]) => {
      if (k.startsWith("dm:") && !k.slice(3).split("|").includes(pid)) return;
      const n = msgs.filter((m) => m.who !== pid).length;
      out[`${pid}|${k}`] = Math.max(0, n - (k === "general" ? 2 : 1));
    });
    convos
      .filter((c) => c.id === "c-dev" || c.id === "c-mkt")
      .forEach((c) => (out[`${pid}|room:${c.id === "c-dev" ? "dev" : "marketing"}`] = c.messages.filter((m) => m.who !== pid).length));
  });
  return out;
}

export function initialState(): SimState {
  const configs = clone(CONFIGS);
  const base = clone(ROOM_CONFIGS);
  const rooms: Record<RoomKey, RoomConfig> = { dev: { ...base.dev, lead: "priya", reportsTo: "lead" }, marketing: { ...base.marketing, lead: "marco", reportsTo: "lead" } };
  const locked = clone(LOCKED);
  const org = { ...ORG };
  return {
    clock: 0,
    live: { ...clone(LIVE), ...clone(PEOPLE_LIVE) },
    configs,
    rooms,
    locked,
    tasks: clone(TASKS),
    outputs: clone(OUTPUTS),
    calendar: clone(CALENDAR),
    connected: { google: false, apple: false },
    conversations: clone(CONVERSATIONS),
    memory: clone(MEMORY),
    inbox: [...clone(PEOPLE_INBOX), ...clone(INBOX)],
    toasts: [],
    versions: [
      { v: 12, at: "Wed 18:10", who: "You", summary: "Marketing budget raised to $150", changes: ["Marketing budget $120 → $150"], snapshot: { configs, rooms, locked, org } },
      { v: 11, at: "Tue 16:02", who: "Ada", summary: "DevOps first merge approved", changes: ["DevOps: merge to main stays 'needs approval'"], snapshot: { configs, rooms, locked, org } },
      { v: 10, at: "Mon 10:05", who: "Ada", summary: "Editor preference added", changes: ["CEO preference: never say \"excited\""], snapshot: { configs, rooms, locked, org } },
    ],
    pending: null,
    chats: {},
    hires: [],
    extraRooms: [],
    timelineAt: 0,
    me: "you",
    people: clone(PEOPLE),
    invites: clone(INVITES),
    emailInvites: clone(EMAIL_INVITES),
    requests: clone(REQUESTS),
    org,
    channels: clone(CHANNELS),
    calls: clone(CALLS),
    reads: seedReads(CONVERSATIONS),
  };
}

export type Action =
  | { type: "tick" }
  | { type: "live"; id: string; patch: Partial<AgentLive> }
  | { type: "task"; id: string; patch: Partial<Task> }
  | { type: "addTask"; task: Task }
  | { type: "output"; id: string; patch: Partial<Output> }
  | { type: "event"; id: string; patch: Partial<CalEvent> }
  | { type: "addEvent"; event: CalEvent }
  | { type: "connect"; source: "google" | "apple" }
  | { type: "inbox"; id: string; patch: Partial<InboxItem> }
  | { type: "addInbox"; item: InboxItem }
  | { type: "toast"; toast: Toast }
  | { type: "dismissToast"; id: string }
  | { type: "chat"; agent: string; msg: ChatMsg }
  | { type: "chatPatch"; agent: string; id: string; patch: Partial<ChatMsg> }
  | { type: "propose"; pending: Pending }
  | { type: "applyPending"; who?: string }
  | { type: "cancelPending" }
  | { type: "rollback"; v: number }
  | { type: "memory"; id: string; patch: Partial<MemItem> }
  | { type: "addMemory"; item: MemItem }
  | { type: "convo"; id: string; msg: Conversation["messages"][number] }
  | { type: "addConvo"; convo: Conversation }
  | { type: "hire"; hire: Hire; config: AgentConfig }
  | { type: "addRoom"; room: string }
  | { type: "hydrate"; state: SimState }
  | { type: "reset" }
  | { type: "viewer"; id: string; at?: Pt }
  | { type: "person"; id: string; patch: Partial<Person> }
  | { type: "addPerson"; person: Person; at: string }
  | { type: "assignPerson"; id: string; room: string; role?: Person["role"]; by: string }
  | { type: "addInvite"; invite: Invite }
  | { type: "revokeInvite"; code: string }
  | { type: "emailInvite"; invite: EmailInvite }
  | { type: "addRequest"; req: AgentRequest }
  | { type: "decideRequest"; id: string; by: "ada" | "ceo"; decision: "approved" | "declined"; note?: string }
  | { type: "post"; channel: string; msg: PMsg }
  | { type: "read"; key: string; n: number }
  | { type: "joinCall"; room: string; id: string; topic?: string }
  | { type: "leaveCall"; room: string; id: string }
  | { type: "callAgent"; room: string; agent: string; on: boolean }
  | { type: "realUpsert"; person: Person; at: Pt; call: string | null }
  | { type: "realGone"; id: string };

const HIRE_LOOKS: Look[] = [
  { skin: "#e8b48f", hair: "#2b2522", style: "bob", shirt: "#3ba6c9", pants: "#2f3440", glasses: true },
  { skin: "#a86b48", hair: "#1a1513", style: "short", shirt: "#e0a43b", pants: "#3a4a63" },
  { skin: "#f3cfb1", hair: "#9c4a2c", style: "long", shirt: "#7b6cd9", pants: "#2b2f36" },
  { skin: "#c68a62", hair: "#2b2522", style: "curly", shirt: "#3f9b5f", pants: "#34495e" },
];

function hireInto(s: SimState, role: string, room: RoomKey): SimState {
  const n = s.hires.length;
  const pretty = role.replace(/\b\w/g, (c) => c.toUpperCase());
  const id = `hire${n + 1}`;
  const spot = room === "dev" ? (n % 2 ? "dev:huddleR" : "dev:huddleL") : n % 2 ? "mkt:beside-ed" : "mkt:brief";
  const hire: Hire = { id, name: pretty, role: pretty, room, runtime: "Claude Code", look: HIRE_LOOKS[n % HIRE_LOOKS.length], spot };
  const config: AgentConfig = {
    id,
    runtime: "Claude Code",
    model: "Sonnet 5.5",
    roleCard: `${pretty} in ${room === "dev" ? "Development" : "Marketing"}. Set up by Ada from your request.`,
    tools: room === "dev" ? ["GitHub", "Linear", "Slack"] : ["Google Docs", "Figma", "Slack"],
    permissions: { openPRs: room === "dev" ? "yes" : "no", mergeMain: "no", closeTickets: "yes", postPublic: "no", spend: "no", deploy: "no", emailCustomers: "no" },
    budget: 30,
    spent: 0,
    whenBlocked: s.rooms[room].whenBlocked,
    autonomy: 2,
    hours: "Always on",
  };
  return reducer(s, { type: "hire", hire, config });
}

function versionOf(s: SimState, who: string, summary: string, changes: string[]): Version {
  return { v: (s.versions[0]?.v ?? 0) + 1, at: clockLabel(s.clock), who, summary, changes, snapshot: { configs: clone(s.configs), rooms: clone(s.rooms), locked: clone(s.locked), org: clone(s.org) } };
}

const nowT = (s: SimState) => clockLabel(s.clock, false);

/** Puts someone in or out of a call, and keeps their status in step. */
function setCall(s: SimState, room: string, id: string, on: boolean, topic?: string): SimState {
  const cur = s.calls[room] ?? { people: [], agents: [], topic: topic ?? "Room call" };
  const people = on ? [...new Set([...cur.people, id])] : cur.people.filter((x) => x !== id);
  const calls = { ...s.calls, [room]: { ...cur, people, topic: topic ?? cur.topic, agents: people.length ? cur.agents : [] } };
  let live = s.live;
  if (s.people[id] && live[id]) live = { ...live, [id]: { ...live[id], status: on ? "meeting" : "idle" } };
  // Agents leave when the last person does.
  if (!people.length) cur.agents.forEach((a) => (live = { ...live, [a]: { ...live[a], status: "working" } }));
  return { ...s, calls, live };
}

export function reducer(s: SimState, a: Action): SimState {
  switch (a.type) {
    case "tick": {
      let next: SimState = { ...s, clock: s.clock + 1 };
      while (next.timelineAt < TIMELINE.length && TIMELINE[next.timelineAt].at <= next.clock) {
        next = TIMELINE[next.timelineAt].run(next);
        next = { ...next, timelineAt: next.timelineAt + 1 };
      }
      return next;
    }
    case "live":
      return { ...s, live: { ...s.live, [a.id]: { ...s.live[a.id], ...a.patch } } };
    case "task":
      return { ...s, tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, ...a.patch } : t)) };
    case "addTask":
      return { ...s, tasks: [a.task, ...s.tasks] };
    case "output":
      return { ...s, outputs: s.outputs.map((o) => (o.id === a.id ? { ...o, ...a.patch } : o)) };
    case "event":
      return { ...s, calendar: s.calendar.map((e) => (e.id === a.id ? { ...e, ...a.patch } : e)) };
    case "addEvent":
      return { ...s, calendar: [...s.calendar, a.event] };
    case "connect":
      return { ...s, connected: { ...s.connected, [a.source]: true } };
    case "inbox":
      return { ...s, inbox: s.inbox.map((i) => (i.id === a.id ? { ...i, ...a.patch } : i)) };
    case "addInbox":
      return { ...s, inbox: [a.item, ...s.inbox.filter((i) => i.id !== a.item.id)] };
    case "toast":
      return { ...s, toasts: [...s.toasts.filter((t) => t.id !== a.toast.id), a.toast].slice(-4) };
    case "dismissToast":
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case "chat":
      return { ...s, chats: { ...s.chats, [a.agent]: [...(s.chats[a.agent] ?? []), a.msg] } };
    case "chatPatch":
      return { ...s, chats: { ...s.chats, [a.agent]: (s.chats[a.agent] ?? []).map((m) => (m.id === a.id ? { ...m, ...a.patch } : m)) } };
    case "propose":
      return { ...s, pending: a.pending };
    case "cancelPending":
      return { ...s, pending: null };
    case "applyPending": {
      const p = s.pending;
      if (!p) return s;
      const configs = { ...s.configs };
      Object.entries(p.apply.configs ?? {}).forEach(([id, patch]) => (configs[id] = { ...configs[id], ...patch } as AgentConfig));
      const rooms = { ...s.rooms };
      Object.entries(p.apply.rooms ?? {}).forEach(([id, patch]) => (rooms[id as RoomKey] = { ...rooms[id as RoomKey], ...patch } as RoomConfig));
      const locked = p.apply.locked ?? s.locked;
      const org = { ...s.org, ...(p.apply.org ?? {}) };
      let next: SimState = { ...s, configs, rooms, locked, org, pending: null };
      if (p.apply.hire) next = hireInto(next, p.apply.hire.id, p.apply.hire.room);
      return { ...next, versions: [versionOf(next, a.who ?? "You", p.summary, p.items), ...s.versions] };
    }
    case "rollback": {
      const target = s.versions.find((v) => v.v === a.v);
      if (!target) return s;
      const next = { ...s, configs: clone(target.snapshot.configs), rooms: clone(target.snapshot.rooms), locked: clone(target.snapshot.locked), org: target.snapshot.org ? clone(target.snapshot.org) : s.org };
      return { ...next, versions: [versionOf(next, "You", `Rolled back to v${a.v}`, [`Restored configuration from v${a.v}`]), ...s.versions] };
    }
    case "memory":
      return { ...s, memory: s.memory.map((m) => (m.id === a.id ? { ...m, ...a.patch } : m)) };
    case "addMemory":
      return { ...s, memory: [a.item, ...s.memory] };
    case "convo":
      return { ...s, conversations: s.conversations.map((c) => (c.id === a.id ? { ...c, messages: [...c.messages, a.msg], at: clockLabel(s.clock) } : c)) };
    case "addConvo":
      return { ...s, conversations: [a.convo, ...s.conversations] };
    case "hire": {
      const room = s.rooms[a.hire.room];
      return {
        ...s,
        hires: [...s.hires, a.hire],
        configs: { ...s.configs, [a.hire.id]: a.config },
        rooms: { ...s.rooms, [a.hire.room]: { ...room, members: [...room.members, a.hire.id] } },
        live: { ...s.live, [a.hire.id]: { at: a.hire.spot, status: "idle", upNext: [], queued: 0, step: "Reading the room charter" } },
      };
    }
    case "addRoom": {
      if (s.extraRooms.includes(a.room)) return s;
      const ids = EXTRA_ROOM_AGENTS[a.room] ?? [];
      const live = { ...s.live };
      const configs = { ...s.configs };
      ids.forEach((id, i) => {
        live[id] = { at: `seat:${id}`, status: "idle", upNext: [], queued: 0, step: i === 0 ? "Writing the room charter with Ada" : "Reading the room charter" };
        configs[id] = {
          id,
          runtime: "Claude Code",
          model: i === 0 ? "Opus 5.5" : "Sonnet 5.5",
          roleCard: `Set up by Ada for the new ${a.room} room.`,
          tools: a.room === "sales" ? ["Gmail", "LinkedIn", "Slack"] : a.room === "legal" ? ["Google Docs", "Notion"] : ["Google Sheets", "Slack"],
          permissions: { openPRs: "no", mergeMain: "no", closeTickets: "yes", postPublic: "no", spend: "no", deploy: "no", emailCustomers: "approval" },
          budget: 40,
          spent: 0,
          whenBlocked: "park",
          autonomy: 2,
          hours: "Always on",
        };
      });
      return { ...s, extraRooms: [...s.extraRooms, a.room], live, configs };
    }
    case "hydrate":
      return { ...initialState(), ...a.state };
    case "reset":
      return initialState();

    case "viewer": {
      if (a.id === s.me) return s;
      // Whoever you were stays where you left them.
      const live = { ...s.live };
      if (a.at && live[s.me]) live[s.me] = { ...live[s.me], at: a.at };
      return { ...s, me: a.id, live, pending: null };
    }
    case "person":
      return { ...s, people: { ...s.people, [a.id]: { ...s.people[a.id], ...a.patch } } };
    case "addPerson":
      return {
        ...s,
        people: { ...s.people, [a.person.id]: { ...a.person, spot: a.person.spot ?? a.at } },
        live: { ...s.live, [a.person.id]: { at: a.at, status: "idle", upNext: [], queued: 0, step: a.person.room ? a.person.title : "In the lobby, waiting for a room" } },
        emailInvites: s.emailInvites.map((e) => (e.email === a.person.email ? { ...e, status: "joined" } : e)),
        // A newcomer starts with the backlog read; only what's new shows.
        reads: {
          ...s.reads,
          [`${a.person.id}|general`]: Math.max(0, (s.channels.general ?? []).length - 1),
          [`${a.person.id}|room:dev`]: s.conversations.find((c) => c.id === "c-dev")?.messages.length ?? 0,
          [`${a.person.id}|room:marketing`]: s.conversations.find((c) => c.id === "c-mkt")?.messages.length ?? 0,
        },
      };
    case "assignPerson": {
      const p = s.people[a.id];
      if (!p) return s;
      const role = a.role ?? p.role;
      let rooms = s.rooms;
      if (role === "lead" && (a.room === "dev" || a.room === "marketing")) rooms = { ...rooms, [a.room]: { ...rooms[a.room], lead: a.id, reportsTo: rooms[a.room].reportsTo ?? "lead" } };
      const taken = Object.entries(s.live)
        .filter(([id]) => id !== a.id)
        .map(([, l]) => l.at);
      const spot = taken.includes(NEW_SPOT[a.room]) && NEW_SPOT2[a.room] ? NEW_SPOT2[a.room] : (NEW_SPOT[a.room] ?? "hall:mid");
      // You walk there yourself (the office moves you); everyone else is placed.
      const live = { ...s.live, [a.id]: { ...s.live[a.id], at: spot, step: p.title } };
      const welcome: PMsg = { id: `assign-${a.id}-${s.clock}`, who: "ada", t: nowT(s), agent: true, text: `${p.name} is joining ${roomName(a.room)}${role === "lead" ? " as the lead" : ""}. Say hi! 👋` };
      return {
        ...s,
        rooms,
        live,
        people: { ...s.people, [a.id]: { ...p, room: a.room, role, spot } },
        inbox: s.inbox.map((i) => (i.ref?.type === "person" && i.ref.id === a.id ? { ...i, resolved: true } : i)),
        channels: { ...s.channels, general: [...(s.channels.general ?? []), welcome] },
      };
    }
    case "addInvite":
      return { ...s, invites: [a.invite, ...s.invites] };
    case "revokeInvite":
      return { ...s, invites: s.invites.map((i) => (i.code === a.code ? { ...i, revoked: true } : i)) };
    case "emailInvite":
      return { ...s, emailInvites: [a.invite, ...s.emailInvites] };
    case "addRequest":
      return { ...s, requests: [a.req, ...s.requests] };
    case "decideRequest": {
      const r = s.requests.find((x) => x.id === a.id);
      if (!r) return s;
      const nr: AgentRequest = { ...r, [a.by]: a.decision, ...(a.by === "ada" && a.note ? { adaNote: a.note } : {}) };
      let next: SimState = { ...s, requests: s.requests.map((x) => (x.id === a.id ? nr : x)) };
      if (a.by === "ceo") {
        const ok = a.decision === "approved";
        const note: InboxItem = {
          id: `i-reqdone-${r.id}`,
          kind: "fyi",
          from: "ada",
          title: ok ? `Approved: your ${r.role} is joining ${roomName(r.room)}` : `The CEO declined the ${r.role} request`,
          sub: ok ? "Ada set them up from the room charter. Go say hi." : "Ada can suggest another way to cover the work.",
          priority: "low",
          at: nowT(s),
          to: [r.by, ...(s.rooms[r.room]?.lead && s.rooms[r.room].lead !== r.by ? [s.rooms[r.room].lead!] : [])],
        };
        next = { ...next, inbox: [note, ...next.inbox.map((i) => (i.ref?.type === "request" && i.ref.id === a.id ? { ...i, resolved: true } : i))] };
      }
      if (nr.ada === "approved" && nr.ceo === "approved" && !nr.hired) {
        const before = next.hires.length;
        next = hireInto(next, nr.role.toLowerCase(), nr.room);
        const hired = next.hires[before]?.id;
        next = { ...next, requests: next.requests.map((x) => (x.id === a.id ? { ...x, hired } : x)) };
      }
      return next;
    }
    case "post":
      return { ...s, channels: { ...s.channels, [a.channel]: [...(s.channels[a.channel] ?? []), a.msg] } };
    case "read":
      return s.reads[a.key] === a.n ? s : { ...s, reads: { ...s.reads, [a.key]: a.n } };
    case "joinCall":
      return setCall(s, a.room, a.id, true, a.topic);
    case "leaveCall":
      return setCall(s, a.room, a.id, false);
    case "realUpsert": {
      const id = a.person.id;
      const prev = s.people[id];
      let next: SimState = {
        ...s,
        people: { ...s.people, [id]: { ...prev, ...a.person, real: true } },
        live: { ...s.live, [id]: { ...(s.live[id] ?? { upNext: [], queued: 0, status: "idle" }), at: a.at, step: a.person.title } },
      };
      // Follow their call.
      const was = Object.keys(next.calls).find((k) => next.calls[k].people.includes(id)) ?? null;
      if (was !== a.call) {
        if (was) next = setCall(next, was, id, false);
        if (a.call) next = setCall(next, a.call, id, true, next.calls[a.call]?.topic ?? (a.call.startsWith("p2p:") ? "Direct call" : `${roomName(a.call)} room`));
      }
      return next;
    }
    case "realGone": {
      const p = s.people[a.id];
      if (!p) return s;
      const live = { ...s.live };
      delete live[a.id];
      let next: SimState = { ...s, live, people: { ...s.people, [a.id]: { ...p, presence: "offline" } } };
      Object.keys(next.calls).forEach((k) => {
        if (next.calls[k].people.includes(a.id)) next = setCall(next, k, a.id, false);
      });
      // setCall may have restored a live entry; they're gone.
      const l2 = { ...next.live };
      delete l2[a.id];
      return { ...next, live: l2 };
    }
    case "callAgent": {
      const cur = s.calls[a.room];
      if (!cur) return s;
      const agents = a.on ? [...new Set([...cur.agents, a.agent])] : cur.agents.filter((x) => x !== a.agent);
      return { ...s, calls: { ...s.calls, [a.room]: { ...cur, agents } }, live: { ...s.live, [a.agent]: { ...s.live[a.agent], status: a.on ? "meeting" : "working" } } };
    }
  }
}

export const roomName = (r: string | null | undefined) =>
  r ? ({ dev: "Development", marketing: "Marketing", sales: "Sales", legal: "Legal", finance: "Finance", ceo: "the CEO's office", meeting: "the meeting room" } as Record<string, string>)[r] ?? r : "the lobby";

const KEY = "floorplan-office-v2";

/** Other real people are only here while connected: never saved as present. */
function forSave(s: SimState): SimState {
  const live = { ...s.live };
  const people = { ...s.people };
  Object.values(s.people).forEach((p) => {
    if (p.real && p.id !== s.me) {
      delete live[p.id];
      people[p.id] = { ...p, presence: "offline" };
    }
  });
  const calls = Object.fromEntries(Object.entries(s.calls).map(([k, c]) => [k, { ...c, people: c.people.filter((id) => !people[id]?.real || id === s.me) }]));
  return { ...s, live, people, calls, toasts: [] };
}

function load(): SimState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SimState;
    return { ...forSave(s), pending: null };
  } catch {
    return null;
  }
}

const Ctx = createContext<{ s: SimState; d: Dispatch<Action> } | null>(null);

export function SimProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, initialState);
  const loaded = useRef(false);

  // Restore after mount so server and client render the same first frame.
  useEffect(() => {
    // Once only: a second run would restore what the first save just wrote.
    if (loaded.current) return;
    const saved = load();
    if (saved) d({ type: "hydrate", state: saved });
    loaded.current = true;
  }, []);

  // Saved a moment after things settle (live positions change many times a second).
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(forSave(s)));
      } catch {
        /* storage unavailable: the demo still works for this visit */
      }
    }, 700);
    return () => clearTimeout(t);
  }, [s]);

  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>;
}

export function useSim() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSim outside SimProvider");
  return v;
}

export function clearSaved() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
