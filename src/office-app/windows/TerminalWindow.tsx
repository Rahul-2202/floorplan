"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SESSIONS, type SessionLine } from "@/sim/data/sessions";
import { useSim } from "@/sim/store";
import { Face, Window } from "../bits";
import { useUI } from "../ui";
import { nameOf } from "../who";

const GENERIC: SessionLine[] = [
  { k: "prompt", t: "Read the room charter and my role card" },
  { k: "tool", t: "Read memory/room/charter.md" },
  { k: "tool", t: "Read memory/agent/role-card.md" },
  { k: "think", t: "Getting up to speed before taking work from the head." },
  { k: "ok", t: "✓ Ready for my first task" },
];

function Line({ l }: { l: SessionLine }) {
  switch (l.k) {
    case "prompt":
      return (
        <div className="mt-2 flex gap-2 rounded-[8px] bg-white/[0.06] px-2 py-1.5">
          <span className="text-[#f0a37a]">›</span>
          <span className="font-semibold text-white">{l.t}</span>
        </div>
      );
    case "think":
      return <div className="italic text-white/45">✻ {l.t}</div>;
    case "tool": {
      const [verb, ...rest] = l.t.split(" ");
      return (
        <div>
          <span className="text-[#6fe39a]">⏺</span> <span className="font-semibold text-[#9ec5ff]">{verb}</span> <span className="text-white/80">{rest.join(" ")}</span>
        </div>
      );
    }
    case "add":
      return <div className="rounded-[4px] bg-[#1f3a2a] pl-2 text-[#8ff0b0]">{l.t}</div>;
    case "del":
      return <div className="rounded-[4px] bg-[#40211f] pl-2 text-[#ff9c94]">{l.t}</div>;
    case "ok":
      return <div className="text-[#6fe39a]">{l.t}</div>;
    case "err":
      return <div className="text-[#ff8a80]">{l.t}</div>;
    case "dim":
      return <div className="text-white/35">— {l.t}</div>;
    default:
      return <div className="whitespace-pre text-white/60">{l.t}</div>;
  }
}

export function TerminalWindow({ id }: { id: string }) {
  const { s } = useSim();
  const ui = useUI();
  const cfg = s.configs[id];
  const session = SESSIONS[id] ?? { repo: "workspace", lines: GENERIC };
  const [n, setN] = useState(Math.min(4, session.lines.length));
  const box = useRef<HTMLDivElement>(null);
  const claude = cfg?.runtime !== "Codex";
  const done = n >= session.lines.length;

  useEffect(() => {
    if (done) return;
    const line = session.lines[n];
    const wait = line.k === "think" ? 1400 : line.k === "prompt" ? 900 : line.k === "out" ? 500 : 800;
    const t = setTimeout(() => setN((v) => v + 1), wait);
    return () => clearTimeout(t);
  }, [n, done, session.lines]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [n]);

  return (
    <Window
      dark
      width={680}
      onClose={ui.closeWin}
      icon={<Face id={id} size={30} />}
      title={`${nameOf(id)} · live session`}
      sub={`${cfg?.runtime ?? "Claude Code"} · ${cfg?.model ?? ""} · ${session.repo}`}
      footer={
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-[11.5px] text-white/50">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-white/40" : "bg-[#6fe39a]"}`} style={done ? undefined : { animation: "led 1.4s steps(2) infinite" }} />
            {done ? "Waiting for the next step" : "Streaming"} · read-only view
          </span>
          <span>
            {(18 + n * 1.3).toFixed(1)}k tokens · ${(0.24 + n * 0.03).toFixed(2)} this session
          </span>
          <button onClick={() => ui.openWin({ kind: "chat", id, mode: "now" })} className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white hover:bg-white/20">
            Interrupt with a message
          </button>
        </div>
      }
    >
      <div className="border-b border-white/10 px-4 py-3 font-mono text-[12px]">
        {claude ? (
          <div className="inline-flex items-center gap-2 rounded-[8px] border border-[#f0a37a]/50 px-2.5 py-1 text-[#f0a37a]">✻ Claude Code · {nameOf(id)}</div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-[8px] border border-white/25 px-2.5 py-1 text-white/80">&gt;_ codex · {nameOf(id)}</div>
        )}
        <span className="ml-3 text-white/40">memory loaded: role card, 3 lessons, room index (2.1k tokens)</span>
      </div>
      <div ref={box} className="h-[min(440px,55vh)] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-[1.7]">
        {session.lines.slice(0, n).map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            <Line l={l} />
          </motion.div>
        ))}
        {!done && <span className="inline-block h-4 w-2 translate-y-0.5 bg-white/70" style={{ animation: "led 1s steps(2) infinite" }} />}
      </div>
    </Window>
  );
}
