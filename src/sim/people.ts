import { CAST } from "@/office/layout";
import { adaReply, agentReply, type Reply } from "./intents";
import type { SimState } from "./store";
import type { InboxItem, Person, RoomKey } from "./types";

export const isHuman = (s: SimState, id: string) => !!s.people[id];
export const me = (s: SimState): Person => s.people[s.me] ?? s.people.you;
export const isCeo = (s: SimState) => s.me === "you";

export type Cap =
  | "governance"
  | "org"
  | "invite:office"
  | "invite:room"
  | "assignPeople"
  | "hireDirect"
  | "approveRequests"
  | "editRoom"
  | "assignTask"
  | "addRoom";

/** What the person you're playing is allowed to do. */
export function can(s: SimState, cap: Cap, room?: string | null): boolean {
  const p = me(s);
  if (p.role === "ceo") return true;
  switch (cap) {
    case "invite:room":
      return p.role === "lead" && s.org.roomLinks === "leads" && (!room || p.room === room);
    case "editRoom":
      return !!room && p.room === room && (p.role === "lead" || s.org.roomEdit === "room");
    case "assignTask":
      return !!p.room && (!room || room === p.room || p.role === "lead" || s.org.crossRoom === "anyone");
    default:
      return false;
  }
}

/** The room an agent works in. */
export const agentRoom = (id: string): RoomKey | null => {
  const r = CAST[id]?.room;
  return r === "dev" || r === "marketing" ? r : null;
};

/** The person an agent head reports to: its room's lead, or the CEO. */
export function reportsTo(s: SimState, room: RoomKey): string {
  const r = s.rooms[room];
  return r.lead && r.reportsTo !== "ceo" ? r.lead : "you";
}

/**
 * Who an inbox item is for. Questions and blockers from a room's agents go
 * to the room's lead when the head reports to them. Approvals covered by the
 * CEO's locked rules, meeting requests and Ada's notes stay with the CEO.
 */
export function recipients(s: SimState, i: InboxItem): string[] {
  if (i.to) return i.to;
  const room = agentRoom(i.from);
  if (room && (i.kind === "question" || i.kind === "escalation")) return [reportsTo(s, room)];
  return ["you"];
}

export function inboxFor(s: SimState, who = s.me) {
  const all = s.inbox.filter((i) => recipients(s, i).includes(who));
  // The CEO can see (and act on) what's been routed to the leads.
  const routed = who === "you" ? s.inbox.filter((i) => !i.resolved && !recipients(s, i).includes("you") && recipients(s, i).some((r) => s.people[r]?.role === "lead")) : [];
  return { all, open: all.filter((i) => !i.resolved), routed };
}

/** Whether the person you're playing can message someone directly. */
export function canReach(s: SimState, to: string): { ok: boolean; why?: string } {
  const p = me(s);
  const t = s.people[to];
  if (!t || p.role === "ceo" || to === "you" || to === s.me) return { ok: true };
  if (p.role === "lead") return s.org.leadReach === "anyone" || t.role === "lead" ? { ok: true } : { ok: false, why: "Leads can only message other leads" };
  if (!p.room) return { ok: true };
  if (s.org.memberReach === "anyone") return { ok: true };
  if (t.room === p.room) return { ok: true };
  if (s.org.memberReach === "room+leads" && t.role === "lead") return { ok: true };
  return { ok: false, why: `Messages to ${t.name} go through your lead` };
}

export const leadOf = (s: SimState, room: string | null | undefined) => (room === "dev" || room === "marketing" ? s.rooms[room].lead : undefined);

/* ----------------------------------------------------------------- replies */

const has = (t: string, ...w: string[]) => w.some((x) => t.includes(x));

