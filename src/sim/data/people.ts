import type { AgentLive, AgentRequest, EmailInvite, InboxItem, Invite, OrgRules, Person, PMsg } from "../types";

/** The humans in the office. The CEO is "you" when you play the CEO. */
export const PEOPLE: Record<string, Person> = {
  you: { id: "you", name: "CEO", full: "The CEO", title: "CEO", role: "ceo", room: null, presence: "online", email: "ceo@bookwell.app", joined: "Founded the office" },
  priya: { id: "priya", name: "Priya", full: "Priya Raman", title: "Engineering lead", role: "lead", room: "dev", presence: "call", email: "priya@bookwell.app", joined: "Mon", via: "BKW-7Q4M" },
  sam: { id: "sam", name: "Sam", full: "Sam Okafor", title: "Software engineer", role: "member", room: "dev", presence: "call", email: "sam@bookwell.app", joined: "Mon", via: "dev-k3p9" },
  marco: { id: "marco", name: "Marco", full: "Marco Bianchi", title: "Marketing lead", role: "lead", room: "marketing", presence: "online", email: "marco@bookwell.app", joined: "Mon", via: "BKW-7Q4M" },
  lena: { id: "lena", name: "Lena", full: "Lena Park", title: "Content designer", role: "member", room: "marketing", presence: "focus", email: "lena@bookwell.app", joined: "Tue", via: "mkt-r8w2" },
  jordan: { id: "jordan", name: "Jordan", full: "Jordan Hayes", title: "Account executive", role: "member", room: null, presence: "online", email: "jordan@bookwell.app", joined: "Thu 09:31", via: "BKW-7Q4M" },
};

/** Where people are, using the same live record as agents. */
export const PEOPLE_LIVE: Record<string, AgentLive> = {
  you: { at: "seat:you", status: "idle", upNext: [], queued: 0, step: "CEO" },
  priya: { at: "seat:priya", status: "meeting", upNext: [], queued: 0, step: "On a call: release checklist" },
  sam: { at: "seat:sam", status: "meeting", upNext: [], queued: 0, step: "On a call: release checklist" },
  marco: { at: "seat:marco", status: "idle", upNext: [], queued: 0, step: "Reviewing launch posts" },
  lena: { at: "seat:lena", status: "working", upNext: [], queued: 0, step: "Focus time until 10:30" },
  jordan: { at: "lobby:1", status: "idle", upNext: [], queued: 0, step: "In the lobby, waiting for a room" },
};

export const ORG: OrgRules = {
  roomEdit: "room",
  memberReach: "anyone",
  leadReach: "anyone",
  crossRoom: "lead",
  roomLinks: "leads",
  agentsInCalls: true,
};

export const INVITES: Invite[] = [
  { code: "BKW-7Q4M", kind: "office", role: "member", by: "you", uses: 4, max: 10, expires: "in 6 days" },
  { code: "dev-k3p9", kind: "room", room: "dev", role: "member", by: "priya", uses: 1, max: 5, expires: "in 13 days" },
  { code: "mkt-r8w2", kind: "room", room: "marketing", role: "member", by: "marco", uses: 1, max: 5, expires: "in 13 days" },
];

export const EMAIL_INVITES: EmailInvite[] = [{ id: "ei-nina", email: "nina@bookwell.app", name: "Nina Patel", room: "marketing", by: "marco", at: "Wed 17:20", status: "sent" }];

export const REQUESTS: AgentRequest[] = [
  {
    id: "req-docs",
    role: "Docs writer",
    room: "dev",
    by: "sam",
    why: "API docs keep slipping behind releases. The PM agrees a writer would free up Backend.",
    at: "09:22",
    ada: "approved",
    ceo: "pending",
    adaNote: "Fits Development's budget ($226 of $400 spent). I'd use Sonnet at $30 a week, read-only on GitHub.",
  },
];

