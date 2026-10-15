"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { relayMsg } from "@/live/LiveSync";
import { agentAnswer, canReach, me, mentions, personReply } from "@/sim/people";
import { clockLabel, dmKey, roomName, useSim, type SimState } from "@/sim/store";
import type { PMsg } from "@/sim/types";
import { Face } from "./bits";
import { callPerson } from "./cards/PersonCard";
import { Icon } from "./icons";
import { useUI } from "./ui";
import { nameOf } from "./who";

const ROOM_CONVO: Record<string, string> = { dev: "c-dev", marketing: "c-mkt" };

/** Messages in a thread, whichever store they live in. */
function thread(s: SimState, key: string): PMsg[] {
  if (key.startsWith("room:")) {
    const c = s.conversations.find((x) => x.id === ROOM_CONVO[key.slice(5)]);
    return (c?.messages ?? []).map((m, i) => ({ id: `${c?.id}-${i}`, who: m.who, t: m.t, text: m.text, agent: !s.people[m.who] }));
  }
  return s.channels[key] ?? [];
}

function title(s: SimState, key: string) {
  if (key === "general") return "# general";
  if (key.startsWith("room:")) return `# ${key.slice(5) === "dev" ? "development" : key.slice(5)}`;
  const other = key.slice(3).split("|").find((x) => x !== s.me) ?? "";
  return nameOf(other);
}

function channelsFor(s: SimState) {
  const p = me(s);
  const rooms = p.role === "ceo" ? ["dev", "marketing"] : p.room === "dev" || p.room === "marketing" ? [p.room] : [];
  const dms = Object.values(s.people)
    .filter((x) => x.id !== s.me)
    .map((x) => dmKey(s.me, x.id));
  return { channels: ["general", ...rooms.map((r) => `room:${r}`)], dms };
}

export function useUnread() {
  const { s } = useSim();
  const { channels, dms } = channelsFor(s);
  // Room channels count only what people wrote; agent chatter doesn't badge.
  const n = (k: string) => {
    const t = thread(s, k).filter((m) => m.who !== s.me);
    const unseen = t.slice(s.reads[`${s.me}|${k}`] ?? 0);
    return k.startsWith("room:") ? unseen.filter((m) => s.people[m.who]).length : unseen.length;
  };
  const by = Object.fromEntries([...channels, ...dms].map((k) => [k, n(k)]));
  return { by, total: Object.values(by).reduce((a, b) => a + b, 0) };
}

