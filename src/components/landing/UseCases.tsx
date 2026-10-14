"use client";

import { AnimatePresence, motion } from "motion/react";
import { Office } from "@/office/Office";
import type { AgentScene, RoomId, RoomState, Scene } from "@/office/types";
import { useIsDesktop } from "@/lib/useMedia";
import { BrandIcon } from "../brands";
import { Frame, Pinned } from "./Pinned";

const ALL: RoomId[] = ["ceo", "dev", "marketing", "meeting", "sales", "legal", "finance"];
const SEATS: Record<RoomId, string[]> = {
  ceo: [],
  dev: ["pm", "fe", "be", "ops", "qa"],
  marketing: ["strat", "cr1", "cr2", "editor"],
  meeting: [],
  sales: ["lead", "sdr", "res"],
  legal: ["counsel", "reviewer", "para"],
  finance: ["ctrl", "book", "analyst"],
};

function scene(built: RoomId[], camera: Scene["camera"], bubbles: Record<string, string> = {}): Scene {
  const rooms: Partial<Record<RoomId, RoomState>> = {};
  ALL.forEach((r) => (rooms[r] = built.includes(r) || r === "ceo" || r === "meeting" ? "built" : "blueprint"));
  const agents: Record<string, AgentScene> = { you: { at: "seat:you" }, ada: { at: "ada:home" } };
  built.forEach((r) =>
    SEATS[r].forEach((id) => {
      agents[id] = { at: `seat:${id}`, status: "working", bubble: bubbles[id] ?? null };
    }),
  );
  return { rooms, agents, camera, board: { todo: 3, doing: 3, done: 5 } };
}

const CASES = [
  {
    who: "Solo founders",
    line: "Build the product and launch it, without hiring a team first.",
    rooms: ["Development", "Marketing"],
    outputs: ["Merged PRs every day", "Launch posts drafted for your approval", "One weekly report"],
    tools: ["GitHub", "Linear", "LinkedIn", "X"],
    scene: scene(["dev", "marketing"], ["dev", "marketing"], { pm: "Sprint 3 is on track.", strat: "Launch plan is ready for you." }),
  },
  {
    who: "Technical builders",
    line: "Turn a backlog into merged pull requests, with a different runtime for each agent.",
    rooms: ["Development"],
    outputs: ["Tickets in, reviewed PRs out", "Mixed runtimes: Claude Code and Codex", "Tests and QA notes on every change"],
    tools: ["GitHub", "Linear", "Jira", "Sentry"],
    scene: scene(["dev"], "dev", { be: "PR #61 is ready for review." }),
  },
  {
    who: "Agencies and creators",
    line: "A strategist, two creators and an editor who know every client's voice.",
    rooms: ["Marketing"],
    outputs: ["Campaign plans", "Drafts in your voice, approved by you", "Weekly performance sheet"],
    tools: ["LinkedIn", "Instagram", "Figma", "Google Sheets"],
    scene: scene(["marketing"], "marketing", { editor: "3 drafts ready for your yes." }),
  },
  {
    who: "Sales teams",
    line: "Leads researched, outreach drafted and contracts checked against your playbook.",
    rooms: ["Sales", "Legal"],
    outputs: ["Qualified leads in your CRM", "Follow-ups that never slip", "Contract redlines with reasons"],
    tools: ["HubSpot", "Salesforce", "Gmail", "Google Docs"],
    scene: scene(["sales", "legal"], ["sales", "legal"], { lead: "12 new clinics qualified.", reviewer: "Clause 7 needs your eyes." }),
  },
  {
    who: "Finance and operations",
    line: "Books closed on time, invoices chased politely, numbers you can trust.",
    rooms: ["Finance"],
    outputs: ["Month-end close by the 5th", "Cash report every Monday", "Payments only after your yes"],
    tools: ["Stripe", "Xero", "QuickBooks", "Google Sheets"],
    scene: scene(["finance"], "finance", { ctrl: "September books are closed." }),
  },
  {
    who: "Established companies",
    line: "Add rooms beside the workflows you already run. Your tools, your rules.",
    rooms: ["Any team", "Your existing tools"],
    outputs: ["Rooms plug into Linear, Jira and Slack", "Your permissions and approval gates", "One company memory across teams"],
    tools: ["Slack", "Jira", "Notion", "Microsoft Teams"],
    scene: scene(["dev", "marketing", "sales", "legal", "finance"], undefined),
  },
];

export function UseCasesSection() {
  const desktop = useIsDesktop();
  return (
    <Pinned id="use-cases" steps={CASES.length} per={58}>
      {(step) => {
        const c = CASES[step];
        return (
          <div className="mx-auto flex h-full max-w-[1320px] flex-col gap-5 px-3 pb-3 pt-[84px] md:px-8 md:pb-7 lg:flex-row lg:gap-8 lg:pt-[96px]">
            <div className="px-2 lg:w-[360px] lg:shrink-0 lg:px-0">
              <h2 className="h-section text-[clamp(28px,3.4vw,44px)] text-ink">
                Built for anyone
                <br />
                <span className="text-second">running work across domains.</span>
              </h2>
              <div className="mt-6 hidden flex-col gap-0.5 lg:flex">
                {CASES.map((k, i) => (
                  <div key={k.who} className="relative rounded-[14px] px-4 py-3">
                    {i === step && <motion.div layoutId="case-bg" className="absolute inset-0 rounded-[14px] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]" transition={{ type: "spring", stiffness: 300, damping: 32 }} />}
                    <div className={`relative text-[15.5px] font-semibold transition-colors duration-300 ${i === step ? "text-ink" : "text-faint"}`}>{k.who}</div>
                    <AnimatePresence initial={false}>
                      {i === step && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="relative overflow-hidden pt-1 text-[14px] leading-[1.45] text-muted">
                          {k.line}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
              <div className="mt-3 lg:hidden">
                <div className="text-[15px] font-semibold text-ink">{c.who}</div>
                <p className="text-[14px] text-muted">{c.line}</p>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <Frame>
                <Office scene={c.scene} inset={desktop ? { bottom: 150 } : { bottom: 130 }} />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-x-3 bottom-3 z-20 grid gap-3 rounded-[20px] bg-white/95 p-4 shadow-[var(--shadow-float)] ring-1 ring-black/[0.05] backdrop-blur md:grid-cols-[1fr_1.4fr_auto] md:items-center"
                  >
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Rooms</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.rooms.map((r) => (
                          <span key={r} className="rounded-full bg-ink px-2.5 py-1 text-[12px] font-semibold text-white">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-faint">What you get</div>
                      <div className="mt-1.5 flex flex-col gap-1">
                        {c.outputs.map((o) => (
                          <div key={o} className="flex items-center gap-2 text-[13px] text-ink-2">
                            <span className="text-[11px] text-ok">✓</span>
                            {o}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="hidden items-center gap-1.5 md:flex">
                      {c.tools.map((t) => (
                        <span key={t} className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#f6f5f2] ring-1 ring-black/[0.05]" title={t}>
                          <BrandIcon name={t} size={17} />
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </Frame>
            </div>
          </div>
        );
      }}
    </Pinned>
  );
}