const VOICE: Record<string, { hi: string; default: string[] }> = {
  you: { hi: "Hi! What do you need from me?", default: ["Thanks, I'll take a look.", "Good. Keep me posted.", "Makes sense. Go ahead."] },
  priya: { hi: "Hey! 👋 We're on the release checklist. What's up?", default: ["Makes sense. I'll loop in the PM.", "On it. I'll update the room.", "Good shout, adding it to today's plan."] },
  sam: { hi: "Hey! Reviewing PR #53 with Backend right now.", default: ["On it after this review.", "Sure, give me 10 minutes.", "Good idea. I'll pair with Frontend on it."] },
  marco: { hi: "Hi! Picking the launch visuals with Lena.", default: ["Love it. I'll check with the Strategist.", "Sounds good, I'll add it to the campaign plan.", "Let's do it. I'll brief the creators."] },
  lena: { hi: "Hi! In focus time until 10:30, but go ahead 🙂", default: ["Noted, I'll pick it up after focus time.", "Will do! Sending a draft by lunch.", "Yes, I can work with Creator on that."] },
  jordan: { hi: "Hi! 👋 Still finding my way around.", default: ["Thanks! Still learning where everything is 😅", "Happy to help with that.", "Got it, thanks!"] },
  nina: { hi: "Hi! Just got here 👋", default: ["Thanks! Getting set up.", "Sounds good.", "On it."] },
};

/** A scripted reply from a person, aware of what's going on in the office. */
export function personReply(id: string, raw: string, s: SimState): string {
  const t = raw.toLowerCase();
  const v = VOICE[id] ?? VOICE.jordan;
  const p = s.people[id];
  if (/^(hi|hey|hello|morning|yo)\b/.test(t)) return v.hi;
  if (has(t, "thank")) return "Anytime!";
  if (has(t, "dns")) return id === "priya" || id === "sam" ? "Still waiting on registrar access from the CEO. DevOps has everything else ready." : "No idea, ask Priya. Dev owns that one.";
  if (has(t, "call", "huddle", "join", "talk")) return s.calls[p?.room ?? ""]?.people.length ? `We're on a call in ${p?.room === "dev" ? "the Dev room" : "Marketing"}, come by!` : "Sure, walk over to my desk and we'll talk.";
  if (has(t, "agent", "hire", "request")) {
    const r = s.requests.find((x) => x.by === id) ?? s.requests[0];
    return r ? `The ${r.role} request: Ada ${r.ada === "approved" ? "approved it" : "is reviewing it"}, CEO ${r.ceo === "pending" ? "hasn't decided yet" : r.ceo}.` : "No open requests from me.";
  }
  if (has(t, "room", "team") && !p?.room) return "Waiting on the CEO or Ada to put me in a room.";
  if (has(t, "launch", "tomorrow", "release")) return id === "marco" || id === "lena" ? "Campaign's on track. Posts are with the CEO for approval." : "Six of eight checklist items done. DNS and the last regression run left.";
  return v.default[(raw.length + s.clock) % v.default.length];
}

/** Agents mentioned in a message, like "@PM" or "@ada". */
export function mentions(text: string): string[] {
  const out: string[] = [];
  const re = /@([a-z][a-z0-9]*)/gi;
  let m: RegExpExecArray | null;
  const alias: Record<string, string> = { pm: "pm", ada: "ada", frontend: "fe", fe: "fe", backend: "be", be: "be", devops: "ops", ops: "ops", tester: "qa", qa: "qa", strategist: "strat", strat: "strat", creator: "cr1", editor: "editor" };
  while ((m = re.exec(text))) {
    const k = m[1].toLowerCase();
    const id = alias[k] ?? (CAST[k] ? k : Object.values(CAST).find((c) => c.name.toLowerCase() === k)?.id);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/** An agent pulled into a people's thread or call: its reply, and what it does. */
export function agentAnswer(id: string, raw: string, s: SimState): Reply {
  const text = raw.replace(/@\w+/g, "").trim() || "status";
  if (id === "ada") {
    const r = adaReply(text, s);
    if (r.text.startsWith("I didn't catch")) return { text: "I'm here. Ask me about anyone's work, who's where, or tell me what to set up." };
    // Settings changes still need a read-back, in Ada's own chat.
    if (r.pending) return { text: `${r.pending.summary}: I'll need a confirmation for that. Open my chat and I'll read it back.` };
    return r;
  }
  const r = agentReply(id, text, s);
  // Open questions get a status update rather than a shrug.
  const vague = r.text.startsWith("Noted") || r.text.startsWith("Hi!");
  return vague && /\?|\b(where|how|what|status|update|left)\b/i.test(text) ? agentReply(id, "status", s) : r;
}

export const agentChime = (id: string, raw: string, s: SimState) => agentAnswer(id, raw, s).text;
