import type { AgentStatus, Pt } from "@/office/types";

export type RoomKey = "dev" | "marketing";
export type Runtime = "Claude Code" | "Codex";

export type TaskState = "queued" | "ongoing" | "blocked" | "question" | "review" | "done";

export interface TaskUpdate {
  t: string;
  who: string;
  text: string;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  room: RoomKey;
  owner: string;
  state: TaskState;
  progress: number;
  step?: string;
  priority: "P1" | "P2" | "P3";
  due: string;
  dod?: string;
  source: "you" | "linear" | "ada" | "head";
  updates: TaskUpdate[];
  question?: { text: string; options: string[] };
  blocker?: string;
  outputs?: string[];
  subtasks?: { title: string; done: boolean }[];
}

export interface AgentLive {
  at: Pt | string;
  status: AgentStatus;
  taskId?: string;
  step?: string;
  upNext: string[];
  paused?: boolean;
  bubble?: string | null;
  emote?: "!" | "?" | "✓" | "…" | "★" | null;
  /** Messages waiting for the next break point. */
  queued: number;
}

export type PermKey = "openPRs" | "mergeMain" | "closeTickets" | "postPublic" | "spend" | "deploy" | "emailCustomers";
export type PermLevel = "yes" | "approval" | "no";

export interface AgentConfig {
  id: string;
  runtime: Runtime;
  model: string;
  roleCard: string;
  tools: string[];
  permissions: Record<PermKey, PermLevel>;
  budget: number;
  spent: number;
  whenBlocked: WhenBlocked;
  /** 1 = asks about everything, 5 = acts on what you always approve. */
  autonomy: number;
  hours: string;
}

export type WhenBlocked = "park" | "guess" | "wait";

export interface RoomConfig {
  id: RoomKey;
  name: string;
  head: string;
  members: string[];
  responsibilities: string[];
  dod: string;
  outputs: string[];
  tools: string[];
  budget: number;
  spent: number;
  convBudget: number;
  whenBlocked: WhenBlocked;
  publishing: "drafts" | "direct";
  merge: "approval" | "head";
  norms: string[];
  channel: string;
}

export type OutputKind = "pr" | "ticket" | "post" | "video" | "report" | "design" | "blog" | "deploy";
export type OutputStatus = "review" | "approved" | "merged" | "closed" | "changes" | "shipped";

export interface Output {
  id: string;
  kind: OutputKind;
  title: string;
  by: string;
  room: RoomKey;
  at: string;
  status: OutputStatus;
  viewed: boolean;
  taskId?: string;
  summary: string;
  body?: string[];
  meta?: [string, string][];
}

export interface CalEvent {
  id: string;
  title: string;
  day: number; // 0 = Mon … 4 = Fri
  start: string;
  end: string;
  kind: "standup" | "review" | "ceo" | "request" | "external" | "focus" | "meeting";
  attendees: string[];
  organizer: string;
  status: "confirmed" | "pending";
  preread?: string;
  agenda?: string[];
  conversationId?: string;
  source?: "google" | "apple";
}

export interface Msg {
  who: string;
  text: string;
  t: string;
}

export interface Conversation {
  id: string;
  kind: "meeting" | "channel" | "dm" | "cross";
  title: string;
  participants: string[];
  at: string;
  room?: RoomKey;
  messages: Msg[];
  minutes?: { decision: string; why?: string; actions: { who: string; text: string }[]; open?: string[] };
  voice?: boolean;
}

export type MemLayer = "company" | "ceo" | "room:dev" | "room:marketing" | `agent:${string}`;

export interface MemItem {
  id: string;
  layer: MemLayer;
  type: "charter" | "decision" | "lesson" | "preference" | "note" | "timeline" | "scratch" | "role";
  title: string;
  body: string;
  owner: string;
  status: "active" | "superseded" | "stale";
  source: string;
  date: string;
  confidence?: "high" | "medium" | "low";
  supersededBy?: string;
}

export interface InboxItem {
  id: string;
  kind: "approval" | "question" | "meeting" | "escalation" | "fyi";
  from: string;
  title: string;
  sub: string;
  priority: "high" | "normal" | "low";
  at: string;
  ref?: { type: "task" | "output" | "event"; id: string };
  resolved?: boolean;
  batched?: boolean;
}

export interface Toast {
  id: string;
  who: string;
  text: string;
  action?: { label: string; panel: PanelKey; ref?: string };
}

export interface Version {
  v: number;
  at: string;
  who: string;
  summary: string;
  changes: string[];
  snapshot: { configs: Record<string, AgentConfig>; rooms: Record<RoomKey, RoomConfig>; locked: LockedRule[] };
}

export interface LockedRule {
  id: string;
  text: string;
  locked: boolean;
}

export type ChatFrom = "you" | "agent" | "system";
export interface ChatMsg {
  id: string;
  from: ChatFrom;
  text: string;
  t: string;
  card?: ChatCard;
  chips?: string[];
}

export type ChatCard =
  | { kind: "readback"; title: string; items: string[]; actionId: string; applied?: boolean; cancelled?: boolean }
  | { kind: "task"; taskId: string }
  | { kind: "event"; eventId: string }
  | { kind: "memory"; memId: string }
  | { kind: "list"; title: string; items: { who?: string; text: string; sub?: string }[] };

export type PanelKey =
  | "assign"
  | "dashboard"
  | "team"
  | "calendar"
  | "outputs"
  | "conversations"
  | "memory"
  | "inbox"
  | "governance"
  | "room";

export interface Pending {
  /** A change waiting for the CEO to confirm Ada's read-back. */
  id: string;
  summary: string;
  items: string[];
  apply: Partial<{
    configs: Record<string, Partial<AgentConfig>>;
    rooms: Partial<Record<RoomKey, Partial<RoomConfig>>>;
    locked: LockedRule[];
    hire: { id: string; room: RoomKey };
  }>;
}
