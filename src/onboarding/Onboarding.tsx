"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrandIcon } from "@/components/brands";
import { LogoMark } from "@/components/Logo";
import { RuntimeBadge } from "@/components/ui";
import { say } from "@/lib/meeting";
import { CAST, setAppLayout } from "@/office/layout";
import { Office } from "@/office/Office";
import type { AgentScene, RoomId, RoomState, Scene } from "@/office/types";
import { Face } from "@/office-app/bits";

/* ------------------------------------------------------------------ pieces */

function Lock() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4 7V5a4 4 0 1 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
    </svg>
  );
}

function Choice({ label, sub, selected, allowed, onPick, badge }: { label: string; sub?: string; selected: boolean; allowed: boolean; onPick: () => void; badge?: string }) {
  return (
    <button
      onClick={() => allowed && onPick()}
      title={allowed ? undefined : "Not available in this demo"}
      className={`group relative flex w-full items-center gap-3 rounded-[16px] px-3.5 py-3 text-left ring-1 transition-all ${
        selected ? "bg-ink text-white ring-ink" : allowed ? "bg-white text-ink ring-black/[0.08] hover:ring-black/25" : "cursor-not-allowed bg-white/50 text-faint ring-black/[0.05]"
      }`}
    >
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ring-2 ${selected ? "bg-white ring-white" : allowed ? "ring-black/20" : "ring-black/10"}`}>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold">{label}</span>
        {sub && <span className={`block text-[12px] ${selected ? "text-white/65" : "text-muted"}`}>{sub}</span>}
      </span>
      {badge && <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${selected ? "bg-white/15 text-white" : "bg-[#fff4ec] text-[#a24d1f]"}`}>{badge}</span>}
      {!allowed && (
        <span className="flex items-center gap-1 text-[10.5px] font-semibold text-faint">
          <Lock /> Not in demo
        </span>
      )}
    </button>
  );
}

function Locked({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</span>
      <span className="flex h-11 items-center justify-between rounded-[14px] bg-white px-3.5 text-[14px] font-semibold text-ink ring-1 ring-black/[0.08]" title="Fixed for this demo">
        {value}
        <span className="flex items-center gap-1 text-[10.5px] font-semibold text-faint">
          <Lock /> demo
        </span>
      </span>
    </label>
  );
}

function Check({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] bg-white px-3.5 py-3 ring-1 ring-black/[0.08]">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] bg-ink text-[11px] font-bold text-white">✓</span>
      <span>
        <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
        {sub && <span className="block text-[12px] text-muted">{sub}</span>}
      </span>
    </div>
  );
}

