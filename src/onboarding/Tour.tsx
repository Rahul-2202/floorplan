"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ROOMS, SPOTS } from "@/office/layout";
import { Face } from "@/office-app/bits";
import { useUI } from "@/office-app/ui";
import { useSim, type Action, type SimState } from "@/sim/store";
import type { PanelKey } from "@/sim/types";

type UI = ReturnType<typeof useUI>;
type Ctx = { s: SimState; d: (a: Action) => void };

interface Step {
  id: string;
  target?: string;
  title: string;
  body: ReactNode;
  /** The guide waits until this is true (the user did the thing). */
  wait?: (ui: UI, c: Ctx) => boolean;
  waitHint?: string;
  /** A helper button that does it for you. */
  help?: { label: string; run: (ui: UI, c: Ctx) => void };
  panel?: PanelKey;
  onEnter?: (ui: UI) => void;
}

const B = ({ children }: { children: ReactNode }) => <b className="font-semibold text-ink">{children}</b>;

const CEO_STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to Bookwell HQ",
    body: (
      <>
        This is the office you just set up. Everything is live: agents are working, messages arrive, the clock is running. This guide takes about two minutes, and you can leave it any time.
      </>
    ),
  },
  {
    id: "you",
    target: '[data-tour="player"]',
    title: "This is you",
    body: (
      <>
        Walk with <B>WASD</B> or the <B>arrow keys</B>. <B>Click</B> the floor to walk there, and <B>drag</B> to look around.
      </>
    ),
  },
  {
    id: "ada",
    target: '[data-agent="ada"]',
    title: "Meet Ada, your office manager",
    body: <>Walk over to her. When you&apos;re next to someone their card pops up, or press <B>E</B>.</>,
    wait: (ui) => ui.card === "ada",
    waitHint: "Walk up to Ada to continue",
    help: { label: "Take me to Ada", run: (ui) => ui.walkTo(SPOTS["ada:home"][0] + 0.2, SPOTS["ada:home"][1] + 1.2) },
  },
  {
    id: "ada-card",
    target: '[data-tour="ada-card"]',
    title: "Ada runs the office",
    body: (
      <>
        Setup, rules, your inbox, calendar and memory are all here as buttons. Or just tell her, by text or <B>voice</B>: try <B>“What needs me today?”</B> or <B>“Ask marketing for 3 launch tweets”</B>. Anything that changes a setting is read back to you first.
      </>
    ),
  },
  {
    id: "agents",
    target: '[data-agent="be"]',
    title: "Your agents",
    body: (
      <>
        Hover anyone to see what they&apos;re doing right now. Click <B>Call to me</B> and they walk over, or just walk up to them.
      </>
    ),
    onEnter: (ui) => ui.setCard(null),
    wait: (ui) => !!ui.card && ui.card !== "ada",
    waitHint: "Call or walk up to any agent to continue",
    help: { label: "Call Backend for me", run: (ui) => ui.summon("be") },
  },
  {
    id: "agent-card",
    target: '[data-tour="agent-card"]',
    title: "Everything about an agent",
    body: (
      <ul className="flex list-none flex-col gap-1">
        <li>
          <B>Message now</B> makes them stop at a safe point and reply. <B>Queue</B> waits for their next break.
        </li>
        <li>
          <B>Live session</B> shows their Claude Code or Codex terminal as they work.
        </li>
        <li>
          <B>Memory</B> is what they know. <B>Config</B> is their tools, permissions and budget.
        </li>
        <li>Closing the card sends a called agent back to their desk.</li>
      </ul>
    ),
  },
  {
    id: "people",
    target: '[data-agent="jordan"]',
    title: "Your people work here too",
    body: (
      <>
        Blue name tags are people. <B>Priya</B> leads Development, so the PM reports to her, not you. <B>Jordan</B> just joined with your office code and is waiting in the lobby. Walk over and give them a room, or tell Ada <B>“Put Jordan in Marketing”</B>.
      </>
    ),
    onEnter: (ui) => ui.setCard(null),
    wait: (_ui, { s }) => !!s.people.jordan?.room,
    waitHint: "Give Jordan a room to continue",
    help: {
      label: "Put Jordan in Marketing",
      run: (_ui, { s, d }) => {
        d({ type: "assignPerson", id: "jordan", room: "marketing", by: s.me });
        d({ type: "toast", toast: { id: "tour-jordan", who: "ada", text: "Jordan is joining Marketing. I've told Marco." } });
      },
    },
  },
  {
    id: "viewer",
    target: '[data-tour="viewer"]',
    title: "See it as anyone",
    body: (
      <>
        Switch to <B>Priya</B> and the office changes with her: her inbox gets the PM&apos;s questions, she can edit her room and invite people to it, and adding an agent becomes a <B>request</B> to Ada and you. Switch back here any time.
      </>
    ),
    onEnter: (ui) => ui.setCard(null),
  },
  {
    id: "people-panel",
    target: '[data-tour="people"]',
    title: "People, invites and hierarchy",
    body: <>Hand out the office code or room links, put people in rooms, set who reports to whom and who can message whom, and approve agent requests. Lena has just asked for a designer.</>,
    panel: "people",
  },
  {
    id: "chat",
    target: '[data-tour="chat"]',
    title: "Chat, from any room",
    body: (
      <>
        <B>#general</B> reaches everyone, wherever they are. Rooms have their own channel, and you can DM anyone. Type <B>@PM</B> or <B>@Ada</B> and the agent joins the conversation.
      </>
    ),
    onEnter: (ui) => ui.closePanel(),
    help: { label: "Open chat", run: (ui) => ui.openChat("general") },
  },
  {
    id: "call",
    title: "Voice and video",
    body: (
      <>
        Walk into a room with people in it and you can join their call. Priya and Sam are on one in Development right now. <B>Add an agent</B> to the call and it speaks up, with captions.
      </>
    ),
    onEnter: (ui) => ui.closeChat(),
    help: { label: "Take me to Development", run: (ui) => ui.walkTo(ROOMS.dev.x + 12, ROOMS.dev.y + 8.8) },
  },
  {
    id: "rooms",
    target: '[data-tour="roombar"]',
    title: "Rooms",
    body: <>Walk into any room and its bar appears up here: the room&apos;s spec, rules, board, channel, memory and members. The meeting room is where meetings happen.</>,
    onEnter: (ui) => ui.setCard(null),
  },
  {
    id: "assign",
    target: '[data-tour="assign"]',
    title: "Assign a task",
    body: <>Describe the work. It goes to the room&apos;s head, who plans it in. You can also assign from an agent&apos;s card, or just tell Ada.</>,
    help: { label: "Try it", run: (ui) => ui.openWin({ kind: "assign" }) },
  },
  {
    id: "dashboard",
    target: '[data-tour="dashboard"]',
    title: "Dashboard",
    body: <>Everything in flight, by state: questions for you (answer them inline), blockers, things in review, ongoing, queued and done. Plus spend per room.</>,
    panel: "dashboard",
  },
  {
    id: "team",
    target: '[data-tour="team"]',
    title: "Agents & teams",
    body: <>The org chart. Open any agent&apos;s config, hire someone, or add a whole room. You never have to go through Ada.</>,
    panel: "team",
  },
  {
    id: "calendar",
    target: '[data-tour="calendar"]',
    title: "Calendar",
    body: <>Ada books meetings here, always with a pre-read, around your Google or Apple calendar. Agents request time; you accept, move or make it async.</>,
    panel: "calendar",
  },
  {
    id: "outputs",
    target: '[data-tour="outputs"]',
    title: "Outputs",
    body: <>Everything the team delivered: PRs, closed tickets, post drafts, videos, reports. Unviewed ones are marked. Approve or request changes right here.</>,
    panel: "outputs",
  },
  {
    id: "conversations",
    target: '[data-tour="conversations"]',
    title: "Transcripts & chats",
    body: <>Every meeting with its minutes (replay them with voice), every room channel, and every direct message between agents.</>,
    panel: "conversations",
  },
  {
    id: "memory",
    target: '[data-tour="memory"]',
    title: "Company memory",
    body: <>What the company knows, by layer: company, your preferences, rooms and agents. Every item has an owner and a source. Old facts are superseded, never deleted.</>,
    panel: "memory",
  },
  {
    id: "inbox",
    target: '[data-tour="inbox"]',
    title: "Needs your attention",
    body: <>Ada&apos;s triage of everything waiting on you. Answer questions, approve work and accept meetings inline. FYIs are batched so they don&apos;t interrupt you.</>,
    panel: "inbox",
  },
  {
    id: "governance",
    target: '[data-tour="governance"]',
    title: "Rules & settings",
    body: <>Permissions for every agent, locked rules only you can change, approval gates, budgets, and the version history with one-click rollback.</>,
    panel: "governance",
  },
  {
    id: "minimap",
    target: '[data-tour="minimap"]',
    title: "Minimap and zoom",
    body: <>See where everyone is and click to travel. Zoom with the + and − buttons. The search at the top jumps to any room, or calls anyone to you.</>,
    onEnter: (ui) => ui.closePanel(),
  },
  {
    id: "live",
    target: '[data-tour="toasts"]',
    title: "It's live",
    body: <>As the clock runs, things happen: PRs land, a tester finds a bug, drafts arrive, Ada escalates what&apos;s waiting. They show up here, in your inbox, and in the office.</>,
  },
  {
    id: "done",
    title: "You're set",
    body: <>A good first move: answer DevOps&apos; DNS question, it&apos;s blocking the launch. Or ask Ada what needs you. Reopen this guide any time from the bottom-right.</>,
  },
];

