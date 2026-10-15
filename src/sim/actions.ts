import type { Action, SimState } from "./store";
import { clockLabel } from "./store";

type D = (a: Action) => void;

const FOLLOW: Record<string, (answer: string) => { step: string; bubble: string; memory?: string }> = {
  "t-154": (a) =>
    a.startsWith("I'll grant")
      ? { step: "Pointing bookwell.app at production", bubble: "Thanks! Switching DNS now." }
      : a.startsWith("Use the temp")
        ? { step: "Shipping on the temporary domain", bubble: "Going with the temporary domain." }
        : { step: "Parked until you decide", bubble: "No problem, I'll wait." },
  "t-m21": (a) => ({ step: `Finalising posts: ${a.toLowerCase()} tone`, bubble: "Thanks, finalising the posts.", memory: `Launch tone: ${a.toLowerCase()}` }),
};

export function answerQuestion(s: SimState, d: D, taskId: string, answer: string) {
  const t = s.tasks.find((x) => x.id === taskId);
  if (!t) return;
  const f = FOLLOW[taskId]?.(answer) ?? { step: "Continuing with your answer", bubble: "Thanks!" };
  const parked = answer.startsWith("Ask me later");
  d({ type: "task", id: taskId, patch: { state: parked ? "question" : "ongoing", question: parked ? t.question : undefined, blocker: undefined, step: f.step, progress: Math.min(95, t.progress + 10), updates: [...t.updates, { t: clockLabel(s.clock), who: "you", text: `Answered: ${answer}` }] } });
  d({ type: "live", id: t.owner, patch: { status: parked ? s.live[t.owner].status : "working", step: f.step, bubble: f.bubble } });
  setTimeout(() => d({ type: "live", id: t.owner, patch: { bubble: null } }), 4000);
  s.inbox.filter((i) => i.ref?.id === taskId).forEach((i) => d({ type: "inbox", id: i.id, patch: { resolved: !parked } }));
  if (f.memory)
    d({ type: "addMemory", item: { id: `m-pref-${s.clock}`, layer: "ceo", type: "preference", title: f.memory, body: "From your answer to the Strategist.", owner: "ada", status: "active", source: `Your answer, ${clockLabel(s.clock)}`, date: "Thu" } });
}

export function approveOutput(s: SimState, d: D, outputId: string) {
  const o = s.outputs.find((x) => x.id === outputId);
  if (!o) return;
  const merged = o.kind === "pr";
  d({ type: "output", id: o.id, patch: { status: merged ? "merged" : "approved", viewed: true } });
  if (o.taskId) {
    const t = s.tasks.find((x) => x.id === o.taskId);
    if (t) d({ type: "task", id: t.id, patch: { state: "done", progress: 100, step: merged ? "Merged" : "Approved by you", updates: [...t.updates, { t: clockLabel(s.clock), who: "you", text: merged ? "Approved the merge" : "Approved" }] } });
  }
  s.inbox.filter((i) => i.ref?.id === outputId).forEach((i) => d({ type: "inbox", id: i.id, patch: { resolved: true } }));
  d({ type: "live", id: o.by, patch: { bubble: merged ? "Merged ✓ Thanks!" : "Approved ✓ Scheduling it." } });
  setTimeout(() => d({ type: "live", id: o.by, patch: { bubble: null } }), 4000);
  d({ type: "toast", toast: { id: `ok-${o.id}`, who: o.by, text: merged ? `${o.title.split("·")[0].trim()} merged into main` : `${o.title} approved` } });
}

export function requestChanges(s: SimState, d: D, outputId: string, note: string) {
  const o = s.outputs.find((x) => x.id === outputId);
  if (!o) return;
  d({ type: "output", id: o.id, patch: { status: "changes", viewed: true } });
  if (o.taskId) {
    const t = s.tasks.find((x) => x.id === o.taskId);
    if (t) d({ type: "task", id: t.id, patch: { state: "ongoing", progress: Math.max(60, t.progress - 15), step: "Applying your notes", updates: [...t.updates, { t: clockLabel(s.clock), who: "you", text: `Requested changes: ${note}` }] } });
  }
  s.inbox.filter((i) => i.ref?.id === outputId).forEach((i) => d({ type: "inbox", id: i.id, patch: { resolved: true } }));
  d({ type: "live", id: o.by, patch: { status: "working", step: "Applying your notes", bubble: "On it, applying your notes." } });
  setTimeout(() => d({ type: "live", id: o.by, patch: { bubble: null } }), 4000);
}

/**
 * Anyone in a room can ask for a new agent. The request goes to Ada and the
 * CEO; Ada reviews it against the room's budget, then the CEO decides.
 */
export function requestAgent(s: SimState, d: D, req: { role: string; room: "dev" | "marketing"; why: string }) {
  const id = `req-${req.role.toLowerCase().replace(/\W+/g, "-")}-${s.clock}`;
  const by = s.me;
  const who = s.people[by]?.name ?? "Someone";
  const at = clockLabel(s.clock, false);
  const room = s.rooms[req.room];
  d({ type: "addRequest", req: { id, role: req.role, room: req.room, by, why: req.why || "More hands for the room's work.", at, ada: "pending", ceo: by === "you" ? "approved" : "pending" } });
  if (room.lead && room.lead !== by)
    d({ type: "addInbox", item: { id: `i-${id}-lead`, kind: "fyi", from: by, title: `${who} asked for a ${req.role} agent`, sub: "You're copied as the room lead. Ada reviews, then the CEO decides.", priority: "low", at, ref: { type: "request", id }, to: [room.lead] } });
  d({ type: "toast", toast: { id: `t-${id}`, who: "ada", text: `Got your ${req.role} request. Checking it against ${room.name}'s budget now.` } });
  setTimeout(() => {
    const left = room.budget - room.spent;
    d({ type: "decideRequest", id, by: "ada", decision: "approved", note: `${room.name} has $${left} left this week. I'd start at $25 a week, drafts only, and review it after a week.` });
    if (by !== "you") {
      d({ type: "addInbox", item: { id: `i-${id}`, kind: "approval", from: by, title: `Add a ${req.role} agent to ${room.name}`, sub: `Requested by ${who} · Ada approved · $25 a week`, priority: "normal", at: clockLabel(s.clock, false), ref: { type: "request", id }, to: ["you"] } });
      d({ type: "toast", toast: { id: `t2-${id}`, who: "ada", text: `I approved the ${req.role} request. It's with the CEO now.`, action: { label: "Requests", panel: "people", ref: "requests" } } });
    } else {
      d({ type: "toast", toast: { id: `t2-${id}`, who: "ada", text: `Approved on my side too. Your ${req.role} is walking in.`, action: { label: "Team", panel: "team" } } });
    }
  }, 2600);
  return id;
}
