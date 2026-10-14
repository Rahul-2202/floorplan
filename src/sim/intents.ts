import { CAST } from "@/office/layout";
import { DAYS } from "./data/calendar";
import type { Action, SimState } from "./store";
import type { AgentConfig, ChatCard, Pending, RoomKey, Task } from "./types";

export interface Reply {
  text: string;
  card?: ChatCard;
  chips?: string[];
  /** Side effects run when the reply lands. */
  effect?: (d: (a: Action) => void, s: SimState) => void;
  /** Ask the world to do something (walk, summon, open a panel). */
  ui?: { summon?: string; panel?: [string, string?]; walk?: string };
  pending?: Pending;
}

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));
const lowerFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
const name = (id: string) => CAST[id]?.name ?? id;

const ROOM_WORDS: [RoomKey, string[]][] = [
  ["dev", ["dev", "development", "engineering", "engineers", "frontend", "backend", "devops", "tester", "qa", "pm"]],
  ["marketing", ["marketing", "creator", "editor", "strategist", "content", "social", "campaign"]],
];

const AGENT_WORDS: [string, string[]][] = [
  ["pm", ["pm", "product manager"]],
  ["fe", ["frontend", "front end", "front-end"]],
  ["be", ["backend", "back end", "back-end"]],
  ["ops", ["devops", "ops"]],
  ["qa", ["tester", "qa", "testing"]],
  ["strat", ["strategist"]],
  ["cr2", ["video", "creator 2"]],
  ["cr1", ["creator", "writer", "posts", "tweets", "linkedin"]],
  ["editor", ["editor", "blog"]],
];

export function findAgent(t: string): string | undefined {
  for (const [id, words] of AGENT_WORDS) if (words.some((w) => new RegExp(`\\b${w}\\b`).test(t))) return id;
}
export function findRoom(t: string): RoomKey | undefined {
  for (const [id, words] of ROOM_WORDS) if (words.some((w) => new RegExp(`\\b${w}\\b`).test(t))) return id;
}

let taskSeq = 160;
let mktSeq = 30;
export function newTask(s: SimState, title: string, room: RoomKey, owner: string, source: Task["source"], extra: Partial<Task> = {}): Task {
  const key = room === "dev" ? `BOOK-${taskSeq++}` : `MKT-${mktSeq++}`;
  return {
    id: `t-${key.toLowerCase()}-${s.clock}`,
    key,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    room,
    owner,
    state: "queued",
    progress: 0,
    priority: "P2",
    due: "Fri",
    source,
    updates: [{ t: "Thu now", who: source === "you" ? "you" : "ada", text: "Created" }],
    ...extra,
  };
}

/** The work a request asks for: strips the "ask marketing to" part. */
function workOf(t: string) {
  return t
    .replace(/^(please\s+)?(can you\s+|could you\s+)?(ask|tell|get|have)\s+(the\s+)?\w+(\s+team|\s+room)?\s+(to|for)\s+/i, "")
    .replace(/^(please\s+)?(assign|create a task( for)?|new task)\s*:?\s*/i, "")
    .replace(/[.?!]$/, "")
    .trim();
}

function parseDay(t: string): number | undefined {
  if (has(t, "today")) return 3;
  if (has(t, "tomorrow")) return 4;
  const idx = DAYS.findIndex((d) => t.includes(d.toLowerCase()));
  if (idx >= 0) return idx;
  const full = ["monday", "tuesday", "wednesday", "thursday", "friday"].findIndex((d) => t.includes(d));
  return full >= 0 ? full : undefined;
}

function parseTime(t: string): string | undefined {
  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!m) return undefined;
  let h = Number(m[1]);
  const mm = m[2] ?? "00";
  if (m[3] === "pm" && h < 12) h += 12;
  if (!m[3] && h < 8) h += 12;
  if (h > 23) return undefined;
  return `${String(h).padStart(2, "0")}:${mm}`;
}

