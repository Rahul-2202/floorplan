import type { LockedRule, RoomConfig, RoomKey } from "../types";

export const ROOM_CONFIGS: Record<RoomKey, RoomConfig> = {
  dev: {
    id: "dev",
    name: "Development",
    head: "pm",
    members: ["fe", "be", "ops", "qa"],
    responsibilities: ["The booking product, end to end", "Releases, environments and uptime", "Fixing anything that breaks booking or payments"],
    dod: "Merged with approval, tested by the Tester, ticket closed in Linear",
    outputs: ["Pull requests", "Linear tickets", "Weekly dev report (sheet)"],
    tools: ["GitHub", "Linear", "Slack", "Sentry", "Vercel"],
    budget: 400,
    spent: 226,
    convBudget: 20,
    whenBlocked: "park",
    publishing: "drafts",
    merge: "approval",
    norms: [
      "Messages queue until a break point",
      "Questions go direct; new work goes through the PM",
      "Only the PM, Ada or you can send a stop",
    ],
    channel: "#development",
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    head: "strat",
    members: ["cr1", "cr2", "editor"],
    responsibilities: ["The launch campaign", "Brand voice and content calendar", "Social, blog and video"],
    dod: "Edited, approved by you, scheduled",
    outputs: ["Drafts sent to you", "Videos for review", "Weekly performance sheet"],
    tools: ["Notion", "Google Docs", "LinkedIn", "X", "Figma"],
    budget: 150,
    spent: 101,
    convBudget: 12,
    whenBlocked: "guess",
    publishing: "drafts",
    merge: "head",
    norms: ["Drafts go to you before anything public", "Best guess when blocked, always flagged", "Editor reviews everything first"],
    channel: "#marketing",
  },
};

export const LOCKED: LockedRule[] = [
  { id: "lock-public", text: "Nobody posts publicly without my approval", locked: true },
  { id: "lock-merge", text: "Nothing merges to main without my approval", locked: true },
  { id: "lock-spend", text: "No spend over $100 without asking me", locked: false },
];

export const NORMS = [
  { t: "Messages queue, they don't interrupt", d: "Read at the next break point: a finished step, a commit, the next task." },
  { t: "Three urgency levels", d: "Normal, urgent, stop. Only a head, Ada or you can send a stop." },
  { t: "Questions go direct, work goes through the head", d: "Anyone can ask anyone. New work for a room goes through its head." },
  { t: "You can reach anyone, the head is copied", d: "So instructions never silently conflict." },
  { t: "No answer means escalation", d: "Unanswered questions go to the asker's head, then your inbox." },
];

export const ROOM_TEMPLATES = [
  { name: "Sales", head: "Sales lead", members: ["SDR", "Researcher"], tools: ["HubSpot", "Gmail", "LinkedIn"] },
  { name: "Legal", head: "Counsel", members: ["Contract reviewer", "Paralegal"], tools: ["Google Docs", "Notion"] },
  { name: "Finance", head: "Controller", members: ["Bookkeeper", "Analyst"], tools: ["Stripe", "Xero", "Google Sheets"] },
  { name: "Custom team", head: "Head", members: ["Specialist"], tools: ["Slack"] },
];
