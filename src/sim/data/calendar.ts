import type { CalEvent } from "../types";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const TODAY = 3;

const standups: CalEvent[] = [0, 1, 2, 3, 4].flatMap((d) => [
  { id: `su-dev-${d}`, title: "Dev standup (async)", day: d, start: "09:30", end: "09:40", kind: "standup" as const, attendees: ["pm", "fe", "be", "ops", "qa"], organizer: "pm", status: "confirmed" as const },
  { id: `su-mkt-${d}`, title: "Marketing standup (async)", day: d, start: "09:40", end: "09:50", kind: "standup" as const, attendees: ["strat", "cr1", "cr2", "editor"], organizer: "strat", status: "confirmed" as const },
]);

export const CALENDAR: CalEvent[] = [
  ...standups,
  {
    id: "ev-scope",
    title: "Launch scope",
    day: 1,
    start: "15:30",
    end: "15:40",
    kind: "ceo",
    attendees: ["you", "ada", "pm", "strat"],
    organizer: "ada",
    status: "confirmed",
    conversationId: "c-scope",
  },
  {
    id: "ev-readiness",
    title: "Launch readiness review",
    day: 3,
    start: "11:00",
    end: "11:15",
    kind: "ceo",
    attendees: ["you", "ada", "pm", "strat"],
    organizer: "ada",
    status: "confirmed",
    preread: "Go / no-go for tomorrow. Open: production DNS (DevOps), post tone (Marketing). Everything else is green.",
    agenda: ["Status of the launch checklist", "Production DNS decision", "Post tone", "Go / no-go"],
    conversationId: "c-readiness",
  },
  {
    id: "ev-video",
    title: "Video review: cut 2",
    day: 3,
    start: "15:00",
    end: "15:10",
    kind: "request",
    attendees: ["you", "cr2", "strat"],
    organizer: "cr2",
    status: "pending",
    preread: "Cut 2 applies Strategist's notes. Need your yes before it's scheduled for Friday.",
  },
  { id: "ev-focus", title: "Focus time", day: 3, start: "13:30", end: "15:00", kind: "focus", attendees: ["you"], organizer: "you", status: "confirmed" },
  { id: "ev-launch", title: "🚀 Launch", day: 4, start: "09:00", end: "09:30", kind: "meeting", attendees: ["you", "ada", "pm", "strat"], organizer: "ada", status: "confirmed" },
  {
    id: "ev-weekly",
    title: "Weekly review",
    day: 4,
    start: "16:00",
    end: "16:30",
    kind: "review",
    attendees: ["you", "ada", "pm", "strat"],
    organizer: "ada",
    status: "confirmed",
    preread: "Ada's weekly digest: what shipped, spend, decisions, and 4 batched FYIs.",
  },
  { id: "ev-sync", title: "Heads' sync: banner and date", day: 1, start: "15:00", end: "15:12", kind: "meeting", attendees: ["pm", "strat"], organizer: "strat", status: "confirmed", conversationId: "c-sync" },
];

/** Shown once a calendar is "connected". */
export const EXTERNAL: CalEvent[] = [
  { id: "ex-1", title: "Investor call", day: 2, start: "13:00", end: "13:45", kind: "external", attendees: ["you"], organizer: "you", status: "confirmed", source: "google" },
  { id: "ex-2", title: "Lunch with Sam", day: 3, start: "12:30", end: "13:30", kind: "external", attendees: ["you"], organizer: "you", status: "confirmed", source: "google" },
  { id: "ex-3", title: "Gym", day: 0, start: "07:30", end: "08:30", kind: "external", attendees: ["you"], organizer: "you", status: "confirmed", source: "apple" },
  { id: "ex-4", title: "Dentist", day: 4, start: "11:00", end: "12:00", kind: "external", attendees: ["you"], organizer: "you", status: "confirmed", source: "apple" },
];