export const PEOPLE_INBOX: InboxItem[] = [
  { id: "i-req-docs", kind: "approval", from: "sam", title: "Add a Docs writer agent to Development", sub: "Requested by Sam · Ada approved · fits the budget", priority: "normal", at: "09:24", ref: { type: "request", id: "req-docs" }, to: ["you"] },
  { id: "i-jordan", kind: "approval", from: "jordan", title: "Jordan joined with the office code. Pick a room", sub: "Account executive · waiting in the lobby since 09:31", priority: "normal", at: "09:31", ref: { type: "person", id: "jordan" }, to: ["you"] },
  { id: "i-priya-dns", kind: "escalation", from: "priya", title: "DNS for bookwell.app needs the account owner", sub: "DevOps escalated it to me. Only you have registrar access. Launch blocker.", priority: "high", at: "09:20", ref: { type: "task", id: "t-154" }, to: ["you"] },
  { id: "i-sam-req", kind: "fyi", from: "ada", title: "Your Docs writer request: I approved it", sub: "It's with the CEO now. You'll hear as soon as they decide.", priority: "low", at: "09:24", ref: { type: "request", id: "req-docs" }, to: ["sam"] },
  { id: "i-priya-req", kind: "fyi", from: "sam", title: "Sam asked for a Docs writer agent", sub: "You're copied as the room lead. Ada approved; the CEO decides.", priority: "low", at: "09:24", ref: { type: "request", id: "req-docs" }, to: ["priya"] },
  { id: "i-jordan-hi", kind: "fyi", from: "ada", title: "Welcome to Bookwell, Jordan", sub: "You're in the lobby. The CEO or I will give you a room shortly. Meanwhile, say hi in General.", priority: "low", at: "09:31", to: ["jordan"] },
];

const m = (who: string, t: string, text: string, agent?: boolean): PMsg => ({ id: `${who}-${t}`, who, t, text, agent });

export const CHANNELS: Record<string, PMsg[]> = {
  general: [
    m("marco", "09:02", "Morning all ☀️ Launch posts go to the CEO for sign-off before 11."),
    m("priya", "09:05", "Staging deploy at 10:30. Release checklist huddle in the Dev room now, drop in if you like."),
    m("ada", "09:14", "Reminder: readiness review at 11:00 in the meeting room. The pre-read is in your inboxes.", true),
    m("jordan", "09:31", "Hi everyone! Just joined with the office code. Sales, starting today 👋"),
    m("ada", "09:32", "Welcome Jordan! You're in the lobby for now. The CEO or I will put you in a room shortly.", true),
    m("lena", "09:33", "Welcome Jordan! 🎉"),
  ],
  "dm:priya|you": [m("priya", "09:20", "Quick one: DevOps escalated DNS to me, but the registrar login is yours. Can you grant access, or should we ship on the temporary domain?")],
  "dm:priya|sam": [
    m("sam", "09:21", "I asked Ada for a Docs writer agent. PM agreed it'd help."),
    m("priya", "09:23", "Good call. Ada already approved, it's with the CEO."),
  ],
  "dm:lena|marco": [
    m("marco", "09:10", "Can you do the carousel visuals after focus time?"),
    m("lena", "09:11", "Yes! Option B tested better with clinic owners."),
  ],
};

/** People on a call right now, by room. */
export const CALLS: Record<string, { people: string[]; agents: string[]; topic: string }> = {
  dev: { people: ["priya", "sam"], agents: [], topic: "Release checklist" },
};

/** Where someone sits once they're in a room. */
export const NEW_SPOT: Record<string, string> = { dev: "dev:new", marketing: "mkt:new", sales: "sales:new", legal: "legal:new", finance: "fin:new" };
export const NEW_SPOT2: Record<string, string> = { dev: "dev:new2", marketing: "mkt:new2" };

export const PERSON_LINES: Record<string, string> = {
  priya: "Owns Development. The PM reports to her.",
  sam: "Builds booking features with the dev agents.",
  marco: "Owns Marketing. The Strategist reports to him.",
  lena: "Designs launch content with the creators.",
  jordan: "New. Joined with the office code this morning.",
  nina: "Invited to Marketing by Marco.",
};
