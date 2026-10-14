"use client";

import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import type { Look } from "@/office/sprites";
import { CALENDAR } from "./data/calendar";
import { CONVERSATIONS } from "./data/conversations";
import { CONFIGS, LIVE } from "./data/agents";
import { INBOX } from "./data/inbox";
import { MEMORY } from "./data/memory";
import { OUTPUTS } from "./data/outputs";
import { LOCKED, ROOM_CONFIGS } from "./data/rooms";
import { TASKS } from "./data/tasks";
import { TIMELINE } from "./timeline";
import type {
  AgentConfig,
  AgentLive,
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
}

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

export function initialState(): SimState {
  const configs = clone(CONFIGS);
  const rooms = clone(ROOM_CONFIGS);
  const locked = clone(LOCKED);
  return {
    clock: 0,
    live: clone(LIVE),
    configs,
    rooms,
    locked,
    tasks: clone(TASKS),
    outputs: clone(OUTPUTS),
    calendar: clone(CALENDAR),
    connected: { google: false, apple: false },
    conversations: clone(CONVERSATIONS),
    memory: clone(MEMORY),
    inbox: clone(INBOX),
    toasts: [],
    versions: [
      { v: 12, at: "Wed 18:10", who: "You", summary: "Marketing budget raised to $150", changes: ["Marketing budget $120 → $150"], snapshot: { configs, rooms, locked } },
      { v: 11, at: "Tue 16:02", who: "Ada", summary: "DevOps first merge approved", changes: ["DevOps: merge to main stays 'needs approval'"], snapshot: { configs, rooms, locked } },
      { v: 10, at: "Mon 10:05", who: "Ada", summary: "Editor preference added", changes: ["CEO preference: never say \"excited\""], snapshot: { configs, rooms, locked } },
    ],
    pending: null,
    chats: {},
    hires: [],
    extraRooms: [],
    timelineAt: 0,
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
  | { type: "reset" };

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
  return { v: (s.versions[0]?.v ?? 0) + 1, at: clockLabel(s.clock), who, summary, changes, snapshot: { configs: clone(s.configs), rooms: clone(s.rooms), locked: clone(s.locked) } };
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
      let next: SimState = { ...s, configs, rooms, locked, pending: null };
      if (p.apply.hire) next = hireInto(next, p.apply.hire.id, p.apply.hire.room);
      return { ...next, versions: [versionOf(next, a.who ?? "You", p.summary, p.items), ...s.versions] };
    }
    case "rollback": {
      const target = s.versions.find((v) => v.v === a.v);
      if (!target) return s;
      const next = { ...s, configs: clone(target.snapshot.configs), rooms: clone(target.snapshot.rooms), locked: clone(target.snapshot.locked) };
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
  }
}

const KEY = "floorplan-office-v1";

function load(): SimState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SimState;
    return { ...s, toasts: [], pending: null };
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
    const saved = load();
    if (saved) d({ type: "hydrate", state: saved });
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...s, toasts: [] }));
    } catch {
      /* storage unavailable: the demo still works for this visit */
    }
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
