import { CAST, ROOMS, type CastMember } from "@/office/layout";
import type { RoomId } from "@/office/types";
import type { SimState } from "@/sim/store";

/** Registers hired agents so the office renderer can draw them. */
export function syncHires(s: SimState) {
  s.hires.forEach((h) => {
    if (!CAST[h.id]) CAST[h.id] = { id: h.id, name: h.name, role: h.role, room: h.room, runtime: h.runtime, look: h.look } as CastMember;
  });
}

export const member = (id: string): CastMember | undefined => CAST[id];
export const nameOf = (id: string) => (id === "you" ? "You" : (CAST[id]?.name ?? id));
export const roleOf = (id: string) => (id === "you" ? "CEO" : (CAST[id]?.role ?? ""));

export function roomAt(x: number, y: number): RoomId | null {
  for (const r of Object.values(ROOMS)) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.id;
  return null;
}

export const ROOM_LABEL: Record<string, string> = {
  ceo: "Your office",
  dev: "Development",
  marketing: "Marketing",
  meeting: "Meeting room",
  sales: "Sales",
  legal: "Legal",
  finance: "Finance",
};
