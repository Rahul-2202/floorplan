"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Face } from "@/office-app/bits";
import { useSim } from "@/sim/store";
import { endSession, savedName, startSession } from "./LiveSync";
import { liveLink, newCode, useLive } from "./state";

/** Bring real people in: a link, a name, and they're here. */
export function LiveButton() {
  const { s } = useSim();
  const live = useLive();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => savedName() || (s.me === "you" ? "CEO" : (s.people[s.me]?.full ?? "")));
  const [copied, setCopied] = useState(false);
  const on = live.status !== "off" && live.code;
  const here = Object.values(live.peers).filter((id, i, a) => a.indexOf(id) === i && s.people[id]);
  const link = on ? liveLink(live.code!) : "";

  return (
    <div className="relative" data-tour="live">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold ring-1 transition-colors ${on ? "bg-[#fff1f0] text-[#c4322b] ring-[#f7c6c2]" : "bg-white text-ink ring-black/[0.08] hover:ring-black/20"}`}
      >
        <span className="h-2 w-2 rounded-full bg-[#ff5a4f]" style={on ? { animation: "led 1.4s steps(2) infinite" } : undefined} />
        {on ? `Live · ${here.length + 1}` : "Invite real people"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-11 z-50 w-[340px] rounded-[20px] bg-white p-4 shadow-[var(--shadow-float)] ring-1 ring-black/[0.06]"
            onKeyDown={(e) => e.stopPropagation()}
          >
            {!on ? (
              <>
                <div className="text-[15px] font-semibold text-ink">Invite real people</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  They open a link, type a name and walk in. No sign-up and no server: chat, voice and video go straight between browsers. The agents stay a demo on each screen.
                </p>
                <label className="mt-3 block">
                  <span className="mb-1 block text-[11.5px] font-semibold text-muted">Your name, as they&apos;ll see it</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-[12px] bg-[#f6f5f2] px-3 text-[13px] outline-none ring-1 ring-black/[0.06] focus:ring-black/20" />
                </label>
                <button
                  disabled={name.trim().length < 2}
                  onClick={() => startSession(newCode(), name.trim())}
                  className="mt-3 h-10 w-full rounded-full bg-[#2b4fb8] text-[13px] font-semibold text-white hover:bg-[#22409a] disabled:opacity-40"
                >
                  Start a live session
                </button>
                <div className="mt-2 text-[11px] leading-snug text-faint">Works for small teams. Very strict company networks can block direct connections.</div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-[15px] font-semibold text-ink">Live session</div>
                  <span className="font-mono text-[12px] font-semibold text-muted">{live.code}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="min-w-0 flex-1 truncate rounded-[12px] bg-[#f6f5f2] px-3 py-2 text-[12px] text-ink-2">{link}</div>
                  <button
                    onClick={() => {
                      void navigator.clipboard?.writeText(link).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1400);
                    }}
                    className="h-9 shrink-0 rounded-full bg-ink px-3 text-[12px] font-semibold text-white"
                  >
                    {copied ? "Copied ✓" : "Copy link"}
                  </button>
                </div>
                <div className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">Here now</div>
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[13px] text-ink">
                    <Face id={s.me} size={24} /> {live.name || "You"} <span className="text-[11px] text-muted">(you)</span>
                  </div>
                  {here.map((id) => (
                    <div key={id} className="flex items-center gap-2 text-[13px] text-ink">
                      <Face id={id} size={24} /> {s.people[id]?.full}
                      <span className="text-[11px] text-muted">{s.people[id]?.room ? `· ${s.people[id].room}` : "· lobby"}</span>
                    </div>
                  ))}
                  {!here.length && <div className="text-[12px] text-muted">{live.status === "connecting" ? "Connecting to the relays…" : "Nobody else yet. Send them the link."}</div>}
                </div>
                <button
                  onClick={() => {
                    endSession();
                    setOpen(false);
                  }}
                  className="mt-3 text-[12px] font-semibold text-[#9b2c24] hover:underline"
                >
                  Leave the live session
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