function Line({ m, prev }: { m: PMsg; prev?: PMsg }) {
  const { s } = useSim();
  const grouped = prev?.who === m.who;
  const mine = m.who === s.me;
  return (
    <div className={`flex gap-2 ${grouped ? "mt-0.5" : "mt-2.5"}`}>
      <div className="w-7 shrink-0">{!grouped && <Face id={m.who} size={28} />}</div>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[12.5px] font-semibold ${mine ? "text-[#21409a]" : "text-ink"}`}>{nameOf(m.who)}</span>
            {(m.agent || (!s.people[m.who] && m.who !== s.me)) && <span className="rounded bg-[#fff4ec] px-1 text-[9px] font-bold uppercase text-[#a24d1f]">Agent</span>}
            <span className="text-[10.5px] text-faint">{m.t}</span>
          </div>
        )}
        <div className="text-[13px] leading-[1.45] text-ink-2">
          {m.text.split(/(@\w+)/g).map((part, i) =>
            part.startsWith("@") ? (
              <span key={i} className="rounded bg-[#eef2fc] px-0.5 font-semibold text-[#21409a]">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Thread({ k }: { k: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const [text, setText] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const list = thread(s, k);
  const end = useRef<HTMLDivElement>(null);
  const sRef = useRef(s);
  useLayoutEffect(() => {
    sRef.current = s;
  });

  const seen = list.filter((m) => m.who !== s.me).length;
  const readKey = `${s.me}|${k}`;
  const read = s.reads[readKey] ?? 0;
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [list.length, k, typing]);
  useEffect(() => {
    if (read !== seen) d({ type: "read", key: readKey, n: seen });
  }, [read, seen, readKey, d]);

  const other = k.startsWith("dm:") ? (k.slice(3).split("|").find((x) => x !== s.me) ?? "") : null;
  const reach = other ? canReach(s, other) : { ok: true };
  const room = k.startsWith("room:") ? k.slice(5) : null;
  const suggestions = room ? ["@PM", "@Ada"].map((x) => (room === "marketing" && x === "@PM" ? "@Strategist" : x)) : k === "general" ? ["@Ada", "@PM", "@Strategist"] : [];

  const write = (who: string, body: string, agent?: boolean) => {
    const t = clockLabel(sRef.current.clock, false);
    if (room) d({ type: "convo", id: ROOM_CONVO[room], msg: { who, t, text: body } });
    else d({ type: "post", channel: k, msg: { id: `${who}-${Date.now()}`, who, t, text: body, agent } });
    // Real people in a live session see it too.
    relayMsg(sRef.current, { channel: k, who, text: body, t, agent });
  };

  const send = () => {
    const body = text.trim();
    if (!body || !reach.ok) return;
    setText("");
    write(s.me, body);
    let delay = 900;
    // Mentioned agents join the thread.
    if (s.org.agentsInCalls)
      mentions(body).forEach((a) => {
        setTimeout(() => setTyping(a), delay);
        delay += 1300;
        setTimeout(() => {
          setTyping(null);
          const r = agentAnswer(a, body, sRef.current);
          write(a, r.text, true);
          r.effect?.(d, sRef.current);
        }, delay);
        delay += 300;
      });
    // People answer DMs; a lead picks up questions in channels.
    const responder = other && s.people[other]?.real ? null : other && other !== "you" ? other : other === "you" && s.me !== "you" ? "you" : !other && body.includes("?") && !mentions(body).length ? (room ? s.rooms[room as "dev" | "marketing"]?.lead : "priya") : null;
    if (responder && responder !== s.me) {
      setTimeout(() => setTyping(responder), delay);
      setTimeout(() => {
        setTyping(null);
        write(responder, personReply(responder, body, sRef.current));
      }, delay + 1600);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
        {list.map((m, i) => (
          <Line key={m.id + i} m={m} prev={list[i - 1]} />
        ))}
        {!list.length && <div className="py-8 text-center text-[12.5px] text-faint">No messages yet. Say hi 👋</div>}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-2 text-[11.5px] text-muted">
              <Face id={typing} size={18} /> {nameOf(typing)} is typing
              <span className="inline-flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1 w-1 rounded-full bg-faint" style={{ animation: `typing 1s ${i * 0.15}s infinite` }} />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={end} />
      </div>
      {suggestions.length > 0 && s.org.agentsInCalls && (
        <div className="flex gap-1 overflow-x-auto px-3 pb-1.5">
          {suggestions.map((x) => (
            <button key={x} onClick={() => setText((v) => (v.includes(x) ? v : `${x} ${v}`))} className="shrink-0 rounded-full bg-[#fff4ec] px-2 py-0.5 text-[11px] font-semibold text-[#a24d1f] ring-1 ring-[#f3cfb6]">
              {x}
            </button>
          ))}
          <span className="self-center pl-1 text-[10.5px] text-faint">mention an agent to pull it in</span>
        </div>
      )}
      <form
        className="flex gap-2 border-t border-black/[0.06] p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          disabled={!reach.ok}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={reach.ok ? `Message ${title(s, k)}` : reach.why}
          className="h-9 min-w-0 flex-1 rounded-full bg-[#f6f5f2] px-3.5 text-[13px] outline-none ring-1 ring-black/[0.06] focus:ring-black/20 disabled:opacity-60"
        />
        <button className="grid h-9 w-9 place-items-center rounded-full bg-[#2b4fb8] text-white disabled:opacity-40" disabled={!text.trim() || !reach.ok} aria-label="Send">
          ↑
        </button>
      </form>
      {other && (
        <div className="flex gap-1.5 border-t border-black/[0.04] px-2.5 py-1.5">
          <button
            onClick={() => callPerson(s, d, other)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-ink-2 hover:bg-black/5"
          >
            {Icon.video} Call {nameOf(other)}
          </button>
          <button
            onClick={() => {
              ui.closeChat();
              ui.summon(other);
            }}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-ink-2 hover:bg-black/5"
          >
            {Icon.wave} Ask over
          </button>
        </div>
      )}
    </div>
  );
}

export function ChatDock() {
  const { s } = useSim();
  const ui = useUI();
  const { by, total } = useUnread();
  const { channels, dms } = channelsFor(s);
  const k = ui.chat;
  const list = k === "list";
  const online = Object.values(s.people).filter((p) => p.id !== s.me && p.presence !== "offline");

  return (
    <div className={`absolute bottom-4 z-[45] flex flex-col items-end gap-2 transition-[right] duration-300 ${ui.panel === "calendar" || ui.panel === "governance" ? "right-[664px]" : ui.panel ? "right-[484px]" : "right-4"}`} data-tour="chat">
      <AnimatePresence>
        {k && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="flex h-[min(480px,calc(100vh-180px))] w-[340px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-float)] ring-1 ring-black/[0.08]"
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2.5">
              {!list && (
                <button onClick={() => ui.openChat("list")} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-black/5" aria-label="All chats">
                  {Icon.back}
                </button>
              )}
              {!list && k.startsWith("dm:") && <Face id={k.slice(3).split("|").find((x) => x !== s.me) ?? ""} size={24} />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-ink">{list ? "Chat" : title(s, k)}</div>
                <div className="truncate text-[11px] text-muted">
                  {list ? "Everyone, from any room" : k === "general" ? "The whole office, people and agents" : k.startsWith("room:") ? `${roomName(k.slice(5))} people and agents` : (s.people[k.slice(3).split("|").find((x) => x !== s.me) ?? ""]?.title ?? "")}
                </div>
              </div>
              <button onClick={ui.closeChat} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-black/5" aria-label="Close chat">
                ✕
              </button>
            </div>
            {list ? (
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <div className="px-2 pb-1 pt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">Channels</div>
                {channels.map((c) => (
                  <button key={c} onClick={() => ui.openChat(c)} className="flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left hover:bg-[#f6f5f2]">
                    <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[#f2f0ec] text-[13px] font-bold text-muted">#</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-ink">{title(s, c).slice(2)}</span>
                      <span className="block truncate text-[11.5px] text-muted">{(() => {
                        const t = thread(s, c);
                        const last = t[t.length - 1];
                        return last ? `${nameOf(last.who)}: ${last.text}` : "";
                      })()}</span>
                    </span>
                    {by[c] > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#2b4fb8] px-1.5 text-[10.5px] font-bold text-white">{by[c]}</span>}
                  </button>
                ))}
                <div className="px-2 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-faint">Direct messages</div>
                {dms.map((c) => {
                  const other = c.slice(3).split("|").find((x) => x !== s.me) ?? "";
                  const t = thread(s, c);
                  const last = t[t.length - 1];
                  const reach = canReach(s, other);
                  return (
                    <button key={c} onClick={() => ui.openChat(c)} className="flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left hover:bg-[#f6f5f2]">
                      <Face id={other} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                          {nameOf(other)} {!reach.ok && <span className="text-[10px] text-faint">🔒</span>}
                        </span>
                        <span className="block truncate text-[11.5px] text-muted">{last ? `${last.who === s.me ? "You" : nameOf(last.who)}: ${last.text}` : (s.people[other]?.title ?? "")}</span>
                      </span>
                      {by[c] > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#2b4fb8] px-1.5 text-[10.5px] font-bold text-white">{by[c]}</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Thread key={k} k={k} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!k && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => ui.openChat("list")}
          className="flex items-center gap-2 rounded-full bg-white/95 py-1.5 pl-3 pr-1.5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.06] backdrop-blur hover:bg-white"
        >
          <span className="text-ink-2">{Icon.chat}</span>
          <span className="text-[13px] font-semibold text-ink">Chat</span>
          <span className="flex -space-x-1.5">
            {online.slice(0, 4).map((p) => (
              <span key={p.id} className="rounded-[8px] ring-2 ring-white">
                <Face id={p.id} size={22} />
              </span>
            ))}
          </span>
          {total > 0 ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#2b4fb8] px-1.5 text-[11px] font-bold text-white">{total}</span> : <span className="w-1" />}
        </motion.button>
      )}
    </div>
  );
}
