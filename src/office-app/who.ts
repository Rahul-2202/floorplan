import { CAST, ROOMS, type CastMember } from "@/office/layout";
import type { Look } from "@/office/sprites";
import type { RoomId } from "@/office/types";
import type { SimState } from "@/sim/store";

const NEW_LOOKS: Look[] = [
  { skin: "#e8b48f", hair: "#4a3426", style: "curly", shirt: "#c9612f", pants: "#2f3440" },
  { skin: "#8d5a3b", hair: "#1a1513", style: "bun", shirt: "#3ba6c9", pants: "#34495e", glasses: true },
  { skin: "#f3cfb1", hair: "#e2b24c", style: "short", shirt: "#5b6cc9", pants: "#2b2f36" },
  { skin: "#c68a62", hair: "#2b2522", style: "pony", shirt: "#3f9b5f", pants: "#3a3340" },
];
const lookFor = (id: string) => NEW_LOOKS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % NEW_LOOKS.length];

/** Who you're playing; set by the office so names read right everywhere. */
let viewer = "you";
const extra: Record<string, { name: string; title: string }> = {};

/** Registers hired agents and new people so the office renderer can draw them. */
export function syncHires(s: SimState) {
  viewer = s.me;
  ROOMS.ceo.name = s.me === "you" ? "Your office" : "CEO's office";
  s.hires.forEach((h) => {
    if (!CAST[h.id]) CAST[h.id] = { id: h.id, name: h.name, role: h.role, room: h.room, runtime: h.runtime, look: h.look } as CastMember;
  });
  Object.values(s.people).forEach((p) => {
    extra[p.id] = { name: p.name, title: p.title };
    if (!CAST[p.id] && p.id !== "you") CAST[p.id] = { id: p.id, name: p.name, role: p.title, room: (p.room as RoomId) ?? "ceo", human: true, real: p.real, look: p.look ?? lookFor(p.id) };
  });
}

export const viewerId = () => viewer;
export const member = (id: string): CastMember | undefined => CAST[id];
export const nameOf = (id: string) => (id === viewer ? "You" : id === "you" ? "CEO" : (extra[id]?.name ?? CAST[id]?.name ?? id));
export const roleOf = (id: string) => (id === "you" ? "CEO" : (extra[id]?.title ?? CAST[id]?.role ?? ""));

export function roomAt(x: number, y: number): RoomId | null {
  for (const r of Object.values(ROOMS)) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.id;
  return null;
}

export const ROOM_LABEL: Record<string, string> = {
  get ceo() {
    return viewer === "you" ? "Your office" : "CEO's office";
  },
  dev: "Development",
  marketing: "Marketing",
  meeting: "Meeting room",
  sales: "Sales",
  legal: "Legal",
  finance: "Finance",
};
