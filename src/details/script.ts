import type { Line } from "@/lib/meeting";
import type { RoomId, Scene } from "@/office/types";
import type { DStep } from "./types";

export const CHAPTERS = [
  { n: "Setup", sub: "Day 1" },
  { n: "Work begins", sub: "Day 2" },
  { n: "Across rooms", sub: "Day 3" },
  { n: "Escalation and the meeting", sub: "Day 3" },
  { n: "Memory at work", sub: "Day 4–5" },
  { n: "Governance", sub: "Day 5–6" },
  { n: "Learning", sub: "Week 2" },
  { n: "Launch", sub: "Day 10" },
];

export const BASE: Scene = {
  rooms: { ceo: "built", dev: "blueprint", marketing: "blueprint", meeting: "blueprint", sales: "blueprint", legal: "blueprint", finance: "blueprint" },
  agents: { you: { at: "seat:you" }, ada: { at: "ada:home" } },
  camera: "ceo",
  board: { todo: 0, doing: 0, done: 0 },
};

const DEV = ["pm", "fe", "be", "ops", "qa"];
const MKT = ["strat", "cr1", "cr2", "editor"];
const seatAll = (ids: string[], status: "working" | "idle" = "working") => Object.fromEntries(ids.map((id) => [id, { at: `seat:${id}`, status }]));

const MEETING_CAM = { x: 0.25, y: 12.5, w: 13.5, h: 15.25 };
const BOTH: RoomId[] = ["dev", "marketing"];
const FULL = { x: 0, y: 0, w: 50, h: 28 };

export const SYNC_LINES: Line[] = [
  { who: "strat", text: "Thanks for making time. I need a launch date for the campaign." },
  { who: "pm", text: "The 15th, if SMS reminders make it. They need a provider contract first." },
  { who: "strat", text: "Could Frontend also add a launch banner to the booking page?" },
  { who: "pm", text: "That's new work for my room, so it goes on my plan. I'll queue it for Thursday." },
  { who: "strat", text: "Great. But I can't plan around an if. Could we drop SMS and launch sooner?" },
  { who: "pm", text: "That's a scope trade-off. Neither of us can make that call." },
  { who: "strat", text: "Then let's bring in the CEO and Ada." },
  { who: "pm", text: "I'll send the invite through Ada, with a pre-read." },
];

export const MEETING_LINES: Line[] = [
  { who: "ada", text: "Thanks for the invite. This is about launch scope and the date. PM, your recommendation?" },
  { who: "pm", text: "Launch Friday the 10th without SMS reminders. SMS needs a provider contract, and that alone takes a week." },
  { who: "strat", text: "Marketing can launch Friday either way. I just need a firm date today." },
  { who: "you", text: "Do clinics lose anything on day one?" },
  { who: "pm", text: "No. Every booking gets an email reminder. SMS follows in v1.1.", say: "No. Every booking gets an email reminder. SMS follows in version one point one." },
  { who: "you", text: "Then option B. Launch Friday, SMS in v1.1.", say: "Then option B. Launch Friday, SMS in version one point one." },
  { who: "pm", text: "Reading back: Friday launch, SMS moves to v1.1, I'll update Linear.", say: "Reading back. Friday launch, SMS moves to version one point one. I'll update Linear." },
  { who: "strat", text: "And I'll lock the launch plan for Friday the 10th." },
  { who: "ada", text: "Minutes are written. I'll track every action item." },
];

