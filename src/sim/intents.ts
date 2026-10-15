import { CAST } from "@/office/layout";
import { requestAgent } from "./actions";
import { DAYS } from "./data/calendar";
import { inboxFor } from "./people";
import { roomName } from "./store";
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

export const ADA_CHIPS = ["What needs me today?", "What's blocking dev?", "Put Jordan in Marketing", "Who's in Development?", "Ask marketing for 3 launch tweets", "Move the video review to tomorrow 10am", "Give the tester merge rights for hotfixes", "What did we decide about SMS?"];

const PERSON_ROOMS: [string, string[]][] = [
  ["dev", ["dev", "development", "engineering"]],
  ["marketing", ["marketing"]],
  ["sales", ["sales"]],
  ["legal", ["legal"]],
  ["finance", ["finance"]],
];

/* ------------------------------------------------------------------ people */

function peopleReply(t: string, s: SimState): Reply | null {
  const ceo = s.me === "you";
  const person = Object.values(s.people).find((p) => p.id !== "you" && new RegExp(`\\b${p.name.toLowerCase()}\\b`).test(t));
  const room = PERSON_ROOMS.find(([, w]) => w.some((x) => new RegExp(`\\b${x}\\b`).test(t)))?.[0];

  // "Put Jordan in Marketing", "move Sam to marketing", "assign Jordan to sales"
  if (person && room && /\b(put|move|assign|add|place|give)\b/.test(t)) {
    if (!ceo) return { text: `Only the CEO can move people between rooms. I've noted that you'd like ${person.name} in ${roomName(room)} and passed it on.` };
    if (room !== "dev" && room !== "marketing" && !s.extraRooms.includes(room))
      return { text: `${roomName(room)} isn't set up yet. Want me to add the room first? Then ${person.name} can join it.`, chips: [`Put ${person.name} in Marketing`] };
    const lead = /\b(as|the) (lead|head)\b/.test(t);
    return {
      text: `Done. ${person.name} is joining ${roomName(room)}${lead ? " as the lead" : ""}. I've briefed the room${(room === "dev" || room === "marketing") && s.rooms[room].lead && !lead ? ` and told ${name(s.rooms[room].lead!)}` : ""}.`,
      effect: (d) => d({ type: "assignPerson", id: person.id, room, role: lead ? "lead" : undefined, by: "ada" }),
    };
  }

  // Invites
  if (/\binvit/.test(t) || has(t, "invite code", "office code", "join link", "room link")) {
    const code = s.invites.find((i) => i.kind === "office" && !i.revoked);
    if (!ceo) {
      const mine = s.people[s.me]?.room;
      const link = s.invites.find((i) => i.kind === "room" && i.room === mine && !i.revoked);
      return { text: link ? `Your room link is ${link.code}. Anyone who uses it joins ${roomName(mine)} directly.` : "Only the CEO and room leads hand out invites. I can ask your lead for a room link.", ui: { panel: ["people", "invites"] } };
    }
    return {
      text: code ? `The office code is ${code.code} (${code.uses} of ${code.max} used, expires ${code.expires}). People who join with it wait in the lobby until you or I give them a room. Room links skip the lobby.` : "There's no active office code. Opening invites so you can create one.",
      ui: { panel: ["people", "invites"] },
    };
  }

  // "Who's in dev?"
  if (room && /\bwho('s| is| are)?\b/.test(t) && (room === "dev" || room === "marketing")) {
    const ppl = Object.values(s.people).filter((p) => p.room === room);
    const r = s.rooms[room];
    return {
      text: `${roomName(room)}: ${ppl.map((p) => `${p.name} (${p.role === "lead" ? "lead" : p.title.toLowerCase()})`).join(", ") || "no people yet"}, plus ${r.members.length + 1} agents. The ${name(r.head)} reports to ${r.lead && r.reportsTo !== "ceo" ? name(r.lead) : "the CEO"}.`,
      card: { kind: "list", title: roomName(room), items: [...ppl.map((p) => ({ who: p.id, text: p.full, sub: p.title })), ...[r.head, ...r.members].map((a) => ({ who: a, text: name(a), sub: "Agent" }))] },
    };
  }

  // Lobby
  if (has(t, "lobby", "waiting for a room", "unassigned")) {
    const w = Object.values(s.people).filter((p) => !p.room && p.role !== "ceo");
    return { text: w.length ? `${w.map((p) => p.name).join(" and ")} ${w.length > 1 ? "are" : "is"} in the lobby.${ceo ? " Say where they should go." : ""}` : "Nobody's waiting in the lobby.", chips: w.length && ceo ? [`Put ${w[0].name} in Marketing`] : undefined };
  }

  // Reporting lines
  if (has(t, "report to", "reports to", "my lead", "hierarchy", "who's my boss", "who is my boss")) {
    const p = s.people[s.me];
    const to = (r: RoomKey) => (s.rooms[r].lead && s.rooms[r].reportsTo !== "ceo" ? name(s.rooms[r].lead!) : "you");
    if (!p || p.role === "ceo") return { text: `The PM reports to ${to("dev")}, the Strategist to ${to("marketing")}. The leads and I report to you.`, ui: { panel: ["people", "hierarchy"] } };
    if (!p.room) return { text: "You'll report to your room's lead once the CEO gives you a room." };
    const lead = s.rooms[p.room as RoomKey]?.lead;
    return { text: p.role === "lead" ? `You report to the CEO. The ${name(s.rooms[p.room as RoomKey].head)} reports to you.` : `You report to ${lead ? name(lead) : "the CEO"}.`, ui: { panel: ["people", "hierarchy"] } };
  }
  return null;
}

/* -------------------------------------------------------------------- Ada */

export function adaReply(raw: string, s: SimState): Reply {
  const t = raw.toLowerCase().trim();
  const ppl = peopleReply(t, s);
  if (ppl) return ppl;

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
    const open = inboxFor(s).open.filter((i) => !i.batched);
    return {
      text: open.length ? `${open.length} things need you. I've put the launch blockers first:` : "Nothing needs you right now. I'll ping you if that changes.",
      card: open.length ? { kind: "list", title: "Needs you", items: open.map((i) => ({ who: i.from, text: i.title, sub: i.sub })) } : undefined,
      chips: ["Open my inbox", "What's blocking dev?"],
    };
  }
  if (has(t, "open my inbox", "show inbox")) return { text: "Opening your inbox.", ui: { panel: ["inbox"] } };
  if (has(t, "my requests", "agent requests")) return { text: "Here are the agent requests.", ui: { panel: ["people", "requests"] } };

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
    if (s.me !== "you") {
      const mine = (s.people[s.me]?.room as RoomKey | null) ?? room;
      return {
        text: `New agents need the CEO's yes, so I've logged it as a request for a ${role} in ${roomName(mine)}. I'll review it against the budget now, then it goes to the CEO.`,
        effect: (d, st) => {
          requestAgent(st, d, { role: pretty, room: mine === "marketing" ? "marketing" : "dev", why: raw });
        },
        chips: ["Show my requests"],
      };
    }
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
