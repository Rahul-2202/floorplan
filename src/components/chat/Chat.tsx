"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";

export interface ChatMsg {
  id: string;
  from: "ada" | "you" | "system";
  text?: ReactNode;
  card?: ReactNode;
}

function Typing() {
  return (
    <div className="flex h-[36px] w-[54px] items-center justify-center gap-1 rounded-[16px] rounded-bl-[6px] bg-[#f2f0ec]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot h-[5px] w-[5px] rounded-full bg-[#8d8b86]" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

function Message({ m, fresh }: { m: ChatMsg; fresh: boolean }) {
  const [typing, setTyping] = useState(fresh && m.from === "ada");
  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => setTyping(false), 650);
    return () => clearTimeout(t);
  }, [typing]);

  if (m.from === "system")
    return (
      <div className="flex justify-center py-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf6ee] px-3 py-1 text-[12px] font-semibold text-[#24603a]">{m.text}</div>
      </div>
    );

  const ada = m.from === "ada";
  return (
    <div className={`flex items-end gap-2 ${ada ? "" : "justify-end"}`}>
      {ada && <Portrait look={CAST.ada.look} size={26} bg="#fbe9de" />}
      <div className={`flex max-w-[86%] flex-col gap-2 ${ada ? "items-start" : "items-end"}`}>
        {typing ? (
          <Typing />
        ) : (
          <motion.div initial={fresh ? { opacity: 0, y: 4 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-2">
            {m.text && (
              <div
                className={`rounded-[18px] px-3.5 py-2.5 text-[14px] leading-[1.45] ${
                  ada ? "rounded-bl-[6px] bg-[#f2f0ec] text-ink" : "rounded-br-[6px] bg-ink text-white"
                }`}
              >
                {m.text}
              </div>
            )}
            {m.card}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({
  messages,
  className = "",
  title = "Ada",
  subtitle = "Office manager",
  voice = false,
  compact = false,
}: {
  messages: ChatMsg[];
  className?: string;
  title?: string;
  subtitle?: string;
  voice?: boolean;
  compact?: boolean;
}) {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLive(true), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[26px] bg-white shadow-[var(--shadow-float)] ring-1 ring-black/[0.05] ${className}`}>
      <div className={`${compact ? "hidden" : "flex"} items-center justify-between border-b border-black/[0.06] px-4 py-3`}>
        <div className="flex items-center gap-2.5">
          <Portrait look={CAST.ada.look} size={34} bg="#fbe9de" />
          <div className="leading-tight">
            <div className="text-[14.5px] font-semibold text-ink">{title}</div>
            <div className="text-[12px] text-muted">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center rounded-full bg-[#f2f0ec] p-0.5 text-[12px] font-semibold">
          <span className={`rounded-full px-2.5 py-1 ${!voice ? "bg-white text-ink shadow-sm" : "text-muted"}`}>Chat</span>
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${voice ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="6" width="2" height="4" rx="1" />
              <rect x="5" y="3" width="2" height="10" rx="1" />
              <rect x="9" y="1" width="2" height="14" rx="1" />
              <rect x="13" y="5" width="2" height="6" rx="1" />
            </svg>
            Voice
          </span>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end gap-3 overflow-hidden px-4 pb-4">
          <AnimatePresence initial={false} mode="popLayout">
            {messages.map((m) => {
              const fresh = live;
              return (
                <motion.div
                  key={m.id}
                  layout="position"
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.18 } }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                >
                  <Message m={m} fresh={fresh} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className={`${compact ? "hidden" : ""} border-t border-black/[0.06] p-3`}>
        <div className="flex items-center gap-2 rounded-full bg-[#f6f5f2] py-1.5 pl-4 pr-1.5 text-[13.5px] text-faint">
          <span className="flex-1">Message Ada…</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Zm5 7a5 5 0 0 1-4.25 4.94V15h-1.5v-2.06A5 5 0 0 1 3 8h1.5a3.5 3.5 0 0 0 7 0H13Z" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
