"use client";

import { useState } from "react";
import { answerQuestion, approveOutput } from "@/sim/actions";
import { agentRoom, can, inboxFor, isCeo, recipients } from "@/sim/people";
import { roomName, useSim } from "@/sim/store";
import type { InboxItem } from "@/sim/types";
import { Btn, Empty, Face, Section } from "../bits";
import { AssignRoom } from "../cards/PersonCard";
import { useUI } from "../ui";
import { nameOf } from "../who";

const KIND: Record<InboxItem["kind"], { l: string; c: string }> = {
  question: { l: "Question", c: "bg-[#fdecea] text-[#9b2c24]" },
  approval: { l: "Approve", c: "bg-[#fdf3e0] text-[#8a5a10]" },
  meeting: { l: "Meeting", c: "bg-[#f1eefd] text-[#4a3fa8]" },
  escalation: { l: "Escalation", c: "bg-[#fdecea] text-[#9b2c24]" },
  fyi: { l: "FYI", c: "bg-[#f0efed] text-muted" },
};

function Item({ i, routed }: { i: InboxItem; routed?: boolean }) {
  const { s, d } = useSim();
  const ui = useUI();
  const [assign, setAssign] = useState(false);
  const req = i.ref?.type === "request" ? s.requests.find((r) => r.id === i.ref!.id) : undefined;
  const person = i.ref?.type === "person" ? s.people[i.ref.id] : undefined;
  const to = recipients(s, i);
  const viaLead = !i.to && agentRoom(i.from) && to[0] !== "you";
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
          {viaLead && (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#eef2fc] px-2 py-0.5 text-[10.5px] font-semibold text-[#21409a]">
              {routed ? `With ${nameOf(to[0])}, the ${roomName(agentRoom(i.from)).toLowerCase()} lead` : `Routed to you as ${roomName(agentRoom(i.from))} lead`} · {nameOf(i.from)} → {nameOf(to[0])}
            </div>
          )}
        </div>
      </div>
      {!i.resolved && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-10">
          {req && isCeo(s) && req.ceo === "pending" && (
            <>
              <Btn tone="dark" className="!py-1 !text-[12px]" onClick={() => d({ type: "decideRequest", id: req.id, by: "ceo", decision: "approved" })}>
                Approve and hire
              </Btn>
              <Btn className="!py-1 !text-[12px]" onClick={() => d({ type: "decideRequest", id: req.id, by: "ceo", decision: "declined" })}>
                Decline
              </Btn>
              <Btn tone="ghost" className="!py-1 !text-[12px]" onClick={() => ui.openPanel("people", "requests")}>
                Details
              </Btn>
            </>
          )}
          {req && !isCeo(s) && (
            <Btn className="!py-1 !text-[12px]" onClick={() => ui.openPanel("people", "requests")}>
              Track request
            </Btn>
          )}
          {person && !person.room && can(s, "assignPeople") && (
            <Btn tone="dark" className="!py-1 !text-[12px]" onClick={() => setAssign((v) => !v)}>
              {assign ? "Cancel" : "Assign a room"}
            </Btn>
          )}
          {person && (
            <Btn
              className="!py-1 !text-[12px]"
              onClick={() => {
                ui.closePanel();
                ui.summon(person.id);
              }}
            >
              Ask {person.name} over
            </Btn>
          )}
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
      {assign && person && (
        <div className="mt-2.5 pl-10">
          <AssignRoom id={person.id} onDone={() => setAssign(false)} />
        </div>
      )}
    </div>
  );
}

export function InboxPanel({ initial }: { initial?: string }) {
  const { s } = useSim();
  const [showDone, setShowDone] = useState(false);
  const [showRouted, setShowRouted] = useState(false);
  const box = inboxFor(s);
  const open = box.open;
  const ceo = isCeo(s);
  const lead = s.people[s.me]?.role === "lead";
  const high = open.filter((i) => i.priority === "high" && !i.batched);
  const meetings = open.filter((i) => i.kind === "meeting");
  const rest = open.filter((i) => i.priority !== "high" && !i.batched && i.kind !== "meeting");
  const batched = open.filter((i) => i.batched);
  const done = box.all.filter((i) => i.resolved);
  const order = initial === "meeting" ? ["meetings", "high", "rest"] : ["high", "meetings", "rest"];
  const groups: Record<string, [string, InboxItem[]]> = { high: ["Needs you first", high], meetings: ["Meeting requests", meetings], rest: ["Approvals and reviews", rest] };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5 rounded-[16px] bg-[#fff4ec] p-3 ring-1 ring-[#f3cfb6]">
        <Face id="ada" size={30} />
        <div className="text-[12.5px] leading-snug text-[#8a4a24]">
          {!open.length
            ? "You're all caught up. I'll ping you if anything needs you."
            : ceo
              ? `I've sorted ${open.length - batched.length} items by what blocks the launch. ${box.routed.length ? `Your leads are handling ${box.routed.length} more.` : ""} ${batched.length ? "FYIs are batched for Friday." : ""}`
              : lead
                ? `${open.length} for you. Questions and blockers from your room's agent head come here, not to the CEO.`
                : `${open.length} for you: updates on your requests and anything you're tagged in.`}
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
      {box.routed.length > 0 && (
        <Section
          title={`With your leads · ${box.routed.length}`}
          right={
            <button onClick={() => setShowRouted((v) => !v)} className="text-[12px] font-semibold text-ink hover:underline">
              {showRouted ? "Hide" : "Show"}
            </button>
          }
        >
          {showRouted ? (
            <div className="flex flex-col gap-2">
              {box.routed.map((i) => (
                <Item key={i.id} i={i} routed />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] bg-[#eef2fc] px-3.5 py-2.5 text-[12px] text-[#21409a]">
              Agent heads now report to their room leads. You can still see and answer anything here.
            </div>
          )}
        </Section>
      )}
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
