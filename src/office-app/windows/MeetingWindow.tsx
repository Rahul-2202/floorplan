"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SPOTS } from "@/office/layout";
import { useMeeting, type Line, type Speaker } from "@/lib/meeting";
import { DAYS } from "@/sim/data/calendar";
import { clockLabel, useSim } from "@/sim/store";
import type { CalEvent } from "@/sim/types";
import { SoundButton, Transcript } from "@/components/meeting/Transcript";
import { Btn, Face, Section, Segmented, Window } from "../bits";
import { useUI } from "../ui";
import { homeOf } from "../World";
import { nameOf } from "../who";

const SEATS = ["mt:t2", "mt:b2", "mt:t1", "mt:b1", "mt:t3", "mt:b3"];
const PEOPLE = ["pm", "strat", "fe", "be", "ops", "qa", "cr1", "cr2", "editor"];

/* ----------------------------------------------------------------- planner */

export function MeetingPlanner({ from }: { from: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const requester = from === "ada" ? null : from;
  const [title, setTitle] = useState(requester ? `${nameOf(requester)}: decision needed` : "Quick sync");
  const [who, setWho] = useState<string[]>(requester ? [requester] : ["pm", "strat"]);
  const [day, setDay] = useState(3);
  const [start, setStart] = useState("16:00");
  const [chair, setChair] = useState<"ada" | "you">("ada");
  const [agenda, setAgenda] = useState("Where we are\nThe decision we need\nNext steps");

  const book = (now: boolean) => {
    const id = `ev-m-${s.clock}-${Math.round(Math.random() * 1000)}`;
    const ev: CalEvent = {
      id,
      title,
      day: now ? 3 : day,
      start: now ? clockLabel(s.clock, false) : start,
      end: now ? clockLabel(s.clock + 10, false) : `${start.split(":")[0]}:${String(Math.min(59, Number(start.split(":")[1]) + 15)).padStart(2, "0")}`,
      kind: requester ? "request" : "ceo",
      attendees: ["you", "ada", ...who],
      organizer: requester ?? "you",
      status: "confirmed",
      agenda: agenda.split("\n").filter(Boolean),
      preread: `Chaired by ${chair === "ada" ? "Ada" : "you"}. Ada will attach each agent's position.`,
    };
    d({ type: "addEvent", event: ev });
    d({ type: "toast", toast: { id: `bk-${id}`, who: "ada", text: now ? "Starting now in the meeting room." : `Booked ${DAYS[ev.day]} ${ev.start}. Invites sent, pre-read on its way.`, action: { label: "Calendar", panel: "calendar", ref: id } } });
    if (now) ui.openWin({ kind: "meeting", id });
    else ui.closeWin();
  };

  return (
    <Window
      width={560}
      onClose={ui.closeWin}
      icon={<Face id="ada" size={32} />}
      title={requester ? `${nameOf(requester)} requests a meeting` : "Call a meeting"}
      sub="Ada books the room, invites people and prepares the pre-read"
      footer={
        <div className="flex justify-end gap-2 border-t border-black/[0.06] px-4 py-3">
          <Btn onClick={() => book(false)}>Book it</Btn>
          <Btn tone="dark" onClick={() => book(true)}>
            Start now
          </Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-[12px] bg-[#f6f5f2] px-3.5 text-[15px] font-semibold outline-none ring-1 ring-black/[0.06]" />
        <Section title="Who">
          <div className="flex flex-wrap gap-1.5">
            {PEOPLE.map((p) => {
              const on = who.includes(p);
              return (
                <button key={p} onClick={() => setWho(on ? who.filter((x) => x !== p) : [...who, p])} className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[12px] font-semibold ring-1 ${on ? "bg-ink text-white ring-ink" : "bg-white text-ink-2 ring-black/[0.1]"}`}>
                  <Face id={p} size={20} /> {nameOf(p)}
                </button>
              );
            })}
          </div>
        </Section>
        <div className="grid grid-cols-3 gap-3">
          <Section title="Day">
            <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="h-9 w-full rounded-full bg-[#f2f0ec] px-3 text-[12.5px] font-semibold outline-none">
              {DAYS.map((x, i) => (
                <option key={x} value={i}>
                  {x}
                </option>
              ))}
            </select>
          </Section>
          <Section title="Time">
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-9 w-full rounded-full bg-[#f2f0ec] px-3 text-[12.5px] font-semibold outline-none" />
          </Section>
          <Section title="Chair">
            <Segmented
              size="sm"
              value={chair}
              onChange={setChair}
              options={[
                { v: "ada", l: "Ada" },
                { v: "you", l: "You" },
              ]}
            />
          </Section>
        </div>
        <Section title="Agenda">
          <textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} className="h-24 w-full rounded-[12px] bg-[#f6f5f2] p-3 text-[13px] outline-none ring-1 ring-black/[0.06]" />
        </Section>
      </div>
    </Window>
  );
}

/* -------------------------------------------------------------------- live */

function genericLines(ev: CalEvent): Line[] {
  const others = ev.attendees.filter((a) => a !== "you" && a !== "ada") as Speaker[];
  const lead = others[0] ?? "pm";
  const agenda = ev.agenda?.length ? ev.agenda : ["Where we are", "The decision", "Next steps"];
  return [
    { who: "ada", text: `Thanks everyone. ${agenda.length} items: ${agenda.join(", ").toLowerCase()}. ${nameOf(lead)}, start us off?` },
    { who: lead, text: "We're on track for launch. The one thing I need is a call on scope for next week." },
    { who: "you", text: "What would you recommend?" },
    { who: lead, text: "Finish what's in review first, then pick up SMS. It keeps the team focused." },
    { who: "you", text: "Agreed. Let's do that." },
    { who: "ada", text: "Noted. I'll write the minutes and track the actions." },
  ];
}

export function LiveMeeting({ id }: { id: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const ev = s.calendar.find((e) => e.id === id);
  const convo = ev?.conversationId ? s.conversations.find((c) => c.id === ev.conversationId) : undefined;
  const lines = useMemo<Line[]>(() => (convo ? convo.messages.map((m) => ({ who: m.who as Speaker, text: m.text })) : ev ? genericLines(ev) : []), [convo, ev]);
  const [sound, setSound] = useState(false);
  const [phase, setPhase] = useState<"before" | "live" | "after">("before");
  const meeting = useMeeting(lines, phase, sound);
  const agents = (ev?.attendees ?? []).filter((a) => a !== "you");
  const sRef = useRef(s);
  useEffect(() => {
    sRef.current = s;
  });

  // Everyone walks to the meeting room, then it starts.
  useEffect(() => {
    if (!ev) return;
    ui.walkTo(SPOTS["mt:head"][0], SPOTS["mt:head"][1]);
    agents.forEach((a, i) => d({ type: "live", id: a, patch: { at: a === "ada" ? "mt:foot" : SEATS[i % SEATS.length], status: "meeting" } }));
    const t = setTimeout(() => setPhase("live"), 4500);
    return () => {
      clearTimeout(t);
      agents.forEach((a) => d({ type: "live", id: a, patch: { at: homeOf(a, sRef.current), status: a === "ada" ? "working" : "working", bubble: null } }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // The speaker gets a bubble in the room.
  useEffect(() => {
    if (phase !== "live") return;
    const line = lines[meeting.index];
    agents.forEach((a) => d({ type: "live", id: a, patch: { bubble: line && line.who === a ? line.text : null } }));
    if (meeting.index >= lines.length) {
      const t = setTimeout(() => setPhase("after"), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting.index, phase]);

  if (!ev) return null;
  const minutes = convo?.minutes ?? { decision: "Finish what's in review, then SMS next week", actions: [{ who: agents.find((a) => a !== "ada") ?? "pm", text: "Update the plan" }, { who: "ada", text: "Track actions, report Friday" }] };

  const end = () => {
    if (!convo) {
      d({
        type: "addConvo",
        convo: { id: `c-${ev.id}`, kind: "meeting", title: ev.title, participants: ev.attendees, at: clockLabel(s.clock), voice: true, messages: lines.map((l) => ({ who: l.who, text: l.text, t: clockLabel(s.clock, false) })), minutes },
      });
      d({ type: "event", id: ev.id, patch: { conversationId: `c-${ev.id}` } });
    }
    d({ type: "toast", toast: { id: `min-${ev.id}`, who: "ada", text: `Minutes for “${ev.title}” are saved. ${minutes.actions.length} action items tracked.`, action: { label: "Read", panel: "conversations", ref: convo?.id ?? `c-${ev.id}` } } });
    ui.closeWin();
  };

  return (
    <Window
      width={440}
      onClose={end}
      icon={<span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#f1eefd] text-[#4a3fa8]">◷</span>}
      title={
        <span className="flex items-center gap-1.5">
          {phase === "live" && <span className="h-2 w-2 rounded-full bg-bad" style={{ animation: "led 1.4s steps(2) infinite" }} />}
          {ev.title}
        </span>
      }
      sub={phase === "before" ? "Everyone is walking to the meeting room…" : phase === "live" ? `Chaired by Ada · ${ev.attendees.length} people` : "Meeting ended"}
      footer={
        <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] px-4 py-3">
          <SoundButton sound={sound} onToggle={() => setSound((v) => !v)} speaking={meeting.speaking} />
          <Btn tone="dark" onClick={end}>
            {phase === "after" ? "Save minutes" : "End meeting"}
          </Btn>
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-3">
        <div className="flex -space-x-1.5">
          {ev.attendees.map((a) => (
            <span key={a} className="rounded-[10px] ring-2 ring-white">
              <Face id={a} size={28} />
            </span>
          ))}
        </div>
        {ev.preread && (
          <div className="rounded-[12px] bg-[#f6f5f2] p-3 text-[12.5px] text-ink-2">
            <span className="font-semibold text-ink">Pre-read: </span>
            {ev.preread}
          </div>
        )}
        <div className="h-[min(320px,40vh)]">
          <Transcript lines={lines} index={phase === "after" ? lines.length : meeting.index} speaking={meeting.speaking} waiting="Walking to the meeting room…" />
        </div>
        {phase === "after" && (
          <div className="rounded-[14px] bg-white p-3 ring-1 ring-black/[0.08]">
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Minutes</div>
            <div className="mt-1 text-[13px] font-semibold text-ink">{minutes.decision}</div>
            <div className="mt-2 flex flex-col gap-1">
              {minutes.actions.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-[12px] text-ink-2">
                  <Face id={a.who} size={16} /> {a.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Window>
  );
}