const MEMBER_STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to Bookwell, Nina",
    body: <>You&apos;re in the office: people, agents and Ada, all live. This guide shows what you can do as a member. It takes about a minute.</>,
  },
  {
    id: "you",
    target: '[data-tour="player"]',
    title: "This is you",
    body: (
      <>
        Walk with <B>WASD</B> or the <B>arrow keys</B>, or <B>click</B> the floor. Blue name tags are people, the rest are agents.
      </>
    ),
  },
  {
    id: "chat",
    target: '[data-tour="chat"]',
    title: "Say hi in #general",
    body: <>General reaches everyone from any room. DMs are one click away, and @mentioning an agent pulls it into the thread.</>,
    wait: (_ui, { s }) => (s.channels.general ?? []).some((m) => m.who === s.me),
    waitHint: "Post anything in #general to continue",
    help: { label: "Open #general", run: (ui) => ui.openChat("general") },
  },
  {
    id: "room",
    title: "Getting a room",
    body: <>People who join with the office code wait in the lobby until the CEO or Ada gives them a room. You&apos;ll walk there on your own when it happens.</>,
    onEnter: (ui) => ui.closeChat(),
    wait: (_ui, { s }) => !!s.people[s.me]?.room,
    waitHint: "Waiting for the CEO or Ada…",
    help: {
      label: "Have Ada put me in Marketing",
      run: (_ui, { s, d }) => {
        d({ type: "assignPerson", id: s.me, room: "marketing", by: "ada" });
        d({ type: "toast", toast: { id: "tour-room", who: "ada", text: "The CEO said yes: you're in Marketing. Marco is your lead." } });
      },
    },
  },
  {
    id: "roombar",
    target: '[data-tour="roombar"]',
    title: "Your room",
    body: <>Marketing&apos;s spec, rules, board and channel. Anyone in the room can change them: Marco is told, and every change is versioned. The Strategist, the room&apos;s agent head, reports to Marco.</>,
  },
  {
    id: "lead",
    target: '[data-agent="marco"]',
    title: "Meet your lead",
    body: <>Walk up to Marco, or hover and click <B>Ask over</B>. From his card you can message him, call him, or wave.</>,
    wait: (ui) => ui.card === "marco",
    waitHint: "Walk up to Marco to continue",
    help: { label: "Ask Marco over", run: (ui) => ui.summon("marco") },
  },
  {
    id: "person-card",
    target: '[data-tour="person-card"]',
    title: "People cards",
    body: <>Message, call, wave, and see where someone sits in the hierarchy. A lead&apos;s card shows the agents that report to them.</>,
  },
  {
    id: "call",
    target: '[data-tour="call-prompt"]',
    title: "Talk to your room",
    body: (
      <>
        When people share your room you can start a call: voice, video and captions. <B>Add an agent</B> like the Strategist and it joins the conversation.
      </>
    ),
    onEnter: (ui) => ui.setCard(null),
  },
  {
    id: "request",
    target: '[data-tour="people"]',
    title: "Need another agent?",
    body: <>Ask for one in People → Agent requests (or tell Ada). Ada checks the budget, then the CEO approves, and the agent walks into your room.</>,
    panel: "people",
  },
  {
    id: "inbox",
    target: '[data-tour="inbox"]',
    title: "Your inbox",
    body: <>Yours, not the CEO&apos;s: updates on your requests, work routed to you, and anything you&apos;re tagged in.</>,
    panel: "inbox",
  },
  {
    id: "viewer",
    target: '[data-tour="viewer"]',
    title: "Curious how it looks from the top?",
    body: <>Switch to the CEO, or to Marco, and see the same office from their side.</>,
    onEnter: (ui) => ui.closePanel(),
  },
  {
    id: "done",
    title: "You're in",
    body: <>Say hi to Lena, or ask the Strategist what&apos;s next for the launch. Reopen this guide any time.</>,
  },
];

