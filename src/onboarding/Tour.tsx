"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SPOTS } from "@/office/layout";
import { Face } from "@/office-app/bits";
import { useUI } from "@/office-app/ui";
import type { PanelKey } from "@/sim/types";

type UI = ReturnType<typeof useUI>;

interface Step {
  id: string;
  target?: string;
  title: string;
  body: ReactNode;
  /** The guide waits until this is true (the user did the thing). */
  wait?: (ui: UI) => boolean;
  waitHint?: string;
  /** A helper button that does it for you. */
  help?: { label: string; run: (ui: UI) => void };
  panel?: PanelKey;
  onEnter?: (ui: UI) => void;
}

const B = ({ children }: { children: ReactNode }) => <b className="font-semibold text-ink">{children}</b>;

const STEPS: Step[] = [
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

export function Tour() {
  const ui = useUI();
  const [open, setOpen] = useState(true);
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const rect = useRect(open ? step.target : undefined);
  const card = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const done = step.wait ? step.wait(ui) : true;

  useEffect(() => {
    if (open) step.onEnter?.(ui);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, open]);

  // Waiting steps advance by themselves once you've done the thing.
  useEffect(() => {
    if (!open || !step.wait || !done) return;
    const t = setTimeout(() => setI((v) => Math.min(STEPS.length - 1, v + 1)), 700);
    return () => clearTimeout(t);
  }, [done, open, step]);

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
                  <button onClick={() => step.help!.run(ui)} className="rounded-full bg-[#f2f0ec] px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-[#e9e6df]">
                    {step.help.label}
                  </button>
                )}
                {step.panel && ui.panel !== step.panel && (
                  <button onClick={() => ui.openPanel(step.panel!)} className="rounded-full bg-[#f2f0ec] px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-[#e9e6df]">
                    Open it
                  </button>
                )}
                {step.id === "done" ? (
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
          className="fixed bottom-4 right-4 z-[50] flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-[12.5px] font-semibold text-ink shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] hover:bg-[#fbfaf8]"
        >
          <Face id="ada" size={24} /> Guide
        </button>
      )}
    </>
  );
}
