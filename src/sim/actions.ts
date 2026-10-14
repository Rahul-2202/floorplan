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
