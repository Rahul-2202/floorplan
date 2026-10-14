"use client";

import { useState } from "react";
import { SoundButton, Transcript } from "@/components/meeting/Transcript";
import { useMeeting, type Line, type Speaker } from "@/lib/meeting";
import { useSim } from "@/sim/store";
import type { Conversation } from "@/sim/types";
import { Btn, Empty, Face, Segmented } from "../bits";
import { nameOf } from "../who";

function Replay({ c }: { c: Conversation }) {
  const [sound, setSound] = useState(false);
  const lines: Line[] = c.messages.map((m) => ({ who: m.who as Speaker, text: m.text }));
  const m = useMeeting(lines, "live", sound);
  return (
    <div className="flex flex-col gap-2">
      <div className="h-[300px]">
        <Transcript lines={lines} index={m.index} speaking={m.speaking} waiting="Starting the replay…" />
      </div>
      <SoundButton sound={sound} onToggle={() => setSound((v) => !v)} speaking={m.speaking} />
    </div>
  );
}

function Detail({ c, onBack }: { c: Conversation; onBack: () => void }) {
  const [replay, setReplay] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <button onClick={onBack} className="self-start text-[12.5px] font-semibold text-ink hover:underline">
        ← All conversations
      </button>
      <div>
        <div className="text-[16px] font-semibold text-ink">{c.title}</div>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-muted">
          <span className="flex -space-x-1.5">
            {c.participants.map((p) => (
              <span key={p} className="rounded-[8px] ring-2 ring-[#f7f6f3]">
                <Face id={p} size={20} />
              </span>
            ))}
          </span>
          {c.at}
        </div>
      </div>
      {c.minutes && (
        <div className="rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.06]">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Minutes</div>
          <div className="mt-1 text-[13.5px] font-semibold text-ink">{c.minutes.decision}</div>
          {c.minutes.why && <div className="text-[12px] text-muted">Why: {c.minutes.why}</div>}
          <div className="mt-2 flex flex-col gap-1">
            {c.minutes.actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-[12.5px] text-ink-2">
                <Face id={a.who} size={16} /> {a.text}
              </div>
            ))}
          </div>
          {c.minutes.open?.map((o) => (
            <div key={o} className="mt-2 rounded-[10px] bg-[#fdf3e0] px-2.5 py-1.5 text-[12px] text-[#8a5a10]">
              Open: {o}
            </div>
          ))}
        </div>
      )}
      {c.voice && (replay ? <Replay c={c} /> : <Btn tone="dark" onClick={() => setReplay(true)}>▶ Replay with voice</Btn>)}
      {!replay && (
        <div className="flex flex-col gap-3 rounded-[16px] bg-white p-3.5 ring-1 ring-black/[0.06]">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Transcript</div>
          {c.messages.map((m, i) => (
            <div key={i} className="flex gap-2.5">
              <Face id={m.who} size={26} />
              <div>
                <div className="text-[12px]">
                  <span className="font-semibold text-ink">{nameOf(m.who)}</span> <span className="text-faint">{m.t}</span>
                </div>
                <div className="text-[13px] leading-snug text-ink-2">{m.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConversationsPanel({ initial }: { initial?: string }) {
  const { s } = useSim();
  const withWho = initial?.startsWith("with:") ? initial.slice(5) : null;
  const [tab, setTab] = useState<"meetings" | "channels" | "dms">(initial === "meetings" ? "meetings" : withWho ? "dms" : "meetings");
  const [open, setOpen] = useState<string | null>(initial && s.conversations.some((c) => c.id === initial) ? initial : null);
  const conv = s.conversations.find((c) => c.id === open);
  if (conv) return <Detail c={conv} onBack={() => setOpen(null)} />;

  const list = s.conversations
    .filter((c) => (tab === "meetings" ? c.kind === "meeting" : tab === "channels" ? c.kind === "channel" || c.kind === "cross" : c.kind === "dm"))
    .filter((c) => !withWho || c.participants.includes(withWho));

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { v: "meetings", l: "Meetings" },
          { v: "channels", l: "Channels" },
          { v: "dms", l: "Direct messages" },
        ]}
      />
      {withWho && <div className="text-[12.5px] text-muted">Showing conversations with {nameOf(withWho)}</div>}
      {list.length ? (
        <div className="flex flex-col gap-2">
          {list.map((c) => (
            <button key={c.id} onClick={() => setOpen(c.id)} className="rounded-[16px] bg-white p-3 text-left ring-1 ring-black/[0.06] hover:ring-black/15">
              <div className="flex items-center gap-2">
                <span className="flex -space-x-1.5">
                  {c.participants.slice(0, 4).map((p) => (
                    <span key={p} className="rounded-[8px] ring-2 ring-white">
                      <Face id={p} size={22} />
                    </span>
                  ))}
                </span>
                <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{c.title}</span>
                {c.voice && <span className="rounded-full bg-[#f1eefd] px-1.5 text-[10.5px] font-bold text-[#4a3fa8]">voice</span>}
                <span className="text-[11px] text-faint">{c.at}</span>
              </div>
              <div className="mt-1.5 truncate text-[12.5px] text-muted">
                {c.minutes ? `Decision: ${c.minutes.decision}` : `${nameOf(c.messages[c.messages.length - 1]?.who ?? "")}: ${c.messages[c.messages.length - 1]?.text ?? ""}`}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Empty>No conversations yet.</Empty>
      )}
    </div>
  );
}
