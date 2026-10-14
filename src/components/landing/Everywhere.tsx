"use client";

import { motion } from "motion/react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { Office } from "@/office/Office";
import type { Scene } from "@/office/types";
import { Reveal, SectionHead } from "../ui";

const SCENE: Scene = {
  rooms: { ceo: "built", dev: "built", meeting: "built", marketing: "built", sales: "blueprint", legal: "blueprint", finance: "blueprint" },
  camera: ["ceo", "dev", "marketing"],
  labels: false,
  board: { todo: 3, doing: 3, done: 6 },
  agents: {
    you: { at: "seat:you" },
    ada: { at: "ada:home" },
    pm: { at: "ceo:outside", status: "blocked", emote: "!" },
    fe: { at: "seat:fe", status: "working" },
    be: { at: "seat:be", status: "working" },
    ops: { at: "seat:ops", status: "idle" },
    qa: { at: "seat:qa", status: "working" },
    strat: { at: "seat:strat", status: "working" },
    cr1: { at: "seat:cr1", status: "working" },
    cr2: { at: "seat:cr2", status: "blocked" },
    editor: { at: "seat:editor", status: "working" },
  },
};

function Phone() {
  const inbox = [
    { who: "pm", t: "Ship Friday without SMS?", tag: "High", c: "bg-[#fdecea] text-[#9b2c24]" },
    { who: "ops", t: "First merge to main", tag: "Approve", c: "bg-[#fdf3e0] text-[#8a5a10]" },
    { who: "editor", t: "3 drafts for LinkedIn", tag: "Review", c: "bg-[#f1eefd] text-[#4a3fa8]" },
  ];
  const channels = [
    { n: "# development", s: "PM: BOOK-142 is done", u: 0 },
    { n: "# marketing", s: "Strategist: launch plan v2", u: 3 },
    { n: "Meeting · launch scope", s: "Minutes ready", u: 1 },
  ];
  return (
    <div className="relative mx-auto w-[290px] rounded-[46px] bg-[#111] p-[10px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)]">
      <div className="relative h-[590px] overflow-hidden rounded-[37px] bg-[#f7f6f3]">
        <div className="absolute left-1/2 top-2.5 z-10 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center justify-between px-6 pt-3.5 text-[12px] font-semibold text-ink">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        <div className="px-4 pt-6">
          <div className="text-[24px] font-semibold tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Needs you
          </div>
          <div className="text-[12.5px] text-muted">Triaged by Ada · 3 items</div>
          <div className="mt-3 flex flex-col gap-2">
            {inbox.map((r, i) => (
              <motion.div
                key={r.t}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 240, damping: 24 }}
                className="flex items-center gap-2.5 rounded-[16px] bg-white p-2.5 ring-1 ring-black/[0.05]"
              >
                <Portrait look={CAST[r.who].look} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-ink">{r.t}</div>
                  <span className={`mt-0.5 inline-block rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase ${r.c}`}>{r.tag}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-5 text-[13px] font-semibold text-muted">Rooms and meetings</div>
          <div className="mt-2 overflow-hidden rounded-[16px] bg-white ring-1 ring-black/[0.05]">
            {channels.map((c, i) => (
              <motion.div
                key={c.n}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center gap-2 border-b border-black/[0.05] px-3 py-2.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink">{c.n}</div>
                  <div className="truncate text-[12px] text-muted">{c.s}</div>
                </div>
                {c.u > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10.5px] font-bold text-white">{c.u}</span>}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
          <Portrait look={CAST.ada.look} size={30} bg="#fbe9de" />
          <span className="flex-1 text-[13px] text-faint">Talk to Ada…</span>
          <span className="text-[13px]">🎙</span>
        </div>
      </div>
    </div>
  );
}

export function EverywhereSection() {
  return (
    <section className="relative overflow-hidden px-5 py-[clamp(96px,14vh,160px)] md:px-8">
      <SectionHead
        title="The office is the interface."
        second="Your phone is the shortcut."
        sub="On desktop you see the whole company at a glance: who's working, who's blocked, who's waiting at your door. On mobile it folds into a simple list of what needs you. Talk to Ada by text or voice on both."
      />
      <Reveal delay={0.1} className="mt-6 flex justify-center">
        <a href="/office" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-white hover:bg-black" style={{ fontFamily: "var(--font-display)" }}>
          Walk around the demo office →
        </a>
      </Reveal>
      <div className="mx-auto mt-14 grid max-w-[1180px] items-center gap-10 lg:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[28px] shadow-[0_2px_4px_rgba(10,10,10,0.04),0_40px_100px_-30px_rgba(10,10,10,0.3)] ring-1 ring-black/[0.06]">
            <Office scene={SCENE} />
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {[
                ["#3f9b5f", "Working"],
                ["#d99a2b", "Blocked"],
                ["#a19d96", "Idle"],
              ].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-semibold text-ink-2 shadow-sm backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                  {l}
                </span>
              ))}
              <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-semibold text-ink-2 shadow-sm backdrop-blur">
                <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-bad text-[9px] font-bold text-white">!</span>
                At your door
              </span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <Phone />
        </Reveal>
      </div>
    </section>
  );
}