function useRect(selector?: string) {
  const [r, setR] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!selector) {
      const t0 = setTimeout(() => setR(null), 0);
      return () => clearTimeout(t0);
    }
    const tick = () => {
      const el = document.querySelector(selector);
      const next = el ? el.getBoundingClientRect() : null;
      setR((prev) => (prev && next && Math.abs(prev.x - next.x) < 1 && Math.abs(prev.y - next.y) < 1 && Math.abs(prev.width - next.width) < 1 && Math.abs(prev.height - next.height) < 1 ? prev : next));
    };
    tick();
    const t = setInterval(tick, 120);
    return () => clearInterval(t);
  }, [selector]);
  return r;
}

export function Tour({ flow = "ceo" }: { flow?: "ceo" | "member" }) {
  const ui = useUI();
  const { s, d } = useSim();
  const STEPS = flow === "member" ? MEMBER_STEPS : CEO_STEPS;
  const [open, setOpen] = useState(true);
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const rect = useRect(open ? step.target : undefined);
  const card = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ctx = { s, d };
  const done = step.wait ? step.wait(ui, ctx) : true;

  useEffect(() => {
    if (open) step.onEnter?.(ui);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, open]);

  // Waiting steps advance by themselves once you've done the thing.
  useEffect(() => {
    if (!open || !step.wait || !done) return;
    const t = setTimeout(() => setI((v) => Math.min(STEPS.length - 1, v + 1)), 700);
    return () => clearTimeout(t);
  }, [done, open, step, STEPS.length]);

  // Place the card next to the target, inside the free area.
  useLayoutEffect(() => {
    const c = card.current;
    if (!c) return;
    const w = c.offsetWidth;
    const h = c.offsetHeight;
    const right = window.innerWidth - (ui.panel ? 488 : 12);
    if (!rect) {
      setPos({ x: (window.innerWidth - w) / 2, y: (window.innerHeight - h) / 2 });
      return;
    }
    let y = rect.bottom + 14;
    if (y + h > window.innerHeight - 12) y = rect.top - h - 14;
    if (y < 72) y = Math.min(window.innerHeight - h - 12, Math.max(72, rect.top + rect.height / 2 - h / 2));
    let x = rect.left + rect.width / 2 - w / 2;
    if (rect.top < 72 && y === rect.bottom + 14) x = rect.right - w;
    x = Math.max(12, Math.min(right - w, x));
    setPos((p) => (p && Math.abs(p.x - x) < 1 && Math.abs(p.y - y) < 1 ? p : { x, y }));
  }, [rect, i, ui.panel, open]);

  const go = (d: number) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i + d));
    setI(n);
  };

  const pad = 8;
  const hole = rect ? { x: rect.left - pad, y: rect.top - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 } : null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="tour" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-[90]">
            <svg className="absolute inset-0 h-full w-full">
              <defs>
                <mask id="tour-hole">
                  <rect width="100%" height="100%" fill="white" />
                  {hole && <motion.rect animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }} transition={{ type: "spring", stiffness: 260, damping: 30 }} rx={14} fill="black" />}
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(10,10,10,0.42)" mask="url(#tour-hole)" />
              {hole && (
                <motion.rect
                  animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  rx={14}
                  fill="none"
                  stroke="#e8743b"
                  strokeWidth={2.5}
                />
              )}
            </svg>

            <motion.div
              ref={card}
              initial={false}
              animate={pos ? { left: pos.x, top: pos.y, opacity: 1 } : { opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="pointer-events-auto absolute w-[340px] rounded-[20px] bg-white p-4 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.5)] ring-1 ring-black/[0.06]"
            >
              <div className="flex items-start gap-2.5">
                <Face id="ada" size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-faint">
                    Guide · {i + 1} of {STEPS.length}
                  </div>
                  <div className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{step.title}</div>
                </div>
                <button onClick={() => setOpen(false)} className="text-[12px] font-semibold text-faint hover:text-ink">
                  Skip
                </button>
              </div>
              <div className="mt-2 text-[13.5px] leading-[1.5] text-ink-2">{step.body}</div>
              {step.wait && !done && (
                <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-[#fff4ec] px-3 py-2 text-[12px] font-semibold text-[#a24d1f] ring-1 ring-[#f3cfb6]">
                  <span className="h-2 w-2 rounded-full bg-accent" style={{ animation: "pulse-ring 1.4s ease-out infinite" }} />
                  {step.waitHint}
                </div>
              )}
              <div className="mt-3.5 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {STEPS.map((_, k) => (
                    <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-4 bg-ink" : k < i ? "w-1.5 bg-black/40" : "w-1.5 bg-black/15"}`} />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5">
                {i > 0 && (
                  <button onClick={() => go(-1)} className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-muted hover:text-ink">
                    Back
                  </button>
                )}
                {step.help && !(step.wait && done) && (
                  <button onClick={() => step.help!.run(ui, ctx)} className="rounded-full bg-[#f2f0ec] px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-[#e9e6df]">
                    {step.help.label}
                  </button>
                )}
                {step.panel && ui.panel !== step.panel && (
                  <button onClick={() => ui.openPanel(step.panel!)} className="rounded-full bg-[#f2f0ec] px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-[#e9e6df]">
                    Open it
                  </button>
                )}
                {step.id === "done" && flow === "member" ? (
                  <button
                    onClick={() => {
                      setOpen(false);
                      ui.openChat("general");
                    }}
                    className="rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-white"
                  >
                    Open chat
                  </button>
                ) : step.id === "done" ? (
                  <>
                    <button
                      onClick={() => {
                        setOpen(false);
                        ui.openPanel("inbox");
                      }}
                      className="rounded-full bg-[#f2f0ec] px-3 py-1.5 text-[12.5px] font-semibold text-ink"
                    >
                      Open inbox
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        ui.openWin({ kind: "chat", id: "ada", tab: "say:What needs me today?" });
                      }}
                      className="rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-white"
                    >
                      Ask Ada
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => (step.wait && !done ? go(1) : go(1))}
                    className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${step.wait && !done ? "text-muted hover:text-ink" : "bg-ink text-white"}`}
                  >
                    {step.wait && !done ? "Skip step" : i === 0 ? "Start the guide" : "Next"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <button
          onClick={() => {
            setI(0);
            setOpen(true);
          }}
          className="fixed bottom-[64px] right-4 z-[50] flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-[12.5px] font-semibold text-ink shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] hover:bg-[#fbfaf8]"
        >
          <Face id="ada" size={24} /> Guide
        </button>
      )}
    </>
  );
}
