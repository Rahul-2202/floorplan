"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import type { Look } from "@/office/sprites";
import { useSim } from "@/sim/store";
import type { Person } from "@/sim/types";
import { connect } from "./net";
import { hasJoined, liveCodeFromUrl, markJoined, savedName } from "./LiveSync";
import { publicId, setLive } from "./state";

const LOOKS: Look[] = [
  { skin: "#f1c7a5", hair: "#2b2522", style: "short", shirt: "#2f6fd1", pants: "#2f3440" },
  { skin: "#c68a62", hair: "#1a1513", style: "long", shirt: "#d94f7a", pants: "#3a3340", glasses: true },
  { skin: "#8d5a3b", hair: "#1a1513", style: "buzz", shirt: "#3f9b5f", pants: "#34495e" },
  { skin: "#e8b48f", hair: "#9c4a2c", style: "bun", shirt: "#e0a43b", pants: "#2b2f36" },
  { skin: "#f3cfb1", hair: "#e2b24c", style: "bob", shirt: "#7b6cd9", pants: "#2f3440" },
  { skin: "#a86b48", hair: "#2b2522", style: "curly", shirt: "#e8743b", pants: "#3a4a63", glasses: true },
];

const PLACES = [
  { v: "dev", l: "Development", sub: "With Priya, Sam and the dev agents", spot: "dev:new" },
  { v: "marketing", l: "Marketing", sub: "With Marco, Lena and the creators", spot: "mkt:new" },
  { v: "", l: "Lobby", sub: "Look around first", spot: "lobby:2" },
];

/** Joining a live office: just a name. No account, no backend. */
export function JoinGate() {
  const { d } = useSim();
  const [code] = useState(() => liveCodeFromUrl());
  const [open, setOpen] = useState(() => !!code && !hasJoined(code));
  const [name, setName] = useState(savedName);
  const [title, setTitle] = useState("");
  const [look, setLook] = useState(0);
  const [place, setPlace] = useState(0);
  const ok = name.trim().length >= 2;

  const join = () => {
    if (!ok || !code) return;
    const full = name.trim();
    const id = publicId();
    const pl = PLACES[place];
    const person: Person = {
      id,
      name: full.split(/\s+/)[0],
      full,
      title: title.trim() || "Guest",
      role: "member",
      room: pl.v || null,
      presence: "online",
      email: "Joined live, no account",
      joined: "Live",
      real: true,
      look: LOOKS[look],
      spot: pl.spot,
    };
    CAST[id] = { id, name: person.name, role: person.title, room: "ceo", human: true, real: true, look: LOOKS[look] };
    d({ type: "addPerson", person, at: pl.spot });
    d({ type: "viewer", id });
    d({ type: "toast", toast: { id: `hello-${id}`, who: "ada", text: `Welcome, ${person.name}! Anyone else with the link shows up with a Live tag. Walk up to them to talk.` } });
    markJoined(code, full);
    setLive({ name: full });
    void connect(code);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#1b1916]/55 p-4 backdrop-blur-md">
          <motion.div
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-[440px] rounded-[28px] bg-white p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]"
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") join();
            }}
          >
            <div className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#ff5a4f]">● Live office</div>
                <div className="text-[19px] font-semibold tracking-[-0.01em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
                  You&apos;re invited to Bookwell HQ
                </div>
              </div>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">No sign-up. Pick a name and walk in. Chat, voice and video go straight between browsers, and your camera and mic stay off until you join a call.</p>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[12px] font-semibold text-muted">Your name</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Kim" maxLength={32} className="h-11 w-full rounded-[14px] bg-[#f6f5f2] px-3.5 text-[14px] text-ink outline-none ring-1 ring-black/[0.06] focus:ring-black/25" />
            </label>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-[12px] font-semibold text-muted">What you do (optional)</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Product designer" maxLength={32} className="h-11 w-full rounded-[14px] bg-[#f6f5f2] px-3.5 text-[14px] text-ink outline-none ring-1 ring-black/[0.06] focus:ring-black/25" />
            </label>

            <div className="mt-4 text-[12px] font-semibold text-muted">Your look</div>
            <div className="mt-1.5 flex gap-1.5">
              {LOOKS.map((l, i) => (
                <button key={i} onClick={() => setLook(i)} className={`rounded-[14px] p-1 ring-2 transition-colors ${look === i ? "ring-[#2b4fb8]" : "ring-transparent hover:ring-black/10"}`} aria-label={`Look ${i + 1}`}>
                  <Portrait look={l} size={42} />
                </button>
              ))}
            </div>

            <div className="mt-4 text-[12px] font-semibold text-muted">Where to?</div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {PLACES.map((p, i) => (
                <button key={p.l} onClick={() => setPlace(i)} className={`rounded-[14px] px-2.5 py-2 text-left ring-1 transition-colors ${place === i ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-black/[0.08] hover:ring-black/25"}`}>
                  <div className="text-[12.5px] font-semibold">{p.l}</div>
                  <div className={`text-[10.5px] leading-tight ${place === i ? "text-white/60" : "text-muted"}`}>{p.sub}</div>
                </button>
              ))}
            </div>

            <button onClick={join} disabled={!ok} className="mt-5 h-12 w-full rounded-full bg-[#2b4fb8] text-[14.5px] font-semibold text-white transition-opacity hover:bg-[#22409a] disabled:opacity-40">
              Walk in →
            </button>
            <div className="mt-2.5 text-center text-[11px] text-faint">Session {code} · peer-to-peer · the agents are a live demo</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
