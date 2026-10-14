"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { BrandIcon } from "../brands";

export type FeedKind = "linear" | "github" | "room" | "dm" | "cross" | "queue" | "urgent" | "meeting" | "memory" | "system" | "inbox" | "update";

export interface FeedItem {
  id: string;
  kind: FeedKind;
  who?: string;
  to?: string;
  text: ReactNode;
  meta?: string;
  attach?: ReactNode;
}

const KIND: Record<FeedKind, { label: string; cls: string }> = {
  linear: { label: "Linear", cls: "bg-[#eef0fb] text-[#4a52b8]" },
  github: { label: "GitHub", cls: "bg-[#f0efed] text-ink-2" },
  room: { label: "#development", cls: "bg-[#eaf3e6] text-[#3c6b2c]" },
  dm: { label: "Direct message", cls: "bg-[#f0efed] text-ink-2" },
  cross: { label: "Cross-team", cls: "bg-[#f1eefd] text-[#4a3fa8]" },
  queue: { label: "Queued", cls: "bg-[#fdf3e0] text-[#8a5a10]" },
  urgent: { label: "Urgent", cls: "bg-[#fdecea] text-[#9b2c24]" },
  meeting: { label: "Meeting", cls: "bg-[#f1eefd] text-[#4a3fa8]" },
  memory: { label: "Memory", cls: "bg-[#fbe9de] text-[#a24d1f]" },
  system: { label: "Ada", cls: "bg-[#fbe9de] text-[#a24d1f]" },
  inbox: { label: "Your inbox", cls: "bg-ink text-white" },
  update: { label: "Update", cls: "bg-[#eaf6ee] text-[#24603a]" },
};

function Avatarish({ id }: { id?: string }) {
  if (!id) return null;
  if (id === "linear" || id === "github")
    return (
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] bg-white ring-1 ring-black/[0.08]">
        <BrandIcon name={id === "linear" ? "Linear" : "GitHub"} size={14} />
      </span>
    );
  const m = CAST[id];
  return m ? <Portrait look={m.look} size={26} bg={id === "ada" ? "#fbe9de" : undefined} /> : null;
}

export function FeedRow({ item }: { item: FeedItem }) {
  const k = KIND[item.kind];
  const who = item.who ? (CAST[item.who]?.name ?? (item.who === "linear" ? "Linear" : item.who === "github" ? "GitHub" : item.who)) : null;
  const to = item.to ? CAST[item.to]?.name : null;
  return (
    <div className="flex gap-2.5">
      <Avatarish id={item.who} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {who && (
            <span className="text-[12.5px] font-semibold text-ink">
              {who}
              {to && <span className="font-medium text-muted"> → {to}</span>}
            </span>
          )}
          <span className={`rounded-full px-1.5 py-[1px] text-[10.5px] font-semibold ${k.cls}`}>{k.label}</span>
          {item.meta && <span className="text-[11px] text-faint">{item.meta}</span>}
        </div>
        <div className="mt-0.5 text-[13px] leading-[1.42] text-ink-2">{item.text}</div>
        {item.attach && <div className="mt-1.5">{item.attach}</div>}
      </div>
    </div>
  );
}

export function FeedPanel({ items, title = "Activity", subtitle = "Development", className = "" }: { items: FeedItem[]; title?: string; subtitle?: string; className?: string }) {
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-float)] ring-1 ring-black/[0.05] ${className}`}>
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
        <div>
          <div className="text-[14px] font-semibold text-ink">{title}</div>
          <div className="text-[12px] text-muted">{subtitle}</div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#eaf6ee] px-2 py-0.5 text-[11px] font-semibold text-[#24603a]">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" style={{ animation: "led 1.6s steps(2) infinite" }} />
          Live
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end gap-3.5 overflow-hidden px-4 pb-4">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((it) => (
              <motion.div
                key={it.id}
                layout="position"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              >
                <FeedRow item={it} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function FileChip({ name, sub }: { name: string; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#f6f5f2] px-2 py-1 text-[12px] font-semibold text-ink ring-1 ring-black/[0.06]">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 1.5h5l3.5 3.5v9.5h-8.5z M9 1.5V5h3.5" />
      </svg>
      {name}
      {sub && <span className="font-medium text-muted">{sub}</span>}
    </span>
  );
}
