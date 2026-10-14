import type { AgentScene, Camera, PropScene, RoomId, RoomState, Scene } from "@/office/types";
import type { FeedKind } from "@/components/feed/Feed";

export interface Ev {
  t: string;
  kind: FeedKind;
  who?: string;
  to?: string;
  text: string;
}

export type MemOp = "add" | "derive" | "supersede" | "flag" | "review" | "read" | "generate";

export interface Mem {
  layer: string;
  op: MemOp;
  text: string;
  who?: string;
  note?: string;
}

export interface ListItem {
  who?: string;
  brand?: string;
  title: string;
  sub?: string;
  tag?: string;
  tone?: "high" | "approve" | "fyi" | "ok" | "violet" | "warn";
  done?: boolean;
}

export type Ctx =
  | { kind: "chat"; title?: string; msgs: { from: "ada" | "you" | "system"; text: string }[] }
  | { kind: "list"; title: string; subtitle?: string; items: ListItem[]; footer?: string }
  | { kind: "kv"; title: string; subtitle?: string; who?: string; rows: [string, string][]; chips?: string[]; lock?: string }
  | { kind: "checklist"; title: string; subtitle?: string; items: { text: string; ok: boolean }[]; footer?: string; applied?: boolean }
  | { kind: "org" }
  | { kind: "preread" }
  | { kind: "meeting"; id: "sync" | "joint"; minutes?: boolean }
  | { kind: "code"; title: string; tabs: { name: string; lines: [string, string][] }[] }
  | { kind: "index" }
  | { kind: "versions"; rows: { v: string; text: string; who: string; state?: "current" | "reverted" }[]; footer?: string }
  | { kind: "stats" };

export interface ScenePatch {
  rooms?: Partial<Record<RoomId, RoomState>>;
  agents?: Record<string, (Partial<AgentScene> & { at?: AgentScene["at"] }) | null>;
  props?: Record<string, PropScene | null>;
  clearProps?: boolean;
  camera?: Camera | RoomId | RoomId[];
  board?: Scene["board"];
  locked?: RoomId[];
  roomNotes?: Scene["roomNotes"];
}

export interface DStep {
  ch: number;
  time: string;
  title: string;
  text: string;
  spec?: string[];
  aside?: string;
  scene?: ScenePatch;
  events?: Ev[];
  memory?: Mem[];
  ctx?: Ctx;
}

export interface Built {
  step: DStep;
  scene: Scene;
  ctx: Ctx;
  events: (Ev & { id: string })[];
}

/** Turns the list of patches into a full scene for every step. */
export function build(steps: DStep[], base: Scene): Built[] {
  const out: Built[] = [];
  let rooms = { ...base.rooms };
  let persistent: Record<string, { at: AgentScene["at"]; status?: AgentScene["status"] }> = {};
  Object.entries(base.agents).forEach(([id, a]) => a && (persistent[id] = { at: a.at, status: a.status }));
  let props: Record<string, PropScene> = {};
  let camera = base.camera;
  let board = base.board;
  let locked = base.locked ?? [];
  let roomNotes = base.roomNotes ?? {};
  let ctx: Ctx = { kind: "chat", msgs: [] };
  const events: (Ev & { id: string })[] = [];

  steps.forEach((st, i) => {
    const p = st.scene ?? {};
    if (p.rooms) rooms = { ...rooms, ...p.rooms };
    if (p.camera !== undefined) camera = p.camera;
    if (p.board) board = p.board;
    if (p.locked) locked = p.locked;
    if (p.roomNotes) roomNotes = { ...roomNotes, ...p.roomNotes };
    if (p.clearProps) props = {};
    if (p.props)
      Object.entries(p.props).forEach(([k, v]) => {
        if (v === null) delete props[k];
        else props[k] = v;
      });

    const agents: Record<string, AgentScene> = {};
    const next = { ...persistent };
    if (p.agents)
      Object.entries(p.agents).forEach(([id, a]) => {
        if (a === null) delete next[id];
        else next[id] = { at: a.at ?? next[id]?.at ?? "ada:home", status: a.status ?? next[id]?.status };
      });
    persistent = next;
    Object.entries(persistent).forEach(([id, a]) => {
      const patch = p.agents?.[id] ?? {};
      agents[id] = { ...patch, at: a.at, status: a.status } as AgentScene;
    });

    if (st.ctx) ctx = st.ctx;
    st.events?.forEach((e, k) => events.push({ ...e, id: `${i}-${k}` }));

    out.push({
      step: st,
      ctx,
      events: [...events],
      scene: { rooms: { ...rooms }, agents, props: { ...props }, camera, board, locked, roomNotes, labels: true },
    });
  });
  return out;
}