const addMinutes = (hhmm: string, mins: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const tot = h * 60 + m + mins;
  return `${String(Math.floor(tot / 60)).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
};

export const ADA_CHIPS = ["What needs me today?", "What's blocking dev?", "Ask marketing for 3 launch tweets", "Move the video review to tomorrow 10am", "Give the tester merge rights for hotfixes", "What did we decide about SMS?"];

/* -------------------------------------------------------------------- Ada */

export function adaReply(raw: string, s: SimState): Reply {
  const t = raw.toLowerCase().trim();

  if (/^(hi|hey|hello|morning|good morning)\b/.test(t))
    return { text: "Morning! Launch is tomorrow. Three things need you today, and the readiness review is at 11:00.", chips: ["What needs me today?", "Summarise yesterday"] };

  if (has(t, "thank")) return { text: "Anytime." };

  if (has(t, "what can you", "help", "what do you do"))
    return {
      text: "I run the office for you. You can ask me to set up rooms and agents, change rules, book meetings, triage your inbox, or find anything the company remembers. Some things you can just say:",
      chips: ADA_CHIPS,
    };

  // briefing / inbox
  if (has(t, "needs me", "need me", "briefing", "inbox", "what's up", "whats up", "today")) {
    const open = s.inbox.filter((i) => !i.resolved && !i.batched);
    return {
      text: open.length ? `${open.length} things need you. I've put the launch blockers first:` : "Nothing needs you right now. I'll ping you if that changes.",
      card: open.length ? { kind: "list", title: "Needs you", items: open.map((i) => ({ who: i.from, text: i.title, sub: i.sub })) } : undefined,
      chips: ["Open my inbox", "What's blocking dev?"],
    };
  }
  if (has(t, "open my inbox", "show inbox")) return { text: "Opening your inbox.", ui: { panel: ["inbox"] } };

  // blockers
  if (has(t, "block", "stuck", "waiting on")) {
    const room = findRoom(t);
    const items = s.tasks.filter((x) => (x.state === "blocked" || x.state === "question") && (!room || x.room === room));
    return {
      text: items.length ? `${items.length} ${items.length === 1 ? "item is" : "items are"} waiting${room ? ` in ${room === "dev" ? "Development" : "Marketing"}` : ""}:` : "Nothing is blocked right now.",
      card: items.length ? { kind: "list", title: "Blocked or waiting on you", items: items.map((x) => ({ who: x.owner, text: `${x.key} ${x.title}`, sub: x.blocker ?? x.question?.text ?? x.step })) } : undefined,
      chips: ["Open the dashboard"],
    };
  }
  if (has(t, "dashboard")) return { text: "Here's the dashboard.", ui: { panel: ["dashboard"] } };

  // decisions / memory
  if (has(t, "decide", "decision", "remember", "why did we", "what did we")) {
    const q = t.replace(/what did we decide (about|on)|why did we|remind me|what was decided|about|\?/g, "").trim();
    const hit = s.memory.find((m) => m.status === "active" && m.type === "decision" && q.split(/\s+/).some((w) => w.length > 2 && (m.title + m.body).toLowerCase().includes(w))) ?? s.memory.find((m) => m.type === "decision" && m.status === "active");
    if (hit) return { text: `${hit.title}. ${hit.body}`, card: { kind: "memory", memId: hit.id }, chips: ["Open the decision log"] };
  }
  if (has(t, "decision log")) return { text: "Opening the decision log.", ui: { panel: ["memory", "decisions"] } };

  // yesterday / summary
  if (has(t, "yesterday", "summar", "recap", "what happened"))
    return {
      text: "Yesterday: staging went live, BOOK-142 Online booking and BOOK-151 closed, the launch plan moved to Friday, and Creator finished three LinkedIn drafts. Spend is $327 of $550 across both rooms. One open risk: production DNS.",
      chips: ["What needs me today?", "What's blocking dev?"],
    };

  // move / reschedule an event
  if (has(t, "move", "reschedule", "push")) {
    const STOP = new Set(["move", "reschedule", "push", "tomorrow", "today", "review", "meeting", "the", "with", "back", "later", "until"]);
    const words = t.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
    const scored = s.calendar
      .filter((e) => e.kind !== "standup" && e.kind !== "external")
      .map((e) => ({ e, n: words.filter((w) => e.title.toLowerCase().includes(w)).length }))
      .sort((a, b) => b.n - a.n);
    const ev =
      (scored[0]?.n ? scored[0].e : undefined) ??
      (has(t, "3pm", "15:00") ? s.calendar.find((e) => e.day === 3 && e.start === "15:00") : undefined) ??
      (has(t, "review") ? s.calendar.find((e) => e.status === "pending") : undefined);
    if (ev) {
      const day = parseDay(t) ?? ev.day;
      const start = parseTime(t.replace(/\b3pm\b(?=.*to)/, "")) ?? ev.start;
      const len = (() => {
        const [a, b] = [ev.start, ev.end].map((x) => Number(x.split(":")[0]) * 60 + Number(x.split(":")[1]));
        return b - a;
      })();
      return {
        text: `Moved “${ev.title}” to ${DAYS[day]} at ${start}. I've told ${ev.attendees.filter((a) => a !== "you" && a !== "ada").map(name).join(" and ")}.`,
        card: { kind: "event", eventId: ev.id },
        effect: (d) => d({ type: "event", id: ev.id, patch: { day, start, end: addMinutes(start, len), status: "confirmed" } }),
      };
    }
  }

  // schedule a meeting
  if (has(t, "schedule", "set up a meeting", "meeting with", "review with") || /\bbook (a|an) (meeting|call|review|sync|catch ?up)\b/.test(t)) {
    const people = AGENT_WORDS.filter(([, w]) => w.some((x) => t.includes(x))).map(([id]) => id);
    const day = parseDay(t) ?? 4;
    const start = parseTime(t) ?? "14:00";
    const attendees = ["you", "ada", ...new Set(people.length ? people : ["pm", "strat"])];
    const id = `ev-new-${s.clock}-${start}`;
    return {
      text: `Booked for ${DAYS[day]} at ${start}, in the meeting room. I'll send a pre-read the morning of.`,
      card: { kind: "event", eventId: id },
      effect: (d) =>
        d({
          type: "addEvent",
          event: { id, title: has(t, "review") ? "Review" : "Sync", day, start, end: addMinutes(start, 15), kind: "ceo", attendees, organizer: "ada", status: "confirmed", preread: "Ada will attach the pre-read." },
        }),
    };
  }

  // hire
  const ROLE = "(designer|analyst|engineer|writer|developer|tester|agent|marketer|researcher|editor|creator|specialist|manager|strategist|copywriter|sdr)";
  if ((/\bhire\b/.test(t) || new RegExp(`\\badd (a|an|another) [a-z ]{0,20}${ROLE}\\b`).test(t) || has(t, "new agent")) && !has(t, "room") && !/^(ask|tell|get|have)\b/.test(t)) {
    const room: RoomKey = findRoom(t) ?? (has(t, "design", "seo", "writer") ? "marketing" : "dev");
    const role = (t.match(/(?:hire|add)\s+(?:a|an|another)\s+([a-z ]+?)(?:\s+(?:to|for|in)\s+|$)/)?.[1] ?? "specialist").trim();
    const pretty = role.replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      text: `Here's how I'd set up a ${role} in ${room === "dev" ? "Development" : "Marketing"}. Confirm and they'll walk in.`,
      pending: {
        id: `hire-${s.clock}`,
        summary: `Hire a ${role} into ${room === "dev" ? "Development" : "Marketing"}`,
        items: [`Add ${pretty} to ${room === "dev" ? "Development" : "Marketing"}, reporting to ${room === "dev" ? "the PM" : "the Strategist"}`, "Runtime: Claude Code", "Can't post publicly or merge to main", `Budget: $30 a week from the room's budget`],
        apply: { hire: { id: role, room } },
      },
    };
  }

  // permissions
  if (has(t, "merge right", "permission", "allow", "let the", "give the", "grant")) {
    const who = findAgent(t) ?? "qa";
    const cfg = s.configs[who];
    const scoped = has(t, "hotfix");
    if (has(t, "merge")) {
      return {
        text: `Before I change anything, here's the read-back:`,
        pending: {
          id: `perm-${s.clock}`,
          summary: `${name(who)}: merge to main${scoped ? " (hotfixes only)" : ""}`,
          items: [`${name(who)} can merge to main${scoped ? " for hotfix branches only" : ""}`, "Each merge still needs passing checks", s.locked.find((l) => l.id === "lock-merge")?.locked ? "Your locked rule still applies: you approve every merge" : "No approval needed per merge"],
          apply: { configs: { [who]: { permissions: { ...cfg.permissions, mergeMain: "approval" } } as Partial<AgentConfig> } },
        },
      };
    }
  }

  // budgets
  if (has(t, "budget")) {
    const room = findRoom(t) ?? "marketing";
    const amt = Number(t.match(/\$?(\d{2,5})/)?.[1] ?? 0);
    if (amt) {
      const cur = s.rooms[room].budget;
      return {
        text: "Here's the read-back:",
        pending: { id: `budget-${s.clock}`, summary: `${room === "dev" ? "Development" : "Marketing"} budget $${cur} → $${amt}`, items: [`${room === "dev" ? "Development" : "Marketing"} weekly budget: $${cur} → $${amt}`, "Per-conversation limit unchanged", "Applies from now; this week's spend carries over"], apply: { rooms: { [room]: { budget: amt } } } },
      };
    }
    return { text: `Development has spent $${s.rooms.dev.spent} of $${s.rooms.dev.budget} this week, Marketing $${s.rooms.marketing.spent} of $${s.rooms.marketing.budget}.`, chips: ["Raise marketing's budget to $200"] };
  }

  // locks
  if (has(t, "stop all", "no public", "lock", "nobody posts")) {
    return {
      text: "Here's the read-back. Once locked, only you can change this, from the settings panel:",
      pending: {
        id: `lock-${s.clock}`,
        summary: "Lock: nobody posts publicly without your approval",
        items: ["Nobody posts publicly without your approval", "Locked: I can't change this from chat", "Scheduled posts become drafts waiting for you"],
        apply: { locked: s.locked.map((l) => (l.id === "lock-public" ? { ...l, locked: true } : l)) },
      },
    };
  }

  // assign work
  if (has(t, "ask ", "tell ", "get ", "have ", "assign", "new task", "create a task") && (findRoom(t) || findAgent(t))) {
    const room = findRoom(t) ?? (CAST[findAgent(t)!]?.room as RoomKey) ?? "dev";
    const owner = findAgent(t) ?? s.rooms[room].head;
    const head = s.rooms[room].head;
    const work = workOf(raw) || "new request";
    return {
      text: owner === head ? `Done. I've given it to ${name(head)}, who'll plan it into the room's work.` : `Done. It's with ${name(owner)}, and ${name(head)} is copied since it's new work for the room.`,
      effect: (d, st) => {
        const task = newTask(st, work, room, owner, "you");
        d({ type: "addTask", task });
        d({ type: "live", id: head, patch: { bubble: "New request from the CEO. Planning it." } });
        setTimeout(() => d({ type: "live", id: head, patch: { bubble: null } }), 4000);
        d({ type: "toast", toast: { id: `assign-${task.id}`, who: head, text: `Got it: ${task.key} ${task.title}`, action: { label: "Dashboard", panel: "dashboard" } } });
      },
      chips: ["Open the dashboard"],
    };
  }

  // call / bring someone
  if (has(t, "call ", "bring ", "come here", "send me")) {
    const who = findAgent(t);
    if (who) return { text: `Asking ${name(who)} to come over.`, ui: { summon: who } };
  }

  // room status
  const room = findRoom(t);
  if (room && has(t, "how", "status", "doing", "progress")) {
    const ts = s.tasks.filter((x) => x.room === room && x.state !== "done");
    return {
      text: `${room === "dev" ? "Development" : "Marketing"} has ${ts.length} open items: ${ts.filter((x) => x.state === "ongoing").length} in progress, ${ts.filter((x) => x.state === "review").length} waiting on review, ${ts.filter((x) => x.state === "question" || x.state === "blocked").length} blocked.`,
      card: { kind: "list", title: room === "dev" ? "Development" : "Marketing", items: ts.slice(0, 5).map((x) => ({ who: x.owner, text: `${x.key} ${x.title}`, sub: `${x.progress}% · ${x.step ?? x.state}` })) },
    };
  }

  return {
    text: "I didn't catch that one. Here are some things I can do right away:",
    chips: ADA_CHIPS,
  };
}

