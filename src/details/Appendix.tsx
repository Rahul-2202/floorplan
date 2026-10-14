"use client";

import { useState, type ReactNode } from "react";
import { PersonSvg } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { Reveal } from "@/components/ui";

function Block({ id, kicker, title, sub, children }: { id: string; kicker: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-[1180px] scroll-mt-24 px-5 py-14 md:px-8 md:py-20">
      <Reveal>
        <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-accent">{kicker}</div>
        <h2 className="h-section mt-2 text-[clamp(26px,3vw,38px)] text-ink">{title}</h2>
        {sub && <p className="mt-3 max-w-[680px] text-[16px] leading-[1.55] text-muted">{sub}</p>}
      </Reveal>
      <Reveal delay={0.08} className="mt-8">
        {children}
      </Reveal>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-[#f6f5f2]">
              {head.map((h) => (
                <th key={h} className="px-5 py-3 text-[11.5px] font-bold uppercase tracking-wide text-faint">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-black/[0.05] align-top">
                {r.map((c, k) => (
                  <td key={k} className={`px-5 py-3.5 text-[14px] leading-[1.5] ${k === 0 ? "font-semibold text-ink" : "text-ink-2"}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- org chart */

function Node({ x, y, id, label, sub, w = 132 }: { x: number; y: number; id: string; label: string; sub?: string; w?: number }) {
  const m = CAST[id];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={58} rx={14} fill="#fff" stroke="rgba(10,10,10,0.08)" />
      <g transform="translate(10 12)">
        <rect width={34} height={34} rx={10} fill={id === "ada" ? "#fbe9de" : "#f1ede6"} />
        <g transform="translate(6.5 4) scale(1.5)">
          <PersonSvg look={m.look} />
        </g>
      </g>
      <text x={52} y={27} fontSize={13} fontWeight={600} fill="#0a0a0a" fontFamily="var(--font-sans)">
        {label}
      </text>
      {sub && (
        <text x={52} y={43} fontSize={11} fill="#6a6a66" fontFamily="var(--font-sans)">
          {sub}
        </text>
      )}
    </g>
  );
}

function OrgChart() {
  const dev = [
    { id: "fe", l: "Frontend" },
    { id: "be", l: "Backend" },
    { id: "ops", l: "DevOps" },
    { id: "qa", l: "Tester" },
  ];
  const mkt = [
    { id: "cr1", l: "Creator" },
    { id: "cr2", l: "Creator" },
    { id: "editor", l: "Editor" },
  ];
  const line = "rgba(10,10,10,0.18)";
  return (
    <div className="overflow-x-auto rounded-[24px] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05] md:p-6">
      <svg viewBox="0 0 1040 400" className="min-w-[760px]" style={{ width: "100%" }}>
        {/* CEO office */}
        <rect x={330} y={8} width={380} height={86} rx={20} fill="#fff4ec" stroke="#f3cfb6" strokeDasharray="5 4" />
        <text x={346} y={30} fontSize={10.5} fontWeight={700} fill="#a24d1f" letterSpacing="1">
          CEO OFFICE
        </text>
        <line x1={482} y1={65} x2={558} y2={65} stroke="#e8743b" strokeWidth={2} />
        <Node x={346} y={36} id="you" label="CEO (you)" sub="Decides" />
        <Node x={560} y={36} id="ada" label="Ada" sub="Office manager" />

        {/* CEO to heads */}
        <path d="M420 94 C 420 140, 230 130, 230 176" fill="none" stroke={line} strokeWidth={1.5} />
        <path d="M480 94 C 480 140, 790 130, 790 176" fill="none" stroke={line} strokeWidth={1.5} />
        <text x={250} y={140} fontSize={11} fill="#6a6a66">meetings, escalations</text>
        <text x={640} y={140} fontSize={11} fill="#6a6a66">meetings, escalations</text>

        {/* cross-team */}
        <line x1={300} y1={205} x2={724} y2={205} stroke="#7b6cd9" strokeWidth={1.5} strokeDasharray="6 5" />
        <rect x={452} y={194} width={120} height={22} rx={11} fill="#f1eefd" />
        <text x={512} y={209} fontSize={11} fontWeight={600} fill="#4a3fa8" textAnchor="middle">
          cross-team
        </text>

        {/* rooms */}
        <rect x={10} y={160} width={480} height={232} rx={22} fill="#f4f6f0" stroke="rgba(10,10,10,0.05)" />
        <text x={28} y={184} fontSize={10.5} fontWeight={700} fill="#3c6b2c" letterSpacing="1">
          DEVELOPMENT ROOM
        </text>
        <rect x={550} y={160} width={480} height={232} rx={22} fill="#f5f2f9" stroke="rgba(10,10,10,0.05)" />
        <text x={568} y={184} fontSize={10.5} fontWeight={700} fill="#4a3fa8" letterSpacing="1">
          MARKETING ROOM
        </text>

        <Node x={168} y={176} id="pm" label="PM" sub="Head" />
        <Node x={726} y={176} id="strat" label="Strategist" sub="Head" />

        {dev.map((d, i) => {
          const x = 22 + i * 117;
          return (
            <g key={d.id}>
              <path d={`M234 234 C 234 268, ${x + 55} 270, ${x + 55} 312`} fill="none" stroke={line} strokeWidth={1.5} />
              <Node x={x} y={312} id={d.id} label={d.l} w={110} />
            </g>
          );
        })}
        {mkt.map((d, i) => {
          const x = 580 + i * 150;
          return (
            <g key={d.id + i}>
              <path d={`M792 234 C 792 268, ${x + 62} 270, ${x + 62} 312`} fill="none" stroke={line} strokeWidth={1.5} />
              <Node x={x} y={312} id={d.id} label={d.l} w={124} />
            </g>
          );
        })}
        <text x={250} y={300} fontSize={11} fill="#6a6a66" textAnchor="middle">members also talk to each other directly</text>
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------- content */

const CHANNELS = [
  ["Direct message", "Quick questions between two agents. Logged."],
  ["Room channel", "Team-wide matters inside a room."],
  ["Cross-team channel", "Heads only, for matters between rooms."],
  ["Meeting", "Anything that needs a decision. Produces minutes."],
  ["Message to the CEO", "A stuck agent flags it and moves on. Also lands in the attention inbox."],
];

const RULES = [
  ["Messages queue, they don't interrupt", "Agents check their inbox at natural break points: finishing a step, after a commit, before the next task."],
  ["Three urgency levels", "Normal waits for the next break point. Urgent waits for the next safe point. Stop halts now, and only a head, Ada or the CEO can send it."],
  ["Questions go direct, work goes through the head", "Anyone can ask anyone. A request that creates work for another room's member goes through that room's head."],
  ["The CEO can reach anyone, the head is copied", "So instructions never silently conflict."],
  ["No answer means escalation", "An unanswered question goes to the asker's head, then to the CEO's attention inbox."],
];

const LAYERS = [
  ["Company", "Ada", "Heads, who derive a room version"],
  ["Room", "Head (Ada's edits arrive as suggestions)", "Room members, Ada"],
  ["Agent", "Agent and head (Ada sets it up, then reviews)", "Agent, head"],
  ["Conversation", "Agent, reviewed by head", "Participants, head"],
  ["CEO preferences", "Ada", "Heads, filtered to what's relevant"],
  ["Short-term", "The agent itself", "The agent"],
];

const BLOCKED = [
  ["Park and switch", "Set the task aside, flag it, work on something else", "Most rooms"],
  ["Best guess and flag", "Continue on the most reasonable assumption, mark it for review", "Fast-moving, low-risk work"],
  ["Stop and wait", "Pause until the CEO or head answers", "Rooms where mistakes are expensive"],
];

const LIFECYCLE = [
  { t: "Trigger", d: "Escalation above the head's authority, a recurring cadence, or the CEO calling a head in." },
  { t: "While away", d: "The team keeps working on anything the decision doesn't touch; dependent work follows the when-blocked policy." },
  { t: "Meeting", d: "Recommendation, discussion, a decision or an explicit deferral with owner and date, then a read-back." },
  { t: "After", d: "Minutes. The head updates the source of truth and briefs the team; agents acknowledge." },
  { t: "Follow-up", d: "Ada tracks action items to done and flags any later contradiction back to the head." },
];

const GOVERNANCE = [
  ["Permissions", "Per agent and per room: who can merge to main, close tickets, post publicly."],
  ["Approvals", "Drafts go to the CEO by default. Direct publishing is an explicit opt-in."],
  ["Budgets", "Limits per room and per conversation, so always-on teams don't burn unbounded spend."],
  ["Read-back", "Every change Ada makes is confirmed as a plain-language checklist. No risk tiers."],
  ["Versioning", "All configuration is versioned with one-click rollback."],
  ["First-use check", "The first time an agent uses a powerful permission, it pauses and asks."],
  ["Locked settings", "Rules Ada can never change from chat. Only the CEO unlocks them, in the dashboard."],
  ["Permission requests", "Agents can ask for more; requests go through Ada to the CEO."],
];

const ARCH = {
  blocks: [
    "Structured company state: org config, room specs, policy table, budgets",
    "Runtime adapter layer plus a shared workspace (repo, files, tickets)",
    "Messaging layer: DMs, room and cross-team channels, meetings with minutes",
    "CEO surfaces: inbox, feed, dashboard, calendar, chat and voice; visual office on desktop, list view on mobile",
    "Memory system: layered files and objects with indexes",
  ],
  hard: [
    "Teams reliably producing useful output without constant correction",
    "Long-running work and state across sessions",
    "Keeping model costs predictable with many agents running",
    "Coordination between agents working on shared code",
  ],
};

const DECISIONS: [string, string][] = [
  ["Interface", "Desktop is a literal Gather-style visual office with rooms and avatars"],
  ["Interface", "Mobile is a list view: CEO dashboard of pending items plus Slack-like meeting rooms"],
  ["Interface", "v1 supports text and voice; agent-only meetings are text only"],
  ["Interface", "The CEO can walk into any room and read its meeting transcripts"],
  ["Memory", "Memory is files and backend objects with metadata; layers fixed, content editable"],
  ["Memory", "Office manager edits to room memory are suggestions the head accepts"],
  ["Memory", "Review is exception-based: routine updates auto-accepted, conflicts flagged"],
  ["Memory", "Cross-room agreements are one shared object both rooms link to"],
  ["Memory", "Lessons carry a source and confidence; heads catch obviously wrong ones"],
  ["Memory", "Any reader can flag an item as stale; duplicate flags merge; the owner fixes it"],
  ["Memory", "CEO preferences shown to heads are filtered by relevance to their room"],
  ["Memory", "The CEO can see and edit everything the company remembers"],
  ["Communication", "Unanswered questions escalate to the asker's head, then the CEO's inbox"],
  ["Communication", "CEO can message anyone; the room's head is copied automatically"],
  ["Communication", "Questions go direct to anyone; work requests for another room go through its head"],
  ["Communication", "Three urgency levels; only head, office manager, or CEO can send a stop"],
  ["Communication", "Messages queue and are handled at natural break points, not mid-task"],
  ["Communication", "Structured channels: DMs, room channel, cross-team channel for heads, meetings"],
  ["Governance", "Agents can request more permissions; requests go through the office manager to the CEO"],
  ["Governance", "Configuration is versioned with one-click rollback"],
  ["Governance", "Every office manager change is confirmed via a plain-language checklist; no risk tiers"],
  ["Governance", "Direct public posting is off by default; first-use check kept; CEO can lock settings"],
  ["CEO meetings", "Ada tracks action items from minutes; heads report completion"],
  ["CEO meetings", "Heads update the source of truth (Linear, Jira, work board, specs) after decisions"],
  ["CEO meetings", "Structured format: recommendation, discussion, decision or deferral, read-back"],
  ["CEO meetings", "Team keeps working on unaffected tasks while its head is with the CEO"],
  ["CEO meetings", "Three triggers: escalation, recurring cadence, CEO-initiated"],
  ["Escalation", "Agents are pingy by default and personalize over time through memory"],
  ["Meetings", "A missed meeting becomes a high-priority inbox item; the CEO calls the head in"],
  ["Meetings", "Joint meetings are chaired by the CEO or the office manager, as the user chooses"],
  ["Office manager", "Collects options by default when chairing; decision authority grows over time"],
  ["Office manager", "A front desk over structured state, not a single agent holding rules in memory"],
  ["Agents", "Multiple agents per room, each specializing; runtime chosen per agent"],
  ["Users", "The CEO is anyone orchestrating domain work on the platform"],
];

const OPEN = [
  { q: "Memory index compression as memory grows", s: "Later" },
  { q: "Memory refresh cascades after company-level changes", s: "Later" },
  { q: "Can the CEO speak in a room meeting they walk into, or only read the transcript?", s: "Open" },
];

const NEXT = [
  { t: "v1 scope", d: "Cut the spec into a first version that proves the core loop: Ada, one dev room, CEO meetings, memory and a basic visual office." },
  { t: "Competitor scan", d: "Check who is building multi-agent AI-company products today (CrewAI, AutoGen, MetaGPT, Devin, Lindy, Sintra) and where Ada, memory and the office stand out." },
  { t: "Technical architecture", d: "Turn the building blocks into a system design: runtime adapters, messaging, memory storage, office renderer and voice." },
];

const AREA_TONE: Record<string, string> = {
  Interface: "bg-[#e8eefb] text-[#2c56b0]",
  Memory: "bg-[#fff4ec] text-[#a24d1f]",
  Communication: "bg-[#eaf3e6] text-[#3c6b2c]",
  Governance: "bg-[#f0efed] text-ink-2",
  "CEO meetings": "bg-[#f1eefd] text-[#4a3fa8]",
  Meetings: "bg-[#f1eefd] text-[#4a3fa8]",
  Escalation: "bg-[#fdecea] text-[#9b2c24]",
  "Office manager": "bg-[#fbe9de] text-[#a24d1f]",
  Agents: "bg-[#eaf6ee] text-[#24603a]",
  Users: "bg-[#f0efed] text-ink-2",
};

function DecisionLog() {
  const areas = ["All", ...Array.from(new Set(DECISIONS.map((d) => d[0])))];
  const [area, setArea] = useState("All");
  const rows = DECISIONS.filter((d) => area === "All" || d[0] === area);
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {areas.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors ${a === area ? "bg-ink text-white" : "bg-white text-ink-2 ring-1 ring-black/[0.08] hover:bg-[#f2f0ec]"}`}
          >
            {a}
          </button>
        ))}
      </div>
      <Table
        head={["Area", "Decision"]}
        rows={rows.map(([a, d]) => [<span key="a" className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${AREA_TONE[a] ?? ""}`}>{a}</span>, d])}
      />
    </div>
  );
}

export function Appendix() {
  return (
    <div className="pb-24">
      <div className="mx-auto max-w-[1180px] px-5 pt-20 md:px-8">
        <div className="rounded-[28px] bg-ink px-6 py-10 text-white md:px-10">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#f0a37a]">Reference</div>
          <h2 className="h-section mt-2 text-[clamp(28px,3.4vw,44px)]">The rules behind the story.</h2>
          <p className="mt-3 max-w-[640px] text-[16px] leading-[1.55] text-white/70">
            Everything the walkthrough showed, as a quick reference for questions: the hierarchy, how agents talk, how memory and governance work, and
            what&apos;s decided versus still open.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              ["#ref-org", "Hierarchy"],
              ["#ref-comms", "Communication"],
              ["#ref-meetings", "CEO meetings"],
              ["#ref-memory", "Memory"],
              ["#ref-gov", "Governance"],
              ["#ref-arch", "Architecture"],
              ["#ref-decisions", "Decision log"],
              ["#ref-open", "Open questions"],
            ].map(([h, l]) => (
              <a key={h} href={h} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-white/20">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      <Block id="ref-org" kicker="Core concepts" title="An org chart, not a node graph." sub="The CEO at the top, Ada beside them, rooms below, a head in each room and specialists under each head.">
        <OrgChart />
      </Block>

      <Block id="ref-comms" kicker="Communication model" title="Structured channels, simple defaults." sub="Agents talk directly within and across rooms, but through channels designed to produce decisions rather than endless chatter.">
        <Table head={["Channel", "Used for"]} rows={CHANNELS} />
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {RULES.map(([t, d], i) => (
            <div key={t} className="rounded-[18px] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[12px] font-bold text-white">{i + 1}</div>
              <div className="mt-3 text-[15px] font-semibold text-ink">{t}</div>
              <div className="mt-1 text-[13.5px] leading-[1.5] text-muted">{d}</div>
            </div>
          ))}
        </div>
      </Block>

      <Block id="ref-meetings" kicker="CEO meetings" title="Same loop, every time." sub="A trigger, a short structured meeting, written outcomes and a tracked follow-up.">
        <div className="grid gap-3 md:grid-cols-5">
          {LIFECYCLE.map((s, i) => (
            <div key={s.t} className="relative rounded-[18px] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
              <div className="font-mono text-[11px] font-semibold text-faint">0{i + 1}</div>
              <div className="mt-1 text-[15px] font-semibold text-ink">{s.t}</div>
              <div className="mt-1 text-[13px] leading-[1.5] text-muted">{s.d}</div>
            </div>
          ))}
        </div>
      </Block>

      <Block id="ref-memory" kicker="Memory" title="Layers, owners and movement." sub="Every agent gets exactly the memory its current task needs: nothing missing, nothing extra, nothing stale.">
        <Table head={["Layer", "Written by", "Read by"]} rows={LAYERS} />
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            ["Picks up the task", "Starts from the ticket or message."],
            ["Reads its index", "A small table of contents across every layer it may read."],
            ["Pulls only what's relevant", "Loads the bodies that matter for this task."],
            ["Writes back", "Scratchpad notes and lessons, distilled up later."],
          ].map(([t, d], i) => (
            <div key={t} className="rounded-[18px] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
              <div className="font-mono text-[11px] font-semibold text-accent">Step {i + 1}</div>
              <div className="mt-1 text-[15px] font-semibold text-ink">{t}</div>
              <div className="mt-1 text-[13px] leading-[1.5] text-muted">{d}</div>
            </div>
          ))}
        </div>
      </Block>

      <Block id="ref-gov" kicker="Governance" title="The CEO decides what agents may do." sub="Ada records those choices as structured policy and enforces them.">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {GOVERNANCE.map(([t, d]) => (
            <div key={t} className="rounded-[18px] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
              <div className="text-[15px] font-semibold text-ink">{t}</div>
              <div className="mt-1 text-[13px] leading-[1.5] text-muted">{d}</div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Table head={["When blocked", "Behaviour", "Good for"]} rows={BLOCKED} />
        </div>
      </Block>

      <Block id="ref-arch" kicker="Architecture and feasibility" title="Buildable today. The hard parts are reliability, state and cost." sub="Suggested path: prove one room end to end first. Development is the most measurable: a ticket in, a merged PR out, with the CEO escalation loop working well.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
            <div className="text-[13px] font-bold uppercase tracking-wide text-faint">Main building blocks</div>
            <ul className="mt-3 flex flex-col gap-2.5">
              {ARCH.blocks.map((b) => (
                <li key={b} className="flex gap-2.5 text-[14px] leading-[1.5] text-ink-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[20px] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
            <div className="text-[13px] font-bold uppercase tracking-wide text-faint">Hard parts</div>
            <ul className="mt-3 flex flex-col gap-2.5">
              {ARCH.hard.map((b) => (
                <li key={b} className="flex gap-2.5 text-[14px] leading-[1.5] text-ink-2">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Block>

      <Block id="ref-decisions" kicker="Decision log" title="What's agreed." sub="Decisions made so far, by area.">
        <DecisionLog />
      </Block>

      <Block id="ref-open" kicker="Open questions and next steps" title="What's still open." sub="The concept is settled. These are the remaining questions and the next pieces of work, roughly in order.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
            <div className="text-[13px] font-bold uppercase tracking-wide text-faint">Open questions</div>
            <div className="mt-3 flex flex-col gap-2">
              {OPEN.map((o) => (
                <div key={o.q} className="flex items-start justify-between gap-3 border-b border-black/[0.05] pb-2 last:border-0">
                  <span className="text-[14px] leading-[1.5] text-ink-2">{o.q}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${o.s === "Open" ? "bg-[#fdf3e0] text-[#8a5a10]" : "bg-[#f0efed] text-muted"}`}>{o.s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[20px] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
            <div className="text-[13px] font-bold uppercase tracking-wide text-faint">Next steps</div>
            <div className="mt-3 flex flex-col gap-3">
              {NEXT.map((n, i) => (
                <div key={n.t} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
                  <div>
                    <div className="text-[14.5px] font-semibold text-ink">{n.t}</div>
                    <div className="text-[13.5px] leading-[1.5] text-muted">{n.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Block>
    </div>
  );
}