function Seg({ value, options }: { value: string; options: { v: string; l: string; ok?: boolean }[] }) {
  return (
    <div className="inline-flex rounded-full bg-[#f2f0ec] p-0.5">
      {options.map((o) => (
        <span
          key={o.v}
          title={o.v === value ? undefined : "Not available in this demo"}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${o.v === value ? "bg-white text-ink shadow-sm" : "text-faint"}`}
        >
          {o.v !== value && <Lock />}
          {o.l}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ scenes */

const DEV = ["pm", "fe", "be", "ops", "qa"];
const MKT = ["strat", "cr1", "cr2", "editor"];

function scene(opts: {
  rooms: Partial<Record<RoomId, RoomState>>;
  hired?: string[];
  walking?: string[];
  camera?: Scene["camera"];
  ada?: string;
  locked?: RoomId[];
  notes?: Scene["roomNotes"];
  status?: AgentScene["status"];
  people?: string[];
  peopleWalking?: boolean;
  nina?: string;
}): Scene {
  const agents: Record<string, AgentScene> = {
    you: { at: "seat:you" },
    ada: { at: "ada:home", bubble: opts.ada ? { text: opts.ada, tone: "ada" } : null },
  };
  (opts.people ?? []).forEach((id, i) => {
    agents[id] = { at: id === "jordan" ? "lobby:1" : `seat:${id}`, ...(opts.peopleWalking ? { from: "hall:entry", delay: 0.3 + i * 0.5, speed: 1.3 } : {}) };
  });
  if (opts.nina) agents.nina = { at: opts.nina, from: "hall:entry", speed: 1.2, delay: 0.4 };
  (opts.hired ?? []).forEach((id, i) => {
    agents[id] = { at: `seat:${id}`, status: opts.status ?? "idle", ...(opts.walking?.includes(id) ? { from: "ceo:outside", delay: i * 0.45, speed: 1.4 } : {}) };
  });
  return { rooms: { ceo: "built", dev: "blueprint", marketing: "blueprint", meeting: "blueprint", sales: "blueprint", legal: "blueprint", finance: "blueprint", ...opts.rooms }, agents, camera: opts.camera, locked: opts.locked, roomNotes: opts.notes, labels: true };
}

/* ------------------------------------------------------------------- steps */

type StepId = "welcome" | "company" | "goal" | "rooms" | "dev" | "marketing" | "team" | "tools" | "rules" | "calendar" | "review" | "memory" | "join-code" | "join-profile" | "join-room";
const CREATE: StepId[] = ["welcome", "company", "goal", "rooms", "dev", "marketing", "team", "tools", "rules", "calendar", "review", "memory"];
const JOIN: StepId[] = ["welcome", "join-code", "join-profile", "join-room"];
const PEOPLE = ["priya", "sam", "marco", "lena"];

export type StartAs = { as: "ceo" } | { as: "nina"; via: "office" | "room" };

const TITLES: Record<StepId, string> = {
  team: "Your people",
  "join-code": "Your invite",
  "join-profile": "About you",
  "join-room": "Your room",
  welcome: "Meet Ada",
  company: "Your company",
  goal: "First goal",
  rooms: "Rooms",
  dev: "Development team",
  marketing: "Marketing team",
  tools: "Tools",
  rules: "Rules",
  calendar: "Calendar",
  review: "Read-back",
  memory: "Opening the office",
};

const ADA: Record<StepId, string> = {
  welcome: "Hi, I'm Ada, the office manager. Are you setting up a new office, or joining one you've been invited to?",
  team: "Now your people. Each room can have a human lead: the agent head reports to them, and they report to you.",
  "join-code": "Welcome to Bookwell! Which invite did you get?",
  "join-profile": "This is how the team will see you.",
  "join-room": "Here's how it works for you once you're in.",
  company: "Let's start with the basics. What's the company, and what does it do?",
  goal: "What should the company achieve first? And what must never happen?",
  rooms: "For that goal I'd start with two rooms. You can add any other team later, in a sentence.",
  dev: "Here's the development team I'd hire. Each agent gets its own runtime and tools.",
  marketing: "And a marketing team to launch it. Drafts always come to you first.",
  tools: "Connect the tools your work already lives in. Agents only reach what you connect.",
  rules: "Now the rules. Who can do what, what needs you, budgets, and what to do when blocked.",
  calendar: "I'll book meetings with you around your calendar, always with a pre-read.",
  review: "Before I apply anything, here's everything read back to you.",
  memory: "Done. I'm writing what I learned into company memory and briefing everyone.",
};

const TOOLS: { n: string; ok: boolean; why?: string }[] = [
  { n: "GitHub", ok: true },
  { n: "Linear", ok: true },
  { n: "Slack", ok: true },
  { n: "Notion", ok: true },
  { n: "Google Docs", ok: true },
  { n: "LinkedIn", ok: true },
  { n: "Figma", ok: true },
  { n: "Vercel", ok: true },
  { n: "Sentry", ok: true },
  { n: "Jira", ok: false },
  { n: "HubSpot", ok: false },
  { n: "Stripe", ok: false },
];

const READBACK = [
  "Create Development: a PM to lead, frontend, backend, DevOps and a tester",
  "Create Marketing: a strategist to lead, two creators and an editor",
  "Invite Priya to lead Development (the PM reports to her) with Sam",
  "Invite Marco to lead Marketing (the Strategist reports to him) with Lena",
  "New agents: anyone can ask, Ada reviews, you approve",
  "Connect GitHub, Linear, Slack, Notion, Google Docs, LinkedIn, Figma, Vercel and Sentry",
  "Lock: nobody posts publicly without your approval",
  "Lock: nothing merges to main without your approval",
  "Budgets: Development $400 a week, Marketing $150 a week",
  "When blocked: Development parks and switches, Marketing makes a best guess and flags it",
  "Meetings: 10 minutes with a pre-read, never in your focus time",
];

const MEMORY = [
  ["Company charter", "Bookwell: online booking for physio clinics"],
  ["Company goal", "Launch online booking in two weeks"],
  ["Your preferences", "Approve anything public · never double-book · merges need you"],
  ["Development charter", "Derived from the company charter"],
  ["Marketing charter", "Derived from the company charter"],
  ["Role cards", "9 agents, one each"],
  ["CLAUDE.md / AGENTS.md", "Generated for every runtime"],
];

export function Onboarding({ onDone }: { onDone: (as: StartAs) => void }) {
  const [i, setI] = useState(0);
  const [mode, setMode] = useState<"create" | "join">("create");
  const ORDER = mode === "create" ? CREATE : JOIN;
  const step = ORDER[i];
  const [voice, setVoice] = useState(false);
  const [invited, setInvited] = useState(false);
  const [via, setVia] = useState<"office" | "room" | null>(null);

  // People get desks in the office app; show them while it's being built.
  useEffect(() => {
    setAppLayout(true);
    return () => setAppLayout(false);
  }, []);
  const [company, setCompany] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [hiredDev, setHiredDev] = useState(false);
  const [hiredMkt, setHiredMkt] = useState(false);
  const [connected, setConnected] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [cal, setCal] = useState<string[]>([]);
  const [ticks, setTicks] = useState(0);
  const [mem, setMem] = useState(0);

  useEffect(() => {
    if (voice) say(ADA[step], "ada");
  }, [step, voice]);

  // Animated read-back and memory seeding.
  useEffect(() => {
    if (step !== "review") return;
    const t = setInterval(() => setTicks((v) => (v >= READBACK.length ? (clearInterval(t), v) : v + 1)), 380);
    return () => clearInterval(t);
  }, [step]);
  useEffect(() => {
    if (step !== "memory") return;
    const t = setInterval(() => setMem((v) => (v >= MEMORY.length ? (clearInterval(t), v) : v + 1)), 450);
    return () => clearInterval(t);
  }, [step]);

  const required = TOOLS.filter((t) => t.ok).map((t) => t.n);
  const canNext: Record<StepId, boolean> = {
    welcome: true,
    company: !!company && !!size,
    goal: !!goal,
    rooms: true,
    dev: hiredDev,
    marketing: hiredMkt,
    team: invited,
    "join-code": !!via,
    "join-profile": true,
    "join-room": true,
    tools: required.every((t) => connected.includes(t)),
    rules: true,
    calendar: true,
    review: ticks >= READBACK.length,
    memory: mem >= MEMORY.length,
  };

  const sc = useMemo<Scene>(() => {
    const ghostAll = { sales: "blueprint", legal: "blueprint", finance: "blueprint" } as const;
    switch (step) {
      case "welcome":
      case "company":
      case "goal":
        return scene({ rooms: {}, camera: "ceo", ada: step === "welcome" ? "Hi! I'm Ada." : step === "company" ? "Tell me about the company." : "What comes first?" });
      case "rooms":
        return scene({ rooms: { dev: "ghost", marketing: "ghost" }, camera: ["ceo", "dev", "marketing"], ada: "Two rooms to start." });
      case "dev":
        return scene({ rooms: { dev: hiredDev ? "built" : "ghost", marketing: "ghost" }, hired: hiredDev ? DEV : [], walking: DEV, camera: { x: 4, y: 0, w: 33, h: 16 } });
      case "marketing":
        return scene({ rooms: { dev: "built", marketing: hiredMkt ? "built" : "ghost" }, hired: hiredMkt ? [...DEV, ...MKT] : DEV, walking: MKT, camera: { x: 13, y: 0, w: 37, h: 16 } });
      case "team":
        return scene({ rooms: { dev: "built", marketing: "built" }, hired: [...DEV, ...MKT], camera: { x: 0, y: 0, w: 50, h: 16 }, people: invited ? PEOPLE : [], peopleWalking: true, ada: invited ? "Your team is walking in." : "Who's on the team?" });
      case "join-code":
      case "join-profile":
        return scene({ rooms: { dev: "built", marketing: "built", meeting: "built" }, hired: [...DEV, ...MKT], camera: { x: 0, y: 0, w: 50, h: 16 }, people: [...PEOPLE, "jordan"], locked: ["dev", "marketing"], ada: step === "join-code" ? "Welcome!" : "Nice to meet you." });
      case "join-room":
        return scene({ rooms: { dev: "built", marketing: "built", meeting: "built" }, hired: [...DEV, ...MKT], camera: via === "room" ? { x: 26, y: 0, w: 24, h: 15 } : { x: 0, y: 4, w: 28, h: 13 }, people: [...PEOPLE, "jordan"], nina: via === "room" ? "mkt:new" : "lobby:2", ada: via === "room" ? "Marco's expecting you." : "The CEO will pick your room." });
      case "tools":
        return scene({ rooms: { dev: "built", marketing: "built", ...ghostAll }, hired: [...DEV, ...MKT], people: PEOPLE, camera: ["ceo", "dev", "marketing"], ada: connected.length ? `${connected.length} tools connected` : "Connect your tools." });
      case "rules":
        return scene({ rooms: { dev: "built", marketing: "built" }, hired: [...DEV, ...MKT], people: PEOPLE, camera: ["ceo", "dev", "marketing"], locked: ["dev", "marketing"], notes: { dev: "When blocked: park and switch", marketing: "When blocked: best guess, flag it" } });
      case "calendar":
        return scene({ rooms: { dev: "built", marketing: "built", meeting: "built" }, hired: [...DEV, ...MKT], people: PEOPLE, camera: ["ceo", "meeting"], locked: ["dev", "marketing"], ada: "Meeting room's ready." });
      default:
        return scene({ rooms: { dev: "built", marketing: "built", meeting: "built", sales: "ghost", legal: "ghost", finance: "ghost" }, hired: [...DEV, ...MKT], people: PEOPLE, status: step === "memory" ? "working" : "idle", locked: ["dev", "marketing"], ada: step === "memory" ? "Your office is open." : "Here's the read-back." });
    }
  }, [step, hiredDev, hiredMkt, connected.length, invited, via]);

  const connect = (n: string) => {
    setConnecting(n);
    setTimeout(() => {
      setConnected((v) => [...v, n]);
      setConnecting(null);
    }, 650);
  };
  const connectAll = () => required.filter((n) => !connected.includes(n)).forEach((n, k) => setTimeout(() => setConnected((v) => (v.includes(n) ? v : [...v, n])), 160 * k));

  const body: Record<StepId, ReactNode> = {
    welcome: (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Choice label="Set up a new office" sub="You're the CEO. Ada builds the company with you." selected={mode === "create"} allowed onPick={() => setMode("create")} />
          <Choice label="Join with an invite" sub="Someone invited you with a code or a room link" selected={mode === "join"} allowed onPick={() => setMode("join")} badge="New" />
        </div>
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-muted">How would you like to talk to Ada?</div>
          <div className="grid grid-cols-2 gap-1.5">
            <Choice label="Chat" sub="Type" selected={!voice} allowed onPick={() => setVoice(false)} />
            <Choice label="Voice" sub="Ada speaks" selected={voice} allowed onPick={() => setVoice(true)} />
          </div>
        </div>
        <div className="text-[12px] text-muted">This is a guided demo: you&apos;ll see every option, but only the ones that build the demo office can be picked.</div>
      </div>
    ),
    team: (
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-[16px] bg-white ring-1 ring-black/[0.08]">
          {[
            ["priya", "Priya Raman", "priya@bookwell.app", "Development", "Lead"],
            ["sam", "Sam Okafor", "sam@bookwell.app", "Development", "Member"],
            ["marco", "Marco Bianchi", "marco@bookwell.app", "Marketing", "Lead"],
            ["lena", "Lena Park", "lena@bookwell.app", "Marketing", "Member"],
          ].map(([id, n, e, r, role], k) => (
            <motion.div key={id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.06 }} className="flex items-center gap-2.5 border-b border-black/[0.05] px-3 py-2.5 last:border-0">
              <Face id={id} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink">{n}</div>
                <div className="truncate text-[11.5px] text-muted">{e}</div>
              </div>
              <span className="text-[11.5px] font-semibold text-ink-2">{r}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${role === "Lead" ? "bg-[#2b4fb8] text-white" : "bg-[#eef2fc] text-[#21409a]"}`}>{role}</span>
              {invited && <span className="text-[12px] text-ok">✓</span>}
            </motion.div>
          ))}
        </div>
        <div className="rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.08]">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Hierarchy</div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] font-semibold text-ink">Agent heads report to</span>
            <Seg value="lead" options={[{ v: "lead", l: "Room lead" }, { v: "ceo", l: "You" }]} />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] font-semibold text-ink">Who can change a room</span>
            <Seg value="room" options={[{ v: "room", l: "Everyone in it" }, { v: "lead", l: "Lead only" }]} />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] font-semibold text-ink">Adding agents</span>
            <span className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
              <Lock /> Ada + you approve
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-[16px] bg-[#eef2fc] px-3.5 py-3 ring-1 ring-[#d5def5]">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-[#21409a]">Office invite code</div>
            <div className="font-mono text-[16px] font-semibold tracking-[0.06em] text-ink">BKW-7Q4M</div>
            <div className="text-[11.5px] text-[#21409a]/75">Anyone else who joins waits in the lobby until you or Ada gives them a room.</div>
          </div>
        </div>
        <button
          disabled={invited}
          onClick={() => setInvited(true)}
          className={`rounded-full py-2.5 text-[13.5px] font-semibold transition-colors ${invited ? "bg-[#eaf6ee] text-[#24603a]" : "bg-[#2b4fb8] text-white hover:bg-[#22409a]"}`}
        >
          {invited ? "✓ 4 invites sent. They're walking in." : "Send 4 invites"}
        </button>
      </div>
    ),
    "join-code": (
      <div className="flex flex-col gap-2">
        <Choice label="Office code · BKW-7Q4M" sub="From the CEO. You wait in the lobby until you're given a room." selected={via === "office"} allowed onPick={() => setVia("office")} />
        <Choice label="Room link · floorplan.app/join/mkt-r8w2" sub="From Marco. Takes you straight into Marketing." selected={via === "room"} allowed onPick={() => setVia("room")} />
        <Choice label="Another company's code" selected={false} allowed={false} onPick={() => {}} />
        <div className="mt-1 text-[12px] text-muted">Both are real paths in FloorPlan. Try one now, and the other from the start again.</div>
      </div>
    ),
    "join-profile": (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.08]">
          <Face id="nina" size={52} />
          <div>
            <div className="text-[15px] font-semibold text-ink">Nina Patel</div>
            <div className="text-[12.5px] text-muted">Brand designer · nina@bookwell.app</div>
            <div className="mt-1 text-[11.5px] text-[#21409a]">Invited by Marco, Wed 17:20</div>
          </div>
        </div>
        <Locked label="Display name" value="Nina" />
        <Locked label="Title" value="Brand designer" />
        <div className="flex flex-col gap-1.5">
          <Check label="Mic muted when you join a call" sub="Unmute any time. Your words go into the transcript." />
          <Check label="Camera off until you turn it on" sub="Your avatar shows instead." />
        </div>
      </div>
    ),
    "join-room": (
      <div className="flex flex-col gap-3">
        <div className="rounded-[16px] bg-[#eef2fc] px-3.5 py-3 text-[13px] leading-snug text-[#21409a] ring-1 ring-[#d5def5]">
          {via === "room" ? (
            <>
              You&apos;re joining <b>Marketing</b> as a member. <b>Marco</b> is your lead, and the <b>Strategist</b> (the room&apos;s agent head) reports to him.
            </>
          ) : (
            <>
              You&apos;ll start in the <b>lobby</b>. I&apos;ve told the CEO you&apos;re here; they or I will give you a room. Jordan&apos;s waiting there too.
            </>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Check label="Chat in #general from any room, and DM anyone" sub="Mention an agent, like @Strategist, to pull it in" />
          <Check label="Voice and video with whoever's in your room" sub="Add agents to the call and they speak up" />
          <Check label="Change your room's spec and rules" sub="Your lead is told, and every change is versioned" />
          <Check label="Ask for new agents" sub="Ada reviews the budget, the CEO approves" />
          <Check label="Assign work to your room's agents" sub="Other rooms' work goes through their lead" />
        </div>
      </div>
    ),
    company: (
      <div className="flex flex-col gap-4">
        <Locked label="Company name" value="Bookwell" />
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-muted">What does Bookwell do?</div>
          <div className="flex flex-col gap-1.5">
            <Choice label="Booking software for physio clinics" sub="B2B software" selected={company === "b"} allowed onPick={() => setCompany("b")} />
            <Choice label="An online store" selected={false} allowed={false} onPick={() => {}} />
            <Choice label="A marketing agency" selected={false} allowed={false} onPick={() => {}} />
            <Choice label="Something else" selected={false} allowed={false} onPick={() => {}} />
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-muted">Who&apos;s running it?</div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ["Solo founder", false],
              ["Small team", true],
              ["Established company", false],
            ].map(([l, ok]) => (
              <button
                key={l as string}
                onClick={() => ok && setSize(l as string)}
                title={ok ? undefined : "Not available in this demo"}
                className={`rounded-[14px] px-2 py-2.5 text-[12.5px] font-semibold ring-1 ${size === l ? "bg-ink text-white ring-ink" : ok ? "bg-white text-ink ring-black/[0.08] hover:ring-black/25" : "cursor-not-allowed bg-white/50 text-faint ring-black/[0.05]"}`}
              >
                {!ok && <Lock />} {l as string}
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    goal: (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Choice label="Launch online booking in two weeks" sub="Ship the product and its launch campaign" selected={goal === "launch"} allowed onPick={() => setGoal("launch")} badge="Recommended" />
          <Choice label="Grow to 100 clinics" selected={false} allowed={false} onPick={() => {}} />
          <Choice label="Cut support time in half" selected={false} allowed={false} onPick={() => {}} />
        </div>
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-muted">What must never happen?</div>
          <div className="flex flex-col gap-1.5">
            <Check label="A double booking" sub="Becomes a rule for Development" />
            <Check label="Anything public without my approval" sub="Becomes a locked rule" />
            <Check label="Code merged without my approval" sub="Becomes a locked rule" />
          </div>
        </div>
      </div>
    ),
    rooms: (
      <div className="flex flex-col gap-1.5">
        <Choice label="Development" sub="Builds and ships the product · head: PM" selected allowed onPick={() => {}} badge="5 agents" />
        <Choice label="Marketing" sub="Plans and runs the launch · head: Strategist" selected allowed onPick={() => {}} badge="4 agents" />
        <Choice label="Sales" sub="Leads, outreach, deals" selected={false} allowed={false} onPick={() => {}} />
        <Choice label="Legal" sub="Contracts and compliance" selected={false} allowed={false} onPick={() => {}} />
        <Choice label="Finance" sub="Books, invoices, reports" selected={false} allowed={false} onPick={() => {}} />
        <div className="mt-1 text-[12px] text-muted">Every room gets a spec: what it owns, what done means, what it produces.</div>
      </div>
    ),
    dev: <TeamStep ids={DEV} hired={hiredDev} onHire={() => setHiredDev(true)} room="Development" />,
    marketing: <TeamStep ids={MKT} hired={hiredMkt} onHire={() => setHiredMkt(true)} room="Marketing" />,
    tools: (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-1.5">
          {TOOLS.map((t) => {
            const on = connected.includes(t.n);
            return (
              <button
                key={t.n}
                disabled={!t.ok || on}
                onClick={() => connect(t.n)}
                title={t.ok ? undefined : "Not used in this demo"}
                className={`flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-left ring-1 transition-colors ${on ? "bg-[#eaf6ee] ring-[#bfe2cb]" : t.ok ? "bg-white ring-black/[0.08] hover:ring-black/25" : "cursor-not-allowed bg-white/50 opacity-60 ring-black/[0.05]"}`}
              >
                <BrandIcon name={t.n} size={16} mono={!t.ok} />
                <span className="flex-1 text-[12.5px] font-semibold text-ink">{t.n}</span>
                <span className="text-[11px] font-semibold">{on ? <span className="text-ok">✓</span> : connecting === t.n ? <span className="text-muted">…</span> : t.ok ? <span className="text-ink">Connect</span> : <span className="flex items-center gap-1 text-faint"><Lock /></span>}</span>
              </button>
            );
          })}
        </div>
        {!canNext.tools && (
          <button onClick={connectAll} className="self-start rounded-full bg-[#fff4ec] px-3 py-1.5 text-[12px] font-semibold text-[#a24d1f] ring-1 ring-[#f3cfb6]">
            Connect all recommended
          </button>
        )}
      </div>
    ),
    rules: (
      <div className="flex flex-col gap-3">
        <div className="rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.08]">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Locked rules</div>
          {["Nobody posts publicly without my approval", "Nothing merges to main without my approval"].map((r) => (
            <div key={r} className="flex items-center gap-2.5 py-1.5 text-[13px] font-semibold text-ink">
              <span className="grid h-6 w-6 place-items-center rounded-[8px] bg-ink text-white">
                <Lock />
              </span>
              {r}
            </div>
          ))}
          <div className="mt-1 text-[11.5px] text-muted">Only you can unlock these. Ada can never change them from chat.</div>
        </div>
        <div className="rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.08]">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">When a room is blocked</div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] font-semibold text-ink">Development</span>
            <Seg value="park" options={[{ v: "park", l: "Park" }, { v: "guess", l: "Best guess" }, { v: "wait", l: "Wait" }]} />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] font-semibold text-ink">Marketing</span>
            <Seg value="guess" options={[{ v: "park", l: "Park" }, { v: "guess", l: "Best guess" }, { v: "wait", l: "Wait" }]} />
          </div>
        </div>
        <div className="rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.08]">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Weekly budgets</div>
          {[
            ["Development", 400],
            ["Marketing", 150],
          ].map(([r, v]) => (
            <div key={r as string} className="flex items-center gap-3 py-1">
              <span className="w-[96px] text-[13px] font-semibold text-ink">{r}</span>
              <div className="h-1.5 flex-1 rounded-full bg-black/10">
                <div className="h-full rounded-full bg-ink" style={{ width: `${((v as number) / 500) * 100}%` }} />
              </div>
              <span className="w-12 text-right text-[13px] font-semibold">${v as number}</span>
            </div>
          ))}
          <div className="mt-1 text-[11.5px] text-muted">Plus a per-conversation limit, so chatty threads can&apos;t burn budget.</div>
        </div>
      </div>
    ),
    calendar: (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            ["Google Calendar", "google"],
            ["Apple Calendar", "apple"],
          ].map(([l, k]) => {
            const on = cal.includes(k);
            return (
              <button key={k} onClick={() => !on && setCal((v) => [...v, k])} className={`flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-left ring-1 ${on ? "bg-[#eaf6ee] ring-[#bfe2cb]" : "bg-white ring-black/[0.08] hover:ring-black/25"}`}>
                {k === "google" ? <BrandIcon name="Google Calendar" size={16} /> : <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-[#ff3b30] text-[7px] font-bold text-white">31</span>}
                <span className="flex-1 text-[12.5px] font-semibold text-ink">{l}</span>
                <span className="text-[11px] font-semibold">{on ? <span className="text-ok">✓</span> : "Connect"}</span>
              </button>
            );
          })}
        </div>
        <div className="text-[11.5px] text-muted">Optional. In this demo the connection is simulated.</div>
        <div className="flex flex-col gap-1.5">
          <Check label="Meetings are 10 minutes, with a pre-read" sub="The question, the options, each agent's position" />
          <Check label="Never during focus time" sub="13:30–15:00 every day" />
          <Check label="Ada merges related requests" sub="Small ones become inbox items instead" />
        </div>
      </div>
    ),
    review: (
      <div className="rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.08]">
        <div className="flex flex-col gap-2">
          {READBACK.map((r, k) => (
            <div key={r} className="flex items-start gap-2.5">
              <motion.span
                animate={k < ticks ? { scale: [0.6, 1.15, 1], opacity: 1 } : { scale: 1, opacity: 0.35 }}
                className={`mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[10.5px] font-bold text-white ${k < ticks ? "bg-ok" : "bg-black/20"}`}
              >
                ✓
              </motion.span>
              <span className={`text-[13px] leading-snug ${k < ticks ? "text-ink" : "text-faint"}`}>{r}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-black/[0.06] pt-2.5 text-[12px] text-muted">Saved as configuration v1. Every change after this is versioned with one-click rollback.</div>
      </div>
    ),
    memory: (
      <div className="flex flex-col gap-1.5">
        {MEMORY.map(([t, sub], k) => (
          <motion.div
            key={t}
            initial={false}
            animate={{ opacity: k < mem ? 1 : 0.3, x: k < mem ? 0 : -4 }}
            className="flex items-center gap-2.5 rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-black/[0.06]"
          >
            <span className={`grid h-6 w-6 place-items-center rounded-[8px] text-[11px] font-bold ${k < mem ? "bg-[#fff4ec] text-[#a24d1f]" : "bg-[#f2f0ec] text-faint"}`}>◈</span>
            <span className="flex-1">
              <span className="block text-[13px] font-semibold text-ink">{t}</span>
              <span className="block text-[11.5px] text-muted">{sub}</span>
            </span>
            {k < mem && <span className="text-[12px] text-ok">✓</span>}
          </motion.div>
        ))}
      </div>
    ),
  };

  const last = i === ORDER.length - 1;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#e9e3d8]">
      <div className="absolute inset-0 lg:left-[440px]">
        <Office scene={sc} rounded={false} />
      </div>

      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-white/95 py-1.5 pl-1.5 pr-3 shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] lg:left-[456px]">
        <Link href="/">
          <LogoMark size={26} />
        </Link>
        <span className="text-[13px] font-semibold text-ink">{mode === "join" ? "Join Bookwell" : "Set up your office"}</span>
        <span className="text-[12px] text-muted">· demo</span>
      </div>
      <Link href="/office" className="absolute right-3 top-3 z-20 rounded-full bg-white/95 px-3.5 py-2 text-[12.5px] font-semibold text-ink-2 shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] hover:text-ink">
        Skip to the office →
      </Link>

      <div className="absolute inset-x-3 bottom-3 z-30 flex max-h-[62vh] flex-col overflow-hidden rounded-[26px] bg-[#f7f6f3] shadow-[var(--shadow-float)] ring-1 ring-black/[0.06] lg:inset-y-3 lg:left-3 lg:right-auto lg:max-h-none lg:w-[424px]">
        <div className="flex items-center gap-3 border-b border-black/[0.06] bg-white px-4 py-3">
          <Face id="ada" size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-ink">Ada</div>
            <div className="text-[11.5px] text-muted">
              Step {i + 1} of {ORDER.length} · {TITLES[step]}
            </div>
          </div>
          <button onClick={() => setVoice((v) => !v)} className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${voice ? "bg-ink text-white" : "bg-[#f2f0ec] text-muted"}`}>
            {voice ? "🔊 Voice on" : "🔈 Voice off"}
          </button>
        </div>
        <div className="h-1 w-full bg-black/[0.05]">
          <motion.div className="h-full bg-accent" animate={{ width: `${((i + 1) / ORDER.length) * 100}%` }} transition={{ type: "spring", stiffness: 160, damping: 26 }} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-end gap-2">
                <Face id="ada" size={26} />
                <div className="rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2.5 text-[14px] leading-[1.45] text-ink ring-1 ring-black/[0.06]">{ADA[step]}</div>
              </div>
              {body[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] bg-white px-4 py-3">
          <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} className="rounded-full px-3 py-2 text-[13px] font-semibold text-muted hover:text-ink disabled:opacity-30">
            Back
          </button>
          <button
            disabled={!canNext[step]}
            onClick={() => (last ? onDone(mode === "join" ? { as: "nina", via: via ?? "office" } : { as: "ceo" }) : setI((v) => v + 1))}
            className="rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity disabled:opacity-35"
          >
            {last ? (mode === "join" ? (via === "room" ? "Walk into Marketing →" : "Walk into the lobby →") : "Walk into your office →") : step === "review" ? "Confirm and apply" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamStep({ ids, hired, onHire, room }: { ids: string[]; hired: boolean; onHire: () => void; room: string }) {
  const TOOLS_FOR: Record<string, string[]> = {
    pm: ["Linear", "GitHub", "Slack"],
    fe: ["GitHub", "Figma", "Vercel"],
    be: ["GitHub", "Linear", "Sentry"],
    ops: ["GitHub", "Vercel", "Sentry"],
    qa: ["GitHub", "Linear"],
    strat: ["Notion", "Google Docs", "LinkedIn"],
    cr1: ["Google Docs", "LinkedIn"],
    cr2: ["Figma"],
    editor: ["Google Docs", "Notion"],
  };
  const RUNTIME: Record<string, string> = { pm: "Claude Code", fe: "Claude Code", be: "Codex", ops: "Codex", qa: "Claude Code", strat: "Claude Code", cr1: "Claude Code", cr2: "Codex", editor: "Claude Code" };
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-[16px] bg-white ring-1 ring-black/[0.08]">
        {ids.map((id, k) => (
          <motion.div key={id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.06 }} className="flex items-center gap-2.5 border-b border-black/[0.05] px-3 py-2.5 last:border-0">
            <Face id={id} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                {CAST[id].role}
                {CAST[id].head && <span className="rounded bg-ink px-1 text-[9px] font-bold uppercase text-white">Head</span>}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {TOOLS_FOR[id].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#f6f5f2] px-1.5 py-[1px] text-[10.5px] font-semibold text-ink-2">
                    <BrandIcon name={t} size={10} /> {t}
                  </span>
                ))}
              </div>
            </div>
            <span title="Runtime is fixed in this demo">
              <RuntimeBadge runtime={RUNTIME[id]} />
            </span>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-muted">Runtimes and tools are preset for the demo. You can change them later in Config.</span>
      </div>
      <button
        disabled={hired}
        onClick={onHire}
        className={`rounded-full py-2.5 text-[13.5px] font-semibold transition-colors ${hired ? "bg-[#eaf6ee] text-[#24603a]" : "bg-[#fff4ec] text-[#a24d1f] ring-1 ring-[#f3cfb6] hover:bg-[#fde9da]"}`}
      >
        {hired ? `✓ ${ids.length} agents hired into ${room}` : `Hire ${ids.length} agents`}
      </button>
    </div>
  );
}