/* ----------------------------------------------------------------- agents */

export function agentChips(id: string, s: SimState) {
  const task = s.tasks.find((t) => t.id === s.live[id]?.taskId);
  return ["What are you working on?", "When will it be done?", "Anything blocking you?", task?.state === "review" ? "Show me the output" : "What's next?", "Remember: keep it short"];
}

export function agentReply(id: string, raw: string, s: SimState): Reply {
  const t = raw.toLowerCase();
  const l = s.live[id];
  const task = s.tasks.find((x) => x.id === l?.taskId);
  const head = CAST[id]?.head ? null : s.rooms[(CAST[id]?.room as RoomKey) ?? "dev"]?.head;

  if (/^(hi|hey|hello)\b/.test(t)) return { text: task ? `Hi! I'm on ${task.key}, ${task.title.toLowerCase()}. What do you need?` : "Hi! I'm free. What do you need?" };
  if (has(t, "thank")) return { text: "Happy to help. Back to it." };

  if (has(t, "working on", "doing", "status", "update", "progress"))
    return { text: task ? `${task.key} ${task.title}. I'm at ${task.progress}%: ${lowerFirst(l.step ?? task.step ?? "")}.${task.updates.length ? ` Last update: ${task.updates[task.updates.length - 1].text}` : ""}` : (l?.step ?? "Nothing assigned right now.") };

  if (has(t, "when", "eta", "done by", "finish"))
    return { text: task ? (task.state === "review" ? `It's done on my side. It's waiting for your review.` : `On track for ${task.due}. ${100 - task.progress > 30 ? "Most of the work is still ahead, but nothing worries me yet." : "Close now."}`) : "I don't have anything due." };

  if (has(t, "block", "stuck", "problem", "issue"))
    return { text: task?.blocker ? `Yes: ${task.blocker}` : task?.question ? `I need one answer from you: ${task.question.text}` : "Nothing blocking me right now." };

  if (has(t, "next", "after this", "queue"))
    return { text: l?.upNext.length ? `Next up: ${l.upNext.map((x) => s.tasks.find((y) => y.id === x)).filter(Boolean).map((x) => `${x!.key} ${x!.title}`).join(", ")}.` : "Nothing queued after this. Happy to take something." };

  if (has(t, "remember", "always", "never", "from now on", "prefer")) {
    const lesson = raw.replace(/^(please\s+)?(remember( that)?:?\s*)/i, "").trim();
    return {
      text: "Got it. I've saved that to my lessons, and my head will see it in review.",
      effect: (d, st) =>
        d({ type: "addMemory", item: { id: `m-${id}-${st.clock}`, layer: `agent:${id}`, type: "lesson", title: lesson.charAt(0).toUpperCase() + lesson.slice(1), body: "From your message.", owner: id, status: "active", source: "Your message, just now", date: "Thu", confidence: "high" } }),
    };
  }

  if (/\b(show|output|outputs|pr|draft|drafts|link)\b/.test(t)) return { text: "Opening what I've delivered.", ui: { panel: ["outputs", `by:${id}`] } };

  if (has(t, "pause", "stop")) return { text: "Pausing. My work is saved and I'll pick up exactly here.", effect: (d) => d({ type: "live", id, patch: { paused: true } }) };

  if (has(t, "can you", "please", "could you", "need you to", "make", "build", "write", "fix", "add")) {
    const work = raw.replace(/^(can you|could you|please|i need you to)\s+/i, "").replace(/[?.!]$/, "");
    const room = (CAST[id]?.room as RoomKey) ?? "dev";
    return {
      text: head ? `Sure. That's new work, so I've logged it and copied ${name(head)}, who sets the room's priorities. I'll pick it up after ${task?.key ?? "my current task"} unless they move it.` : `Added to the room's plan, after ${task?.key ?? "what's in flight"}. I'll assign it to the right person.`,
      effect: (d, st) => {
        const nt = newTask(st, work, room, id, "you");
        d({ type: "addTask", task: nt });
        d({ type: "live", id, patch: { upNext: [nt.id, ...(st.live[id]?.upNext ?? [])] } });
      },
    };
  }

  return { text: task ? `Noted. I'm keeping going on ${task.key} meanwhile. Anything else about it?` : "Noted." };
}
