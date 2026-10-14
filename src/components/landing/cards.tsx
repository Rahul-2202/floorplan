"use client";

import { motion } from "motion/react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { RuntimeBadge } from "../ui";

export const DEV_TEAM = ["pm", "fe", "be", "ops", "qa"] as const;

export function ProposalCard() {
  return (
    <div className="w-[300px] overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.08] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-3.5 py-2.5">
        <div>
          <div className="text-[13px] font-semibold text-ink">Development room</div>
          <div className="text-[11.5px] text-muted">Proposed by Ada · 5 agents</div>
        </div>
        <span className="rounded-full bg-[#eaf6ee] px-2 py-0.5 text-[11px] font-semibold text-[#24603a]">New</span>
      </div>
      <div className="flex flex-col gap-0.5 p-1.5">
        {DEV_TEAM.map((id, i) => {
          const m = CAST[id];
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
              className="flex items-center gap-2.5 rounded-[12px] px-2 py-1.5"
            >
              <Portrait look={m.look} size={26} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                  {m.role}
                  {m.head && <span className="rounded bg-ink px-1 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-white">Head</span>}
                </div>
              </div>
              <RuntimeBadge runtime={m.runtime} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function LockCard() {
  return (
    <div className="w-[300px] rounded-[18px] bg-white p-3.5 ring-1 ring-black/[0.08] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-ink text-white">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 7V5a4 4 0 1 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-ink">Locked rule</div>
          <div className="mt-0.5 text-[12.5px] leading-snug text-ink-2">Nothing merges to main without your approval.</div>
          <div className="mt-2 text-[11.5px] text-muted">Only you can unlock this, from your dashboard.</div>
        </div>
      </div>
    </div>
  );
}

const DOMAINS = [
  { name: "Development", on: true, n: 5 },
  { name: "Marketing", n: 4 },
  { name: "Sales", n: 3 },
  { name: "Legal", n: 3 },
  { name: "Finance", n: 3 },
];

export function DomainCard() {
  return (
    <div className="w-[300px] rounded-[18px] bg-white p-3 ring-1 ring-black/[0.08] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)]">
      <div className="px-1 pb-2 text-[12px] font-semibold text-muted">Suggested rooms</div>
      <div className="flex flex-wrap gap-1.5">
        {DOMAINS.map((d, i) => (
          <motion.span
            key={d.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${
              d.on ? "bg-ink text-white" : "bg-[#fff4ec] text-[#a24d1f] ring-1 ring-[#f3cfb6]"
            }`}
          >
            {d.on ? "✓" : "+"} {d.name}
            <span className={d.on ? "text-white/60" : "text-[#d08a63]"}>{d.n}</span>
          </motion.span>
        ))}
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-muted ring-1 ring-dashed ring-black/15">+ Any team</span>
      </div>
    </div>
  );
}
