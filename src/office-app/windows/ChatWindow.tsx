"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CAST } from "@/office/layout";
import { say } from "@/lib/meeting";
import { useSpeech } from "@/lib/useSpeech";
import { ADA_CHIPS, adaReply, agentChips, agentReply, type Reply } from "@/sim/intents";
import { clockLabel, useSim } from "@/sim/store";
import type { ChatCard, ChatMsg } from "@/sim/types";
import { DAYS } from "@/sim/data/calendar";
import { Btn, Face, Segmented, StateChip, Window } from "../bits";
import { useUI } from "../ui";
import { nameOf } from "../who";

let seq = 0;
const mid = () => `m${Date.now()}-${seq++}`;

function CardView({ card, agent }: { card: ChatCard; agent: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  if (card.kind === "list")
    return (
      <div className="mt-2 w-full overflow-hidden rounded-[14px] bg-white ring-1 ring-black/[0.08]">
        <div className="border-b border-black/[0.06] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-faint">{card.title}</div>
        {card.items.map((it, i) => (
          <div key={i} className="flex items-start gap-2 border-b border-black/[0.04] px-3 py-2 last:border-0">
            {it.who && <Face id={it.who} size={22} />}
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-ink">{it.text}</div>
              {it.sub && <div className="text-[11.5px] text-muted">{it.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  if (card.kind === "task") {
    const t = s.tasks.find((x) => x.id === card.taskId);
    if (!t) return null;
    return (
      <button onClick={() => ui.openWin({ kind: "task", id: t.id })} className="mt-2 flex w-full items-center gap-2 rounded-[14px] bg-white p-3 text-left ring-1 ring-black/[0.08]">
        <Face id={t.owner} size={26} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-ink">
            <span className="font-mono text-[11px] text-faint">{t.key}</span> {t.title}
          </div>
          <div className="text-[11.5px] text-muted">{nameOf(t.owner)}</div>
        </div>
        <StateChip state={t.state} />
      </button>
    );
  }
  if (card.kind === "event") {
    const e = s.calendar.find((x) => x.id === card.eventId);
    if (!e) return null;
    return (
      <button onClick={() => ui.openPanel("calendar", e.id)} className="mt-2 flex w-full items-center gap-3 rounded-[14px] bg-white p-3 text-left ring-1 ring-black/[0.08]">
        <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#f1eefd] text-center leading-none text-[#4a3fa8]">
          <div>
            <div className="text-[9px] font-bold uppercase">{DAYS[e.day]}</div>
            <div className="text-[12px] font-bold">{e.start}</div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-ink">{e.title}</div>
          <div className="flex -space-x-1.5 pt-1">
            {e.attendees.map((a) => (
              <span key={a} className="rounded-[8px] ring-2 ring-white">
                <Face id={a} size={18} />
              </span>
            ))}
          </div>
        </div>
      </button>
    );
  }
  if (card.kind === "memory") {
    const m = s.memory.find((x) => x.id === card.memId);
    if (!m) return null;
    return (
      <button onClick={() => ui.openPanel("memory", m.id)} className="mt-2 w-full rounded-[14px] bg-white p-3 text-left ring-1 ring-black/[0.08]">
        <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">◈ {m.type} · {m.layer}</div>
        <div className="mt-0.5 text-[12.5px] font-semibold text-ink">{m.title}</div>
        <div className="mt-0.5 text-[11.5px] text-muted">Source: {m.source}</div>
      </button>
    );
  }
  // read-back
  return (
    <div className="mt-2 w-full rounded-[14px] bg-white p-3 ring-1 ring-black/[0.08]">
      <div className="text-[12.5px] font-semibold text-ink">{card.title}</div>
      <div className="mt-2 flex flex-col gap-1.5">
        {card.items.map((it, i) => (
          <div key={i} className="flex items-start gap-2 text-[12.5px] text-ink-2">
            <span className={`mt-[1px] grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${card.applied ? "bg-ok" : "bg-black/25"}`}>✓</span>
            {it}
          </div>
        ))}
      </div>
      {card.applied ? (
        <div className="mt-2.5 text-[12px] font-semibold text-[#24603a]">✓ Applied · saved as v{s.versions[0]?.v}</div>
      ) : card.cancelled ? (
        <div className="mt-2.5 text-[12px] font-semibold text-muted">Cancelled. Nothing changed.</div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Btn
            tone="dark"
            onClick={() => {
              const hiring = s.pending?.apply.hire;
              d({ type: "applyPending", who: "Ada" });
              d({ type: "chatPatch", agent, id: card.actionId, patch: { card: { ...card, applied: true } } });
              d({ type: "chat", agent, msg: { id: mid(), from: "agent", t: clockLabel(s.clock, false), text: hiring ? "Done. They're on their way in, and I've set up their memory." : "Done. Saved as a new version. You can roll it back anytime in settings." } });
              if (hiring) {
                const n = s.hires.length + 1;
                setTimeout(() => d({ type: "toast", toast: { id: `hired-${n}`, who: "ada", text: `Your new hire is in. Say hi!`, action: { label: "Team", panel: "team" } } }), 600);
              }
            }}
          >
            Confirm
          </Btn>
          <Btn
            onClick={() => {
              d({ type: "cancelPending" });
              d({ type: "chatPatch", agent, id: card.actionId, patch: { card: { ...card, cancelled: true } } });
            }}
          >
            Cancel
          </Btn>
        </div>
      )}
    </div>
  );
}

function Bubble({ m, agent }: { m: ChatMsg; agent: string }) {
  if (m.from === "system")
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-[#f2f0ec] px-3 py-1 text-[11.5px] font-medium text-muted">{m.text}</span>
      </div>
    );
  const mine = m.from === "you";
  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : ""}`}>
      {!mine && <Face id={agent} size={26} />}
      <div className={`flex max-w-[82%] flex-col ${mine ? "items-end" : "items-start"}`}>
        <div className={`rounded-[18px] px-3.5 py-2.5 text-[13.5px] leading-[1.45] ${mine ? "rounded-br-[6px] bg-ink text-white" : "rounded-bl-[6px] bg-[#f2f0ec] text-ink"}`}>{m.text}</div>
        {m.card && <CardView card={m.card} agent={agent} />}
        <span className="mt-1 text-[10.5px] text-faint">{m.t}</span>
      </div>
    </div>
  );
}

export function ChatWindow({ id, mode: initialMode, tab }: { id: string; mode?: "now" | "queue"; tab?: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const isAda = id === "ada";
  const [mode, setMode] = useState<"now" | "queue">(initialMode ?? "now");
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [speak, setSpeak] = useState(isAda);
  const list = useRef<HTMLDivElement>(null);
  const msgs = s.chats[id] ?? [];
  const sRef = useRef(s);
  useEffect(() => {
    sRef.current = s;
  });
  const started = useRef(false);

  const now = () => clockLabel(sRef.current.clock, false);

  const deliver = (r: Reply) => {
    const st = sRef.current;
    let card = r.card;
    const msgId = mid();
    if (r.pending) {
      d({ type: "propose", pending: r.pending });
      card = { kind: "readback", title: r.pending.summary, items: r.pending.items, actionId: msgId };
    }
    d({ type: "chat", agent: id, msg: { id: msgId, from: "agent", t: now(), text: r.text, card, chips: r.chips } });
    r.effect?.(d, st);
    if (r.ui?.summon) setTimeout(() => ui.summon(r.ui!.summon!), 500);
    if (r.ui?.panel) setTimeout(() => ui.openPanel(r.ui!.panel![0] as never, r.ui!.panel![1]), 400);
    if (isAda && speak) say(r.text, "ada");
  };

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setText("");
    d({ type: "chat", agent: id, msg: { id: mid(), from: "you", t: now(), text: q } });
    const st = sRef.current;
    if (isAda) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        deliver(adaReply(q, sRef.current));
      }, 700);
      return;
    }
    const reply = agentReply(id, q, st);
    if (mode === "now") {
      const step = st.live[id]?.step ?? "the current step";
      d({ type: "chat", agent: id, msg: { id: mid(), from: "system", t: now(), text: `${nameOf(id)} is pausing at a safe point in “${step}”` } });
      d({ type: "live", id, patch: { emote: "…" } });
      setTimeout(() => setTyping(true), 700);
      setTimeout(() => {
        setTyping(false);
        d({ type: "live", id, patch: { emote: null } });
        deliver(reply);
      }, 1900);
    } else {
      const step = st.live[id]?.step ?? "its current step";
      d({ type: "chat", agent: id, msg: { id: mid(), from: "system", t: now(), text: `Queued. ${nameOf(id)} will read this after “${step}”` } });
      d({ type: "live", id, patch: { queued: (st.live[id]?.queued ?? 0) + 1 } });
      setTimeout(() => setTyping(true), 7200);
      setTimeout(() => {
        setTyping(false);
        const cur = sRef.current.live[id];
        d({ type: "live", id, patch: { queued: Math.max(0, (cur?.queued ?? 1) - 1) } });
        d({ type: "chat", agent: id, msg: { id: mid(), from: "system", t: now(), text: `Break point reached · ${nameOf(id)} read your message` } });
        deliver(reply);
        d({ type: "toast", toast: { id: `rep-${id}-${Date.now()}`, who: id, text: reply.text.slice(0, 90) } });
      }, 8500);
    }
  };

  const speech = useSpeech((t) => send(t));

  // Openers: briefing, a suggested line, or the mic.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (isAda && !msgs.length) d({ type: "chat", agent: id, msg: { id: mid(), from: "agent", t: now(), text: "Hi! What can I do for you?", chips: ADA_CHIPS } });
    const t = setTimeout(() => {
      if (tab === "briefing") send("What needs me today?");
      else if (tab?.startsWith("say:")) send(tab.slice(4));
      else if (tab === "voice") speech.start();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, typing]);

  const chips = isAda ? (msgs[msgs.length - 1]?.chips ?? ADA_CHIPS) : agentChips(id, s);
  const l = s.live[id];

  return (
    <Window
      title={isAda ? "Ada" : nameOf(id)}
      sub={isAda ? "Office manager · chat or voice" : `${CAST[id]?.role} · ${l?.step ?? ""}`}
      icon={<Face id={id} size={34} />}
      onClose={ui.closeWin}
      width={520}
      footer={
        <div className="border-t border-black/[0.06] p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {chips.slice(0, 5).map((c) => (
              <button key={c} onClick={() => send(c)} className="rounded-full bg-[#f6f5f2] px-2.5 py-1 text-[12px] font-medium text-ink-2 ring-1 ring-black/[0.05] hover:bg-[#efede8]">
                {c}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex items-center gap-2"
          >
            <input
              autoFocus
              value={speech.listening ? speech.interim || "Listening…" : text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isAda ? "Ask Ada anything, or tell her what to do…" : mode === "now" ? `Message ${nameOf(id)} now…` : `Queue a message for ${nameOf(id)}…`}
              className="h-11 flex-1 rounded-full bg-[#f6f5f2] px-4 text-[13.5px] outline-none ring-1 ring-black/[0.05] focus:ring-black/20"
            />
            {speech.supported && (
              <button
                type="button"
                onClick={() => (speech.listening ? speech.stop() : speech.start())}
                className={`grid h-11 w-11 place-items-center rounded-full ${speech.listening ? "bg-bad text-white" : "bg-[#f2f0ec] text-ink"}`}
                aria-label="Speak"
                title="Hold a conversation by voice"
              >
                {speech.listening ? <span className="h-3 w-3 animate-pulse rounded-sm bg-white" /> : "🎙"}
              </button>
            )}
            <button type="submit" className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white" aria-label="Send">
              ↑
            </button>
          </form>
          {speech.error && <div className="mt-1.5 text-[11.5px] text-bad">{speech.error}</div>}
        </div>
      }
    >
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.05] bg-[#fbfaf8] px-4 py-2">
        {isAda ? (
          <>
            <span className="text-[12px] text-muted">Ada answers instantly. Changes are read back before they apply.</span>
            <label className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-ink-2">
              <input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} /> Speak replies
            </label>
          </>
        ) : (
          <>
            <Segmented
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { v: "now", l: "Now" },
                { v: "queue", l: "Queue" },
              ]}
            />
            <span className="text-right text-[11.5px] text-muted">{mode === "now" ? "Stops at the next safe point and replies right away" : "Waits for its next break point (~a few minutes)"}</span>
          </>
        )}
      </div>
      <div ref={list} className="flex h-[min(420px,50vh)] flex-col gap-3 overflow-y-auto px-4 py-4">
        {!msgs.length && !isAda && (
          <div className="my-auto text-center text-[13px] text-faint">
            Say hi, ask what {nameOf(id)} is working on, or give them something to do.
          </div>
        )}
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} agent={id} />
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
              <Face id={id} size={26} />
              <div className="flex h-9 items-center gap-1 rounded-[16px] rounded-bl-[6px] bg-[#f2f0ec] px-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="typing-dot h-[5px] w-[5px] rounded-full bg-[#8d8b86]" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Window>
  );
}

