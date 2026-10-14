"use client";

import { useState } from "react";
import { answerQuestion, approveOutput } from "@/sim/actions";
import { useSim } from "@/sim/store";
import type { InboxItem } from "@/sim/types";
import { Btn, Empty, Face, Section } from "../bits";
import { useUI } from "../ui";
import { nameOf } from "../who";

const KIND: Record<InboxItem["kind"], { l: string; c: string }> = {
  question: { l: "Question", c: "bg-[#fdecea] text-[#9b2c24]" },
  approval: { l: "Approve", c: "bg-[#fdf3e0] text-[#8a5a10]" },
  meeting: { l: "Meeting", c: "bg-[#f1eefd] text-[#4a3fa8]" },
  escalation: { l: "Escalation", c: "bg-[#fdecea] text-[#9b2c24]" },
  fyi: { l: "FYI", c: "bg-[#f0efed] text-muted" },
};

function Item({ i }: { i: InboxItem }) {
  const { s, d } = useSim();
  const ui = useUI();
  const task = i.ref?.type === "task" ? s.tasks.find((t) => t.id === i.ref!.id) : undefined;
  const output = i.ref?.type === "output" ? s.outputs.find((o) => o.id === i.ref!.id) : undefined;
  const ev = i.ref?.type === "event" ? s.calendar.find((e) => e.id === i.ref!.id) : undefined;
  return (
    <div className={`rounded-[16px] bg-white p-3.5 ring-1 ${i.priority === "high" ? "ring-[#f3c3be]" : "ring-black/[0.06]"}`}>
      <div className="flex items-start gap-2.5">
        <Face id={i.from} size={30} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide ${KIND[i.kind].c}`}>{KIND[i.kind].l}</span>
            {i.priority === "high" && <span className="text-[10.5px] font-bold uppercase text-[#9b2c24]">High</span>}
            <span className="ml-auto text-[11px] text-faint">
              {nameOf(i.from)} · {i.at}
            </span>
          </div>
          <div className="mt-1 text-[13.5px] font-semibold leading-snug text-ink">{i.title}</div>
          <div className="mt-0.5 text-[12px] text-muted">{i.sub}</div>
        </div>
      </div>
      {!i.resolved && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-10">
          {task?.question &&
            task.question.options.map((o, k) => (
              <Btn key={o} tone={k === 0 ? "dark" : "light"} className="!py-1 !text-[12px]" onClick={() => answerQuestion(s, d, task.id, o)}>
                {o}
              </Btn>
            ))}
          {output && (
            <>
              <Btn className="!py-1 !text-[12px]" onClick={() => ui.openWin({ kind: "output", id: output.id })}>
                Open
              </Btn>
              <Btn tone="dark" className="!py-1 !text-[12px]" onClick={() => approveOutput(s, d, output.id)}>
                {output.kind === "pr" ? "Approve merge" : "Approve"}
              </Btn>
            </>
          )}
          {ev && (
            <>
              <Btn
                tone="dark"
                className="!py-1 !text-[12px]"
                onClick={() => {
                  d({ type: "event", id: ev.id, patch: { status: "confirmed" } });
                  d({ type: "inbox", id: i.id, patch: { resolved: true } });
                }}
              >
                Accept {ev.start}
              </Btn>
              <Btn
                className="!py-1 !text-[12px]"
                onClick={() => {
                  d({ type: "event", id: ev.id, patch: { status: "confirmed", day: Math.min(4, ev.day + 1) } });
                  d({ type: "inbox", id: i.id, patch: { resolved: true } });
                }}
              >
                Tomorrow
              </Btn>
              <Btn
                tone="ghost"
                className="!py-1 !text-[12px]"
                onClick={() => {
                  d({ type: "event", id: ev.id, patch: { status: "confirmed", kind: "meeting", title: `${ev.title} (async)` } });
                  d({ type: "inbox", id: i.id, patch: { resolved: true } });
                }}
              >
                Downgrade to async
              </Btn>
            </>
          )}
          {i.kind === "fyi" && (
            <Btn className="!py-1 !text-[12px]" onClick={() => d({ type: "inbox", id: i.id, patch: { resolved: true } })}>
              Mark read
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}

export function InboxPanel({ initial }: { initial?: string }) {
  const { s } = useSim();
  const [showDone, setShowDone] = useState(false);
  const open = s.inbox.filter((i) => !i.resolved);
  const high = open.filter((i) => i.priority === "high" && !i.batched);
  const meetings = open.filter((i) => i.kind === "meeting");
  const rest = open.filter((i) => i.priority !== "high" && !i.batched && i.kind !== "meeting");
  const batched = open.filter((i) => i.batched);
  const done = s.inbox.filter((i) => i.resolved);
  const order = initial === "meeting" ? ["meetings", "high", "rest"] : ["high", "meetings", "rest"];
  const groups: Record<string, [string, InboxItem[]]> = { high: ["Needs you first", high], meetings: ["Meeting requests", meetings], rest: ["Approvals and reviews", rest] };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5 rounded-[16px] bg-[#fff4ec] p-3 ring-1 ring-[#f3cfb6]">
        <Face id="ada" size={30} />
        <div className="text-[12.5px] leading-snug text-[#8a4a24]">
          {open.length ? `I've sorted ${open.length - batched.length} items by what blocks the launch. ${batched.length ? "FYIs are batched for Friday." : ""}` : "You're all caught up. I'll ping you if anything needs you."}
        </div>
      </div>
      {order.map((k) => {
        const [title, items] = groups[k];
        return items.length ? (
          <Section key={k} title={`${title} · ${items.length}`}>
            <div className="flex flex-col gap-2">
              {items.map((i) => (
                <Item key={i.id} i={i} />
              ))}
            </div>
          </Section>
        ) : null;
      })}
      {batched.length > 0 && (
        <Section title="Batched for Friday">
          <div className="flex flex-col gap-2">
            {batched.map((i) => (
              <Item key={i.id} i={i} />
            ))}
          </div>
        </Section>
      )}
      {!open.length && <Empty>Nothing needs you right now.</Empty>}
      {done.length > 0 && (
        <button onClick={() => setShowDone((v) => !v)} className="self-start text-[12.5px] font-semibold text-muted hover:text-ink">
          {showDone ? "Hide" : "Show"} {done.length} resolved
        </button>
      )}
      {showDone && (
        <div className="flex flex-col gap-2 opacity-60">
          {done.map((i) => (
            <Item key={i.id} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
