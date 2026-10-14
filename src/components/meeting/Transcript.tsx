"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { speechSupported, type Line } from "@/lib/meeting";

export function Wave({ on }: { on: boolean }) {
  return (
    <span className="flex h-3 items-end gap-[2px]">
      {[0, 1, 2, 3].map((k) => (
        <motion.span
          key={k}
          className="w-[2.5px] rounded-full bg-current"
          animate={on ? { height: ["30%", "100%", "45%", "85%", "30%"] } : { height: "30%" }}
          transition={on ? { duration: 0.9, repeat: Infinity, delay: k * 0.12, ease: "easeInOut" } : { duration: 0.2 }}
        />
      ))}
    </span>
  );
}

const NAME: Record<string, string> = { you: "You", ada: "Ada" };
const COLOR: Record<string, string> = { ada: "text-accent", you: "text-ink", pm: "text-[#5b6cc9]", strat: "text-[#b07a14]" };

export function Transcript({ lines, index, speaking, waiting = "Everyone's seated. Starting…" }: { lines: Line[]; index: number; speaking: boolean; waiting?: string }) {
  const shown = lines.slice(0, Math.min(index + 1, lines.length));
  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-[14px] bg-white ring-1 ring-black/[0.06]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-white to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end gap-2 p-3">
        {index < 0 && <div className="pb-2 text-center text-[12.5px] text-faint">{waiting}</div>}
        <AnimatePresence initial={false}>
          {shown.map((l, i) => {
            const current = i === index;
            return (
              <motion.div
                key={i}
                layout="position"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: current ? 1 : 0.62, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className={`flex gap-2 rounded-[10px] p-1.5 ${current ? "bg-[#f6f5f2]" : ""}`}
              >
                <Portrait look={CAST[l.who].look} size={22} bg={l.who === "ada" ? "#fbe9de" : undefined} />
                <div className="min-w-0 flex-1 text-[12.5px] leading-snug">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink">{NAME[l.who] ?? CAST[l.who].name}</span>
                    {current && (
                      <span className={COLOR[l.who] ?? "text-ink"}>
                        <Wave on={speaking} />
                      </span>
                    )}
                  </div>
                  <span className="text-ink-2">{l.text}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function SoundButton({ sound, onToggle, speaking }: { sound: boolean; onToggle: () => void; speaking: boolean }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOk(speechSupported()), 0);
    return () => clearTimeout(t);
  }, []);
  if (!ok) return null;
  return (
    <button
      onClick={onToggle}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors duration-300 ${
        sound ? "bg-ink text-white" : "bg-[#fff4ec] text-[#a24d1f] ring-1 ring-[#f3cfb6] hover:bg-[#fde9da]"
      }`}
    >
      {sound ? <Wave on={speaking} /> : <span className="text-[12px]">🔊</span>}
      {sound ? "Sound on" : "Listen"}
    </button>
  );
}