export const STEPS: DStep[] = [
  /* ------------------------------------------------------------ 1. Setup */
  {
    ch: 0,
    time: "Day 1 · 09:00",
    title: "An empty office",
    text: "A new CEO signs up. The office is empty except for Ada, the office manager, standing beside them. Every other room is still a blueprint.",
    spec: ["Overview", "Office manager"],
    scene: { camera: "ceo", agents: { ada: { at: "ada:home", bubble: { text: "Hi, I'm Ada. Let's build your company.", tone: "ada" } } } },
    ctx: { kind: "chat", msgs: [{ from: "ada", text: "Hi, I'm Ada, your office manager. Tell me what you're building and I'll set up the team with you." }] },
  },
  {
    ch: 0,
    time: "Day 1 · 09:04",
    title: "The interview",
    text: "Ada interviews the CEO by chat or voice: what the company does, what it needs to produce, and what must never happen. Answers go straight into company memory.",
    spec: ["Office manager · Onboarding"],
    scene: { agents: { you: { bubble: { text: "Online booking, live in two weeks.", tone: "ceo" } }, ada: { status: "thinking" } } },
    ctx: {
      kind: "chat",
      msgs: [
        { from: "ada", text: "Hi, I'm Ada, your office manager. Tell me what you're building and I'll set up the team with you." },
        { from: "you", text: "We're Bookwell, booking software for physio clinics. I want online booking live in two weeks." },
        { from: "ada", text: "What has to be true at launch, and what should never happen?" },
        { from: "you", text: "It must never double-book. And nothing goes public without me." },
      ],
    },
    memory: [
      { layer: "Company", op: "add", who: "ada", text: "Charter: Bookwell, booking for physio clinics", note: "from onboarding call" },
      { layer: "CEO profile", op: "add", who: "ada", text: "Approves anything public before it ships" },
      { layer: "Company", op: "add", who: "ada", text: "Goal: online booking live in 2 weeks" },
    ],
  },
  {
    ch: 0,
    time: "Day 1 · 09:12",
    title: "A proposed structure",
    text: "Ada proposes two rooms that fit the goal. Each has a head who represents the room, plus specialists. Every agent gets its own runtime.",
    spec: ["Core concepts", "Rooms and teams"],
    scene: { camera: BOTH, rooms: { dev: "ghost", marketing: "ghost" } },
    ctx: { kind: "org" },
  },
  {
    ch: 0,
    time: "Day 1 · 09:15",
    title: "Read back before anything applies",
    text: "Before applying a single setting, Ada reads every change back as a plain-language checklist. No risk tiers: every change is confirmed the same way.",
    spec: ["Governance · Safety of settings"],
    ctx: {
      kind: "checklist",
      title: "Ada's read-back",
      subtitle: "Configuration v1",
      items: [
        { text: "Create Development with a PM, frontend, backend, DevOps and a tester", ok: true },
        { text: "Create Marketing with a strategist, two creators and an editor", ok: true },
        { text: "The PM can merge to main only after your approval", ok: true },
        { text: "Marketing sends drafts to you. No direct posting", ok: true },
        { text: "Budgets: Development $400 a week, Marketing $150 a week", ok: true },
      ],
      footer: "Confirm to apply · versioned as v1",
    },
  },
  {
    ch: 0,
    time: "Day 1 · 09:16",
    title: "Hiring",
    text: "The rooms are built and nine agents walk in. Each one is configured with a role, a runtime, tools and permissions, all visible in the dashboard.",
    spec: ["Agents"],
    scene: {
      camera: FULL,
      rooms: { dev: "built", marketing: "built", meeting: "built" },
      agents: {
        ...Object.fromEntries(DEV.map((id, i) => [id, { at: `seat:${id}`, from: "ceo:outside", delay: i * 0.45, speed: 1.4, status: "idle" as const }])),
        ...Object.fromEntries(MKT.map((id, i) => [id, { at: `seat:${id}`, from: "ceo:outside", delay: 2.2 + i * 0.45, speed: 1.6, status: "idle" as const }])),
      },
    },
    events: [{ t: "09:16", kind: "system", who: "ada", text: "Hired 9 agents into Development and Marketing. Configuration v1 applied." }],
    ctx: {
      kind: "kv",
      title: "Backend",
      subtitle: "Development · reports to PM",
      who: "be",
      rows: [
        ["Runtime", "Codex"],
        ["Tools", "GitHub, Linear, Slack"],
        ["Can do freely", "Open PRs, move tickets"],
        ["Needs approval", "Merge to main"],
        ["Budget", "Shares Development's $400/wk"],
      ],
    },
  },
  {
    ch: 0,
    time: "Day 1 · 09:20",
    title: "Room specs",
    text: "Each room gets a spec: what it owns, what done means, what it produces and how. Without a clear definition of done, teams chat a lot and ship little.",
    spec: ["Rooms and teams · Room spec"],
    scene: { camera: "dev", agents: { pm: { bubble: "Got the spec. Planning the sprint." } } },
    ctx: {
      kind: "kv",
      title: "Development · room spec",
      subtitle: "Head: PM",
      who: "pm",
      rows: [
        ["Owns", "The booking product, end to end"],
        ["Done means", "Merged, tested, ticket closed in Linear"],
        ["Outputs", "Code in the repo, PRs, Linear tickets"],
        ["Tools", "GitHub, Linear, Slack, Sentry"],
        ["Budget", "$400 a week, $20 per conversation"],
      ],
    },
    memory: [
      { layer: "Room · Development", op: "derive", who: "pm", text: "Room charter, derived from company charter", note: "links to source" },
      { layer: "Room · Marketing", op: "derive", who: "strat", text: "Room charter, derived from company charter", note: "links to source" },
    ],
  },
  {
    ch: 0,
    time: "Day 1 · 09:24",
    title: "When-blocked policy",
    text: "Ada asks, room by room, what agents should do when they hit a gap the spec didn't cover. Development parks the task and switches; Marketing makes a best guess and flags it.",
    spec: ["Governance · When-blocked policy"],
    scene: { camera: FULL, roomNotes: { dev: "When blocked: park and switch", marketing: "When blocked: best guess, flag it" } },
    ctx: {
      kind: "chat",
      msgs: [
        { from: "ada", text: "If Development hits a gap in the spec, should they park it and switch, make a best guess, or stop and wait for you?" },
        { from: "you", text: "Park and switch. Mistakes in code are expensive." },
        { from: "ada", text: "And Marketing?" },
        { from: "you", text: "Best guess, but flag it so I see it." },
      ],
    },
  },
  {
    ch: 0,
    time: "Day 1 · 09:30",
    title: "Locked rules, seeded memory",
    text: "The CEO locks one rule that Ada can never change from a chat. Ada then sets up each agent's memory and generates the file its runtime reads before every session.",
    spec: ["Governance · Locked settings", "Memory · Runtime portability"],
    scene: { locked: ["marketing"], roomNotes: { dev: undefined, marketing: undefined } },
    ctx: {
      kind: "code",
      title: "Generated before each session",
      tabs: [
        {
          name: "AGENTS.md · Backend",
          lines: [
            ["#", "Backend · Development"],
            ["", "Runtime: Codex · reports to PM"],
            ["##", "Role"],
            ["-", "Own the booking API. Never double-book."],
            ["##", "Rules"],
            ["-", "Merge to main needs CEO approval"],
            ["##", "Index"],
            ["-", "company/charter · dev/charter · dev/spec"],
          ],
        },
        {
          name: "CLAUDE.md · Editor",
          lines: [
            ["#", "Editor · Marketing"],
            ["", "Runtime: Claude Code · reports to Strategist"],
            ["##", "Rules"],
            ["-", "Locked: nothing posts publicly without CEO approval"],
            ["##", "Index"],
            ["-", "company/charter · mkt/charter · brand/voice"],
          ],
        },
      ],
    },
    memory: [
      { layer: "Agent · all 9", op: "add", who: "ada", text: "Role cards set up", note: "Ada sets up, then only reviews" },
      { layer: "Agent · all 9", op: "generate", who: "ada", text: "CLAUDE.md / AGENTS.md generated per runtime" },
      { layer: "CEO profile", op: "add", who: "ada", text: "Locked: no public posting without approval" },
    ],
  },

  /* ------------------------------------------------------- 2. Work begins */
  {
    ch: 1,
    time: "Day 2 · 09:02",
    title: "A ticket arrives",
    ctx: {
      kind: "list",
      title: "Linear · BOOK-142",
      subtitle: "Online booking · owner: PM",
      items: [
        { brand: "Linear", title: "Patients book a slot online", sub: "Created by you · due in 2 weeks", tag: "New", tone: "violet" },
        { who: "pm", title: "Plan: split into four tasks", sub: "Frontend, Backend, DevOps, Tester" },
      ],
    },
    text: "Work enters through the tools the team already uses. A Linear ticket lands with the Development room, and the PM, as head, owns it.",
    spec: ["Agents · Heads"],
    scene: {
      camera: "dev",
      board: { todo: 1, doing: 0, done: 0 },
      agents: { ...seatAll(DEV, "idle"), ...seatAll(MKT, "idle"), pm: { at: "seat:pm", status: "thinking", bubble: "Splitting this into four tasks." } },
      props: { ticket: { kind: "ticket", at: [30, 6.15], label: "BOOK-142", sub: "Online booking" } },
    },
    events: [{ t: "09:02", kind: "linear", who: "linear", text: "BOOK-142 Online booking assigned to Development." }],
  },
  {
    ch: 1,
    time: "Day 2 · 09:05",
    title: "Parallel work",
    ctx: {
      kind: "list",
      title: "Linear · BOOK-142",
      subtitle: "4 sub-tasks, in parallel",
      items: [
        { who: "fe", title: "BOOK-143 Slots picker UI", tag: "Doing", tone: "approve" },
        { who: "be", title: "BOOK-144 /slots API", tag: "Doing", tone: "approve" },
        { who: "ops", title: "BOOK-145 Staging environment", tag: "Doing", tone: "approve" },
        { who: "qa", title: "BOOK-146 Test plan", tag: "Doing", tone: "approve" },
      ],
    },
    text: "The PM splits the ticket and each specialist takes a piece. The point of many agents is parallel work; the cost is coordination, which the channels handle.",
    spec: ["Rooms and teams · Why multiple agents"],
    scene: {
      board: { todo: 1, doing: 4, done: 0 },
      agents: seatAll(DEV),
      props: {
        ticket: null,
        t1: { kind: "ticket", at: [18, 6.15], label: "Slots UI" },
        t2: { kind: "ticket", at: [22, 6.15], label: "Slots API" },
        t3: { kind: "ticket", at: [18, 9.65], label: "Staging" },
        t4: { kind: "ticket", at: [22, 9.65], label: "Test plan" },
      },
    },
    events: [{ t: "09:05", kind: "room", who: "pm", text: "Frontend: slots UI. Backend: /slots API. DevOps: staging. Tester: test plan." }],
  },
  {
    ch: 1,
    time: "Day 2 · 09:31",
    title: "Questions go direct",
    ctx: {
      kind: "list",
      title: "Direct message",
      subtitle: "Frontend → Backend · logged",
      items: [{ who: "fe", title: "What does /slots return?", sub: "A question, not new work, so it goes straight to Backend", tag: "Direct", tone: "ok" }],
    },
    text: "Frontend needs to know the API's shape, so it asks Backend directly. Any agent can ask any other agent a question; no one relays through the CEO.",
    spec: ["Communication · Who talks to whom"],
    scene: { agents: { fe: { at: "dev:beside-be", bubble: "What does /slots return?" } } },
    events: [{ t: "09:31", kind: "dm", who: "fe", to: "be", text: "What does /slots return? I want to build the picker against it." }],
  },
  {
    ch: 1,
    time: "Day 2 · 09:34",
    title: "One contract, two tickets",
    ctx: {
      kind: "kv",
      title: "contract.md",
      subtitle: "Development · one shared object",
      who: "be",
      rows: [
        ["Endpoint", "GET /slots?clinic&day"],
        ["Returns", "start, end, therapistId"],
        ["Linked from", "BOOK-143, BOOK-144"],
        ["Owner", "Backend"],
        ["Copies", "None. Everyone links here"],
      ],
    },
    text: "The answer becomes a durable object, not a chat line. Both tickets link to the same contract, so there's never a second copy to drift.",
    spec: ["Communication · Chatter control", "Memory · Cross-room agreements"],
    scene: {
      agents: { fe: { at: "dev:beside-be", emote: "✓" }, be: { bubble: "Start, end, therapist. Writing it down." } },
      props: { contract: { kind: "doc", at: [24.6, 7.1], label: "contract.md", sub: "linked to 2 tickets", tone: "violet" } },
    },
    events: [{ t: "09:34", kind: "dm", who: "be", to: "fe", text: "Start, end and therapist id. Saved as contract.md and linked from BOOK-143 and BOOK-144." }],
    memory: [{ layer: "Room · Development", op: "add", who: "be", text: "API contract: /slots", note: "one shared object" }],
  },
  {
    ch: 1,
    time: "Day 2 · 10:12",
    title: "Messages queue, they don't interrupt",
    text: "While Backend is mid-commit, two messages arrive. They wait in its inbox and get read at the next natural break point: after a step, a commit, or before the next task.",
    spec: ["Communication · Interruption rules 1"],
    scene: {
      agents: { fe: { at: "seat:fe", status: "working" }, be: { badge: 2, bubble: { text: "Finishing my commit first…", tone: "quiet" } } },
      props: { contract: null },
    },
    events: [
      { t: "10:12", kind: "queue", who: "pm", to: "be", text: "Can /slots also return the clinic's timezone?" },
      { t: "10:14", kind: "queue", who: "ops", to: "be", text: "Staging database is ready when you are." },
    ],
    ctx: {
      kind: "list",
      title: "Backend's inbox",
      subtitle: "Read at the next break point",
      items: [
        { who: "pm", title: "Return the clinic's timezone too", tag: "Normal", tone: "fyi" },
        { who: "ops", title: "Staging database is ready", tag: "Normal", tone: "fyi" },
      ],
      footer: "Next break point: after the current commit",
    },
  },
  {
    ch: 1,
    time: "Day 2 · 10:20",
    title: "A natural break point",
    ctx: {
      kind: "list",
      title: "Backend's inbox",
      subtitle: "Read after commit a1f3",
      items: [
        { who: "pm", title: "Return the clinic's timezone too", sub: "Done in the same change", done: true },
        { who: "ops", title: "Staging database is ready", sub: "Picking up next", done: true },
      ],
    },
    text: "Commit pushed, inbox read. A routine lesson is written to Backend's memory and auto-accepted; only conflicts or significant changes go to the head for review.",
    spec: ["Memory · Keeping it healthy"],
    scene: {
      board: { todo: 1, doing: 3, done: 1 },
      agents: { be: { emote: "✓" } },
      props: { t2: { kind: "pr", at: [22, 6.15], label: "a1f3 pushed", tone: "ok" } },
    },
    events: [
      { t: "10:20", kind: "github", who: "github", text: "Backend pushed 3 commits to booking/slots-api." },
      { t: "10:21", kind: "dm", who: "be", to: "pm", text: "Timezone added. Picking up staging next." },
    ],
    memory: [{ layer: "Agent · Backend", op: "add", who: "be", text: "Lesson: always return timezone with slots", note: "routine · auto-accepted" }],
  },
  {
    ch: 1,
    time: "Day 2 · 11:05",
    title: "Urgent, and stop",
    text: "The Tester finds a double-booking bug. Anyone can raise urgency to their head; only the head, Ada or the CEO can send a stop. The PM stops the staging deploy.",
    spec: ["Communication · Interruption rules 2"],
    scene: {
      agents: {
        qa: { at: "dev:beside-pm", bubble: { text: "Double booking on the release branch!", tone: "urgent" } },
        pm: { emote: "!" },
        ops: { status: "blocked", bubble: { text: "Stopped. Deploy paused.", tone: "urgent" } },
      },
      props: { t2: null, stop: { kind: "lock", at: [18, 9.65], label: "STOP", sub: "from PM", tone: "bad" } },
    },
    events: [
      { t: "11:05", kind: "urgent", who: "qa", to: "pm", text: "Two patients can book the same slot on the release branch." },
      { t: "11:06", kind: "urgent", who: "pm", to: "ops", text: "Stop the staging deploy until this is fixed." },
    ],
    ctx: {
      kind: "list",
      title: "Urgency levels",
      subtitle: "Defaults, not a matrix",
      items: [
        { title: "Normal", sub: "Handled at the next break point", tag: "Anyone", tone: "fyi" },
        { title: "Urgent", sub: "Handled at the next safe point, after the current step", tag: "Anyone", tone: "approve" },
        { title: "Stop", sub: "Halt now", tag: "Head, Ada, CEO", tone: "high" },
      ],
    },
  },

  /* ------------------------------------------------------- 3. Across rooms */
  {
    ch: 2,
    time: "Day 3 · 11:10",
    title: "The CEO can reach anyone",
    text: "The CEO messages the Editor directly. The Strategist is copied automatically, so instructions never silently conflict with the head's.",
    spec: ["Communication · Interruption rules 4"],
    scene: {
      camera: "marketing",
      board: { todo: 0, doing: 4, done: 2 },
      agents: { ...seatAll(DEV), ...seatAll(MKT), strat: { at: "seat:strat", status: "working", badge: 1 }, editor: { at: "seat:editor", status: "working", bubble: "Got it, using the clinic photos." } },
      clearProps: true,
    },
    events: [
      { t: "11:10", kind: "dm", who: "you", to: "editor", text: "Use the real clinic photos, not stock." },
      { t: "11:10", kind: "system", who: "ada", text: "Strategist copied on your message to Editor." },
    ],
    ctx: {
      kind: "list",
      title: "Your message",
      subtitle: "To Editor · Strategist copied",
      items: [
        { who: "you", title: "Use the real clinic photos, not stock.", sub: "Sent to Editor" },
        { who: "strat", title: "Copied automatically", sub: "So it never conflicts with the room's plan", tag: "Head", tone: "violet" },
      ],
    },
  },
  {
    ch: 2,
    time: "Day 3 · 14:50",
    title: "Heads meet across rooms",
    text: "Marketing needs things from Development. Rather than a long thread, the Strategist asks the PM for a sync on the cross-team channel, and both heads walk to the meeting room.",
    spec: ["Communication · Channels", "Communication · Meetings and minutes"],
    scene: {
      camera: FULL,
      agents: {
        strat: { at: "mt:b2", status: "meeting", speed: 2.6, bubble: "PM, got 10 minutes? Meeting room." },
        pm: { at: "mt:t2", status: "meeting", speed: 1.8, delay: 0.6 },
        editor: { at: "seat:editor", status: "working" },
      },
    },
    events: [
      { t: "14:50", kind: "cross", who: "strat", to: "pm", text: "Need the launch date and a small ask from your room. 10 minutes in the meeting room?" },
      { t: "14:51", kind: "cross", who: "pm", to: "strat", text: "On my way." },
    ],
    ctx: {
      kind: "list",
      title: "Cross-team channel",
      subtitle: "Heads only",
      items: [
        { who: "strat", title: "Need the launch date and a small ask from your room", sub: "Asks for a sync in the meeting room" },
        { who: "pm", title: "On my way", sub: "Room keeps working while the PM is out" },
      ],
    },
  },
  {
    ch: 2,
    time: "Day 3 · 15:00",
    title: "The heads' sync",
    text: "Two heads, one table. The date depends on scope, and the banner is new work for Development, so it goes on the PM's plan. Turn on sound to hear it.",
    spec: ["Communication · Interruption rules 3", "Agents · Heads"],
    scene: { camera: MEETING_CAM },
    ctx: { kind: "meeting", id: "sync" },
  },
  {
    ch: 2,
    time: "Day 3 · 15:12",
    title: "Something only the CEO can decide",
    text: "The heads settle what they own: the banner is queued for Thursday. But dropping SMS to launch sooner is a scope trade-off above both of them, so their minutes end with an invite for the CEO and Ada.",
    spec: ["CEO meetings · Triggers"],
    ctx: { kind: "meeting", id: "sync", minutes: true },
    events: [
      { t: "15:12", kind: "meeting", who: "pm", text: "Heads' sync minutes: banner queued as BOOK-148. Launch date blocked on SMS scope, needs the CEO." },
      { t: "15:12", kind: "linear", who: "linear", text: "PM created BOOK-148 Launch banner, assigned to Frontend for Thursday." },
    ],
    memory: [{ layer: "Conversation", op: "add", who: "pm", text: "Minutes: heads' sync", note: "1 decision, 1 open question" }],
  },

  /* ------------------------------------------------- 4. Escalation + meeting */
  {
    ch: 3,
    time: "Day 3 · 15:15",
    title: "Inviting the CEO and Ada",
    text: "Agents can request time on the CEO's calendar, inviting the agents who need to be there. The request is routed through Ada, and a knock appears at the CEO's door.",
    spec: ["Communication · Meetings and minutes"],
    scene: {
      camera: ["ceo", "meeting"],
      agents: { pm: { at: "mt:t2", status: "blocked" }, strat: { at: "mt:b2", status: "meeting" } },
      props: { knock: { kind: "knock", at: [12.6, 12.2], label: "Invite · launch scope", tone: "warn", delay: 0.6 } },
    },
    events: [{ t: "15:15", kind: "inbox", who: "pm", text: "Meeting invite from PM and Strategist: launch the 10th without SMS, or wait until the 15th?" }],
    ctx: {
      kind: "list",
      title: "Needs your attention",
      subtitle: "Routed through Ada",
      items: [{ who: "pm", title: "Launch the 10th without SMS, or wait until the 15th?", sub: "Invite from PM and Strategist · they're in the meeting room", tag: "High", tone: "high" }],
    },
  },
  {
    ch: 3,
    time: "Day 3 · 15:16",
    title: "While the heads are away",
    text: "The rooms keep working on anything the pending decision doesn't touch. The SMS task depends on it, so it follows Development's policy: park and switch.",
    spec: ["CEO meetings · While the head is away"],
    scene: { camera: BOTH, roomNotes: { dev: "1 task parked: SMS reminders" }, agents: { be: { bubble: { text: "Parked SMS. Switching to staging.", tone: "quiet" } } } },
    events: [{ t: "15:16", kind: "room", who: "be", text: "Parked BOOK-146 SMS reminders pending decision. Picking up BOOK-147." }],
    ctx: {
      kind: "kv",
      title: "Development",
      subtitle: "Head is in a meeting",
      who: "pm",
      rows: [
        ["When blocked", "Park and switch"],
        ["Parked", "BOOK-146 SMS reminders"],
        ["Switched to", "BOOK-147 Staging config"],
        ["Unaffected work", "3 tasks continue"],
      ],
    },
  },
  {
    ch: 3,
    time: "Day 3 · 15:20",
    title: "Ada prepares the meeting",
    text: "As chief of staff, Ada accepts the invite, blocks the CEO's calendar and attaches a pre-read. Smaller items are downgraded to the inbox so the meeting stays about one decision.",
    spec: ["Office manager · Chief of staff"],
    scene: {
      camera: ["ceo", "meeting"],
      roomNotes: { dev: undefined },
      agents: { ada: { bubble: { text: "Booked. Pre-read is ready.", tone: "ada" } } },
      props: { knock: { kind: "calendar", at: [12.6, 12.2], label: "15:30 · Meeting room", tone: "violet" } },
    },
    events: [{ t: "15:20", kind: "system", who: "ada", text: "Accepted the invite for 15:30 with PM and Strategist. Pre-read attached. 2 smaller items moved to your inbox." }],
    ctx: {
      kind: "list",
      title: "Needs your attention",
      subtitle: "Triaged by Ada",
      items: [
        { who: "pm", title: "Launch scope and date", sub: "Meeting room · 15:30 · pre-read ready", tag: "Meeting", tone: "high" },
        { who: "editor", title: "3 social drafts to review", sub: "No rush, before Thursday", tag: "Review", tone: "violet" },
        { who: "ada", title: "4 updates batched for Friday", sub: "Nothing here needs you today", tag: "FYI", tone: "fyi" },
      ],
    },
  },
  {
    ch: 3,
    time: "Day 3 · 15:28",
    title: "The pre-read",
    text: "The CEO and Ada walk to the meeting room, where the heads are waiting. The pre-read sets out the question, the options and each agent's position, so the time is spent deciding.",
    spec: ["CEO experience · Calendar and meetings"],
    aside: "If the CEO misses the meeting, Ada marks it high priority in the inbox and the CEO calls the heads in when ready.",
    scene: {
      camera: { x: 0, y: 0, w: 24, h: 28 },
      agents: {
        you: { at: "mt:head", status: "meeting", delay: 0.3, speed: 1.5 },
        ada: { at: "mt:foot", status: "meeting", speed: 1.5 },
        pm: { at: "mt:t2", status: "meeting", bubble: "Thanks for joining." },
      },
      clearProps: true,
    },
    ctx: { kind: "preread" },
  },
  {
    ch: 3,
    time: "Day 3 · 15:30",
    title: "The meeting",
    text: "Ada chairs, as the CEO chose. The heads state the question and a recommendation, the CEO pushes back, a decision is reached. Turn on sound to hear it.",
    spec: ["CEO meetings · The meeting"],
    scene: { camera: MEETING_CAM },
    ctx: { kind: "meeting", id: "joint" },
  },
  {
    ch: 3,
    time: "Day 3 · 15:39",
    title: "Read-back and minutes",
    text: "The head reads the decision back before leaving. Minutes record the decision, the reason and action items with owners, plus the full transcript.",
    spec: ["CEO meetings · After the meeting"],
    ctx: { kind: "meeting", id: "joint", minutes: true },
    events: [{ t: "15:39", kind: "meeting", who: "ada", text: "Minutes: launch Friday Mar 10, SMS reminders in v1.1. 3 action items." }],
    memory: [{ layer: "Conversation", op: "add", who: "ada", text: "Minutes: launch scope", note: "transcript archived" }],
  },
  {
    ch: 3,
    time: "Day 3 · 15:45",
    title: "The source of truth is updated",
    ctx: {
      kind: "list",
      title: "Source of truth",
      subtitle: "Updated by the heads",
      items: [
        { brand: "Linear", title: "BOOK-150 SMS reminders created for v1.1", sub: "by PM", done: true },
        { brand: "Linear", title: "BOOK-146 closed as moved", sub: "by PM", done: true },
        { brand: "Google Docs", title: "Launch plan re-dated to Fri, Mar 10", sub: "by Strategist", done: true },
      ],
    },
    text: "Heads update the real systems, not just chat: the PM creates the v1.1 ticket and moves SMS out of scope, the Strategist re-dates the launch plan.",
    spec: ["CEO meetings · After the meeting"],
    scene: {
      camera: BOTH,
      agents: {
        you: { at: "seat:you", status: undefined, speed: 1.6 },
        ada: { at: "ada:home", status: undefined, speed: 1.6 },
        pm: { at: "seat:pm", status: "working", speed: 2.4 },
        strat: { at: "seat:strat", status: "working", speed: 3.2 },
      },
      props: {
        linear: { kind: "ticket", at: [30, 6.15], label: "BOOK-150", sub: "SMS → v1.1", tone: "violet", delay: 2.5 },
        plan: { kind: "doc", at: [46, 6.15], label: "Launch plan", sub: "Fri Mar 10", tone: "violet", delay: 3 },
      },
    },
    events: [
      { t: "15:45", kind: "linear", who: "linear", text: "PM created BOOK-150 SMS reminders (v1.1) and closed BOOK-146." },
      { t: "15:48", kind: "update", who: "strat", text: "Launch plan updated to Friday, March 10." },
    ],
  },
  {
    ch: 3,
    time: "Day 3 · 16:00",
    title: "Briefing the teams",
    text: "Each head briefs its room from the written minutes and assigns the action items. Affected agents acknowledge. Ada tracks completion; she doesn't inspect the work.",
    spec: ["CEO meetings · Follow-up"],
    scene: {
      agents: {
        pm: { at: "dev:brief", bubble: "Launch is Friday the 10th. SMS is v1.1." },
        strat: { at: "mkt:brief", bubble: "New date: the 10th." },
        fe: { emote: "✓" },
        be: { emote: "✓" },
        ops: { emote: "✓", status: "working" },
        qa: { emote: "✓" },
        cr1: { emote: "✓" },
        cr2: { emote: "✓" },
        editor: { emote: "✓" },
      },
    },
    events: [{ t: "16:00", kind: "system", who: "ada", text: "7 of 7 agents acknowledged. Tracking 3 action items." }],
    ctx: {
      kind: "list",
      title: "Action items",
      subtitle: "Tracked by Ada",
      items: [
        { who: "pm", title: "Update Linear: BOOK-150 for v1.1", done: true },
        { who: "be", title: "Shortlist two SMS providers", sub: "Due Monday" },
        { who: "strat", title: "Re-date the launch plan", done: true },
      ],
    },
  },

  /* --------------------------------------------------------- 5. Memory */
  {
    ch: 4,
    time: "Day 4 · 15:00",
    title: "Distill up",
    ctx: {
      kind: "kv",
      title: "Company decision log",
      subtitle: "Entry #14",
      who: "ada",
      rows: [
        ["Decision", "Launch Fri Mar 10, SMS in v1.1"],
        ["Source", "Minutes · Day 3, 15:39"],
        ["Approved by", "PM (room), Ada (company)"],
        ["Links", "BOOK-150, launch plan"],
        ["Status", "Active"],
      ],
    },
    text: "The meeting is distilled up, one layer at a time: minutes become an agent lesson, the room's decision log, then the company decision log. Each step is approved by that layer's owner and links back to its source.",
    spec: ["Memory · How memory moves"],
    scene: { camera: FULL, agents: { ...seatAll(DEV), ...seatAll(MKT) } },
    memory: [
      { layer: "Conversation", op: "read", who: "ada", text: "Minutes: launch scope" },
      { layer: "Agent · Backend", op: "add", who: "be", text: "Lesson: email reminders until SMS ships", note: "confidence: high" },
      { layer: "Room · Development", op: "review", who: "pm", text: "Decision: SMS reminders moved to v1.1", note: "approved by PM" },
      { layer: "Company", op: "review", who: "ada", text: "Decision log: launch scope, Mar 10", note: "approved by Ada" },
    ],
  },
  {
    ch: 4,
    time: "Day 4 · 15:05",
    title: "Derive down",
    ctx: {
      kind: "list",
      title: "Derived from the decision",
      subtitle: "Flagged for refresh if the source changes",
      items: [
        { who: "pm", title: "API freeze Thursday the 9th", sub: "Development room", tag: "Derived", tone: "violet" },
        { who: "strat", title: "Posts scheduled for the 10th", sub: "Marketing room", tag: "Derived", tone: "violet" },
        { who: "be", title: "Launch checklist", sub: "Backend's memory", tag: "Derived", tone: "violet" },
      ],
    },
    text: "Heads turn company memory into what their room needs. Each derived item links to its source and is flagged for refresh if the source changes.",
    spec: ["Memory · Derive down"],
    memory: [
      { layer: "Room · Development", op: "derive", who: "pm", text: "API freeze Thursday the 9th", note: "from: launch Mar 10" },
      { layer: "Room · Marketing", op: "derive", who: "strat", text: "Posts scheduled for the 10th", note: "from: launch Mar 10" },
      { layer: "Agent · Backend", op: "derive", who: "pm", text: "Launch checklist", note: "from room memory" },
    ],
  },
  {
    ch: 4,
    time: "Day 4 · 15:06",
    title: "Superseded, never deleted",
    ctx: {
      kind: "kv",
      title: "Launch date",
      subtitle: "Company memory",
      who: "ada",
      rows: [
        ["Current", "Fri, Mar 10 · firm"],
        ["Superseded", "Wed, Mar 15 · tentative"],
        ["Replaced by", "Decision #14"],
        ["Loaded into tasks", "Current only"],
      ],
    },
    text: "The old launch date isn't deleted. It's marked superseded with a link to what replaced it, so memory stays permanent without cluttering current context.",
    spec: ["Memory · Superseded, not deleted"],
    memory: [{ layer: "Company", op: "supersede", who: "ada", text: "Launch: Wed, Mar 15 (tentative)", note: "→ superseded by Fri, Mar 10" }],
  },
  {
    ch: 4,
    time: "Day 5 · 10:10",
    title: "A stale flag",
    ctx: {
      kind: "list",
      title: "Stale flags",
      subtitle: "Marketing room",
      items: [
        { who: "cr1", title: "Pricing page notes look out of date", tag: "Flag", tone: "warn" },
        { who: "cr2", title: "Same item flagged", sub: "Merged into one flag", tag: "Merged", tone: "fyi" },
        { who: "strat", title: "Owner updated the notes", done: true },
      ],
    },
    text: "A Creator notices the pricing page notes are out of date and flags them. Any reader can flag; the layer's owner fixes it; duplicate flags merge into one.",
    spec: ["Memory · Stale flags"],
    scene: { camera: "marketing", agents: { cr1: { emote: "?", bubble: "These pricing notes look stale." }, strat: { bubble: "Fixed. Thanks for flagging." } } },
    memory: [
      { layer: "Room · Marketing", op: "flag", who: "cr1", text: "Pricing page notes", note: "flagged stale · 2 flags merged" },
      { layer: "Room · Marketing", op: "add", who: "strat", text: "Pricing page notes, updated", note: "owner fixed" },
    ],
  },
  {
    ch: 4,
    time: "Day 5 · 11:00",
    title: "Exactly what the task needs",
    text: "Backend picks up a new ticket. It reads a small index of everything it's allowed to see, then pulls only the three items that matter. Nothing missing, nothing extra.",
    spec: ["Memory · How an agent uses memory"],
    scene: { camera: "dev", agents: { be: { status: "thinking" } } },
    ctx: { kind: "index" },
    memory: [
      { layer: "Agent · Backend", op: "read", who: "be", text: "Index: 186 items visible" },
      { layer: "Agent · Backend", op: "read", who: "be", text: "Pulled 3: contract, lesson, decision", note: "2.1k tokens" },
    ],
  },

  /* ------------------------------------------------------- 6. Governance */
  {
    ch: 5,
    time: "Day 5 · 16:00",
    title: "A first-use check",
    text: "DevOps is about to merge to main for the first time. Even though the setting allows it after approval, the first use of a powerful permission always pauses and asks the CEO.",
    spec: ["Governance · First-use check"],
    scene: { agents: { be: { status: "working" }, ops: { status: "blocked", bubble: "First merge to main. Asking first." } } },
    events: [{ t: "16:00", kind: "inbox", who: "ops", text: "First use: merge PR #51 (staging config) to main?" }],
    ctx: {
      kind: "list",
      title: "Needs your attention",
      items: [{ who: "ops", title: "DevOps wants to merge to main", sub: "First time using this permission · checks passed", tag: "Approve", tone: "approve" }],
      footer: "You approved · DevOps won't ask again for this",
    },
  },
  {
    ch: 5,
    time: "Day 5 · 17:20",
    title: "A locked rule holds",
    text: "Late in the day the CEO asks Ada to let Marketing post directly, just this once. That rule is locked, and Ada can never change a locked setting from chat.",
    spec: ["Governance · Locked settings"],
    scene: { camera: ["ceo", "dev"], agents: { ops: { status: "working" }, ada: { bubble: { text: "That rule is locked.", tone: "ada" } } } },
    ctx: {
      kind: "chat",
      msgs: [
        { from: "you", text: "Let Marketing post the teaser directly, just this once." },
        { from: "ada", text: "That rule is locked: nothing posts publicly without your approval. Only you can unlock it, in the dashboard. Want me to send you the draft to approve instead?" },
        { from: "you", text: "Yes, send it." },
      ],
    },
  },
  {
    ch: 5,
    time: "Day 6 · 09:30",
    title: "An agent asks for more",
    ctx: {
      kind: "list",
      title: "Needs your attention",
      subtitle: "Routed by Ada",
      items: [{ who: "pm", title: "Let the Tester merge hotfixes to main", sub: "Permission request from PM", tag: "Approve", tone: "approve" }],
    },
    text: "The PM asks for the Tester to get merge rights for hotfixes. Agents can request permissions, but the request goes through Ada to the CEO.",
    spec: ["Governance · Safety of settings"],
    scene: { agents: { ada: { bubble: null } } },
    events: [{ t: "09:30", kind: "inbox", who: "pm", text: "Permission request: let the Tester merge hotfixes to main." }],
  },
  {
    ch: 5,
    time: "Day 6 · 09:34",
    title: "One click back",
    text: "Ada applies it, but the read-back shows it went wider than intended: the Tester could merge anything. The CEO rolls back in one click, and the correction is written to memory.",
    spec: ["Governance · Safety of settings"],
    ctx: {
      kind: "versions",
      rows: [
        { v: "v7", text: "Tester can merge any PR to main", who: "Ada", state: "reverted" },
        { v: "v6", text: "Marketing budget raised to $150", who: "You", state: "current" },
        { v: "v5", text: "Editor added to Marketing", who: "Ada" },
      ],
      footer: "Rolled back to v6",
    },
    memory: [{ layer: "CEO profile", op: "add", who: "ada", text: "Merge rights stay with heads unless scoped to hotfixes", note: "from your correction" }],
  },

  /* ---------------------------------------------------------- 7. Learning */
  {
    ch: 6,
    time: "Week 2 · Mon",
    title: "A correction becomes memory",
    ctx: {
      kind: "list",
      title: "CEO preferences",
      subtitle: "Owned by Ada · filtered per room",
      items: [
        { who: "ada", title: "Approve anything public before it ships", sub: "All rooms" },
        { who: "ada", title: "Merge rights stay with heads", sub: "Development only" },
        { who: "ada", title: "Never say \"excited\" in copy", sub: "Marketing only", tag: "New", tone: "ok" },
      ],
    },
    text: "The CEO sends a draft back: never use the word \"excited\". The correction goes into CEO preferences, filtered so only rooms that write copy see it.",
    spec: ["Memory · Learning from corrections"],
    scene: { camera: "marketing", agents: { editor: { bubble: "Noted. No \"excited\", ever." } } },
    events: [{ t: "Mon 10:02", kind: "dm", who: "you", to: "editor", text: "Never use the word \"excited\". It's not how we talk." }],
    memory: [{ layer: "CEO profile", op: "add", who: "ada", text: "Never say \"excited\" in copy", note: "visible to Marketing only" }],
  },
  {
    ch: 6,
    time: "Week 2 · Fri",
    title: "Asking less, doing more",
    text: "Agents start very pingy by default. As memory learns how the CEO decides, they escalate less, suggest more and act on what the CEO always approves.",
    spec: ["CEO meetings · Triggers", "Memory · Measures of success"],
    scene: { agents: { editor: { bubble: "Drafted 5 posts. All in your voice." } } },
    ctx: { kind: "stats" },
  },

  /* ------------------------------------------------------------ 8. Launch */
  {
    ch: 7,
    time: "Day 9 · 15:00",
    title: "A contradiction is flagged",
    ctx: {
      kind: "list",
      title: "Flagged by Ada",
      subtitle: "Decision #14 · SMS in v1.1",
      items: [
        { who: "fe", title: "PR #63 adds an SMS toggle", sub: "Conflicts with the Day 3 decision", tag: "Conflict", tone: "high" },
        { who: "pm", title: "Toggle dropped, PR updated", done: true },
      ],
    },
    text: "Frontend starts building an SMS toggle, the old plan. Because the decision was written down, the conflict is caught and flagged back to the head, who corrects course.",
    spec: ["CEO meetings · Follow-up"],
    scene: {
      camera: "dev",
      agents: { fe: { status: "blocked", emote: "!" }, pm: { at: "dev:beside-fe", bubble: "SMS moved to v1.1. Drop the toggle." } },
    },
    events: [{ t: "15:00", kind: "system", who: "ada", text: "Frontend's change conflicts with the Mar 3 decision (SMS in v1.1). Flagged to PM." }],
  },
  {
    ch: 7,
    time: "Day 10 · 09:00",
    title: "Launch day",
    ctx: {
      kind: "list",
      title: "Launch checklist",
      subtitle: "All done",
      items: [
        { brand: "GitHub", title: "Release v1.0 merged", sub: "Approved by you", done: true },
        { who: "strat", title: "Launch posts published", sub: "Approved by you", done: true },
        { brand: "Linear", title: "BOOK-142 closed", done: true },
        { who: "ada", title: "3 of 3 action items closed", done: true },
      ],
    },
    text: "Tested, merged with approval, posts approved by the CEO. Every action item closed. The company remembers how it got here.",
    spec: ["Overview · Core value"],
    scene: {
      camera: FULL,
      board: { todo: 0, doing: 0, done: 9 },
      agents: {
        ...Object.fromEntries([...DEV, ...MKT].map((id) => [id, { at: `seat:${id}`, status: "idle" as const, emote: "★" as const }])),
        pm: { at: "seat:pm", status: "idle", bubble: "Booking is live." },
        ada: { at: "ada:home", bubble: { text: "All action items closed.", tone: "ada" } },
      },
      props: { pr: { kind: "pr", at: [30, 6.15], label: "v1.0 shipped", tone: "ok" } },
    },
    events: [
      { t: "09:00", kind: "github", who: "github", text: "Release v1.0 merged to main. Approved by you." },
      { t: "09:05", kind: "update", who: "strat", text: "Launch posts published after your approval." },
    ],
    memory: [{ layer: "Company", op: "add", who: "ada", text: "Timeline: v1.0 launched Mar 10", note: "cross-room digest" }],
  },
];
