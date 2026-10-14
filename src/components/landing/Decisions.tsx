"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";
import { Portrait } from "@/office/Avatar";
import { CAST } from "@/office/layout";
import { Office } from "@/office/Office";
import type { AgentScene, Scene } from "@/office/types";
import { useIsDesktop } from "@/lib/useMedia";
import { useMeeting, type Line, type MeetingPhase } from "@/lib/meeting";
import { SoundButton, Transcript } from "../meeting/Transcript";
import { BrandIcon } from "../brands";
import { Frame, Pinned, StageHead } from "./Pinned";

const ROOMS = { ceo: "built", dev: "built", meeting: "built", marketing: "ghost", sales: "blueprint", legal: "blueprint", finance: "blueprint" } as const;
const CAM = { x: 0, y: 0, w: 31, h: 15.5 };

const team = (extra: Record<string, AgentScene> = {}): Record<string, AgentScene> => ({
  you: { at: "seat:you" },
  ada: { at: "ada:home" },
  pm: { at: "seat:pm", status: "working" },
  fe: { at: "seat:fe", status: "working" },
  be: { at: "seat:be", status: "working" },
  ops: { at: "seat:ops", status: "working" },
  qa: { at: "seat:qa", status: "working" },
  ...extra,
});

const S = (s: Partial<Scene>): Scene => ({ rooms: ROOMS, camera: CAM, locked: ["dev"], agents: team(), board: { todo: 2, doing: 3, done: 4 }, ...s });

type View = "inbox" | "triage" | "preread" | "meeting" | "minutes" | "follow";

const MEETING_CAM = { x: 0.25, y: 12.5, w: 13.5, h: 15.25 };
const IN_ROOM = {
  you: { at: "mt:head", status: "meeting" as const },
  ada: { at: "mt:t3", status: "meeting" as const },
  pm: { at: "mt:b3", status: "meeting" as const },
};

const STEPS: { caption: string; view: View; scene: Scene }[] = [
  {
    caption: "The PM hits a trade-off above its authority, so it comes to your door.",
    view: "inbox",
    scene: S({
      agents: team({ pm: { at: "ceo:outside", status: "blocked", bubble: "Got 10 minutes? Scope question." } }),
      props: { knock: { kind: "knock", at: [12.6, 12.2], label: "Meeting request", tone: "warn", delay: 1.4 } },
    }),
  },
  {
    caption: "Ada triages first. Related requests merge, small ones become inbox items.",
    view: "triage",
    scene: S({
      agents: team({
        pm: { at: "ceo:outside", status: "blocked" },
        ada: { at: "ada:home", bubble: { text: "Merged two requests. Meeting room at 2:00.", tone: "ada" } },
      }),
      props: { knock: { kind: "calendar", at: [12.6, 12.2], label: "Booked · Meeting room", tone: "violet" } },
    }),
  },
  {
    caption: "Every meeting comes with a pre-read, so the time is spent deciding.",
    view: "preread",
    scene: S({
      camera: { x: 0, y: 0, w: 24, h: 28 },
      agents: team({
        you: { at: "mt:head", delay: 0.2 },
        ada: { at: "mt:t3", status: "working", bubble: { text: "Pre-read is on the table.", tone: "ada" } },
        pm: { at: "mt:b3", delay: 0.5 },
      }),
    }),
  },
  {
    caption: "Ada chairs. The head recommends, you push back, then decide.",
    view: "meeting",
    scene: S({ camera: MEETING_CAM, agents: team(IN_ROOM) }),
  },
  {
    caption: "The head reads the decision back. Minutes are written as you talk.",
    view: "minutes",
    scene: S({ camera: MEETING_CAM, agents: team(IN_ROOM) }),
  },
  {
    caption: "The PM updates Linear and briefs the team. Ada tracks every action item.",
    view: "follow",
    scene: S({
      board: { todo: 3, doing: 3, done: 4 },
      agents: team({
        pm: { at: "dev:brief", bubble: "Decision's in: we ship Friday." },
        fe: { at: "seat:fe", emote: "✓" },
        be: { at: "seat:be", emote: "✓" },
        ops: { at: "seat:ops", emote: "✓" },
        qa: { at: "seat:qa", emote: "✓" },
      }),
      props: { linear: { kind: "ticket", at: [30, 6.15], label: "BOOK-150", sub: "SMS → v1.1", tone: "violet" } },
    }),
  },
];

const LINES: Line[] = [
  { who: "ada", text: "Ten minutes on launch scope. PM, what do you recommend?" },
  { who: "pm", text: "Ship Friday without SMS reminders. SMS needs a provider contract, and that alone takes a week." },
  { who: "you", text: "Will clinics miss reminders on day one?" },
  { who: "pm", text: "No. Every booking gets an email reminder. SMS follows in v1.1.", say: "No. Every booking gets an email reminder. SMS follows in version one point one." },
  { who: "ada", text: "Marketing asked for a firm date. Friday works for them too." },
  { who: "you", text: "Then let's go with B. We ship Friday." },
  {
    who: "pm",
    text: "Reading back: launch Friday, SMS moves to v1.1, I'll update Linear and brief the team.",
    say: "Reading back. Launch Friday, SMS moves to version one point one. I'll update Linear and brief the team.",
  },
  { who: "ada", text: "Got it. I'll track the action items and save the decision." },
];

/* --------------------------------------------------------------- panel views */

function Pill({ children, tone }: { children: ReactNode; tone: "high" | "approve" | "fyi" }) {
  const cls = { high: "bg-[#fdecea] text-[#9b2c24]", approve: "bg-[#fdf3e0] text-[#8a5a10]", fyi: "bg-[#f0efed] text-muted" }[tone];
  return <span className={`rounded-full px-1.5 py-[1px] text-[10.5px] font-bold uppercase tracking-wide ${cls}`}>{children}</span>;
}

function InboxItem({ who, title, sub, tone, tag, delay = 0, dim = false }: { who: string; title: string; sub: string; tone: "high" | "approve" | "fyi"; tag: string; delay?: number; dim?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: dim ? 0.55 : 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 28 }}
      className="flex gap-2.5 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]"
    >
      <Portrait look={CAST[who].look} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Pill tone={tone}>{tag}</Pill>
          <span className="text-[11.5px] text-faint">{CAST[who].name}</span>
        </div>
        <div className="mt-1 text-[13px] font-semibold leading-snug text-ink">{title}</div>
        <div className="mt-0.5 text-[12px] leading-snug text-muted">{sub}</div>
      </div>
    </motion.div>
  );
}

function InboxView({ triaged }: { triaged: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <InboxItem who="pm" tag="High" tone="high" title="Ship Friday without SMS reminders?" sub="Scope trade-off. Needs your call." />
      {triaged && (
        <>
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <div className="flex items-center gap-2 rounded-[12px] bg-[#fff4ec] px-3 py-2 text-[12px] font-medium text-[#a24d1f] ring-1 ring-[#f3cfb6]">
              <Portrait look={CAST.ada.look} size={18} bg="#fbe9de" />
              Merged with Marketing&apos;s launch-date request
            </div>
          </motion.div>
          <InboxItem who="ops" tag="Approve" tone="approve" title="First merge to main" sub="DevOps is using this permission for the first time." delay={0.1} />
          <InboxItem who="ada" tag="FYI" tone="fyi" title="3 updates batched for Friday" sub="Nothing here needs you today." delay={0.2} dim />
        </>
      )}
    </div>
  );
}

function PreRead() {
  const pos = [
    { id: "pm", text: "Recommends B. SMS needs a provider contract we don't have yet." },
    { id: "be", text: "B. Reminders are a separate service, easy to add later." },
    { id: "qa", text: "B is lower risk. Fewer moving parts on launch day." },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.06]">
        <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Question</div>
        <div className="mt-1 text-[14px] font-semibold leading-snug text-ink">Launch Friday without SMS reminders?</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { k: "A", t: "Delay a week, ship with SMS" },
            { k: "B", t: "Ship Friday, SMS in v1.1" },
          ].map((o) => (
            <div key={o.k} className={`rounded-[10px] p-2.5 ring-1 ${o.k === "B" ? "bg-[#f1eefd] ring-[#d8d1f7]" : "bg-[#f6f5f2] ring-black/[0.05]"}`}>
              <div className="text-[11px] font-bold text-muted">Option {o.k}</div>
              <div className="text-[12.5px] font-semibold leading-snug text-ink">{o.t}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.06]">
        <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Positions</div>
        <div className="mt-2 flex flex-col gap-2.5">
          {pos.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="flex gap-2">
              <Portrait look={CAST[p.id].look} size={22} />
              <div className="text-[12.5px] leading-snug text-ink-2">
                <span className="font-semibold text-ink">{CAST[p.id].name}: </span>
                {p.text}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MeetingView({ index, speaking, minutes }: { index: number; speaking: boolean; minutes: boolean }) {
  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="min-h-0 flex-1">
        <Transcript lines={LINES} index={index} speaking={speaking} />
      </div>
      <AnimatePresence>
        {minutes && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            className="shrink-0 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]"
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Minutes</div>
              <span className="text-[10.5px] font-semibold text-muted">written by Ada</span>
            </div>
            <div className="mt-1 text-[13px] font-semibold text-ink">Ship Friday · SMS reminders in v1.1</div>
            <div className="mt-2 flex flex-col gap-1">
              {[
                { id: "pm", t: "Update BOOK-142, add BOOK-150" },
                { id: "be", t: "Shortlist two SMS providers" },
                { id: "ada", t: "Track both, report Friday" },
              ].map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.1 }} className="flex items-center gap-2 text-[12px] text-ink-2">
                  <Portrait look={CAST[a.id].look} size={16} bg={a.id === "ada" ? "#fbe9de" : undefined} />
                  {a.t}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FollowView() {
  const rows = [
    { icon: <BrandIcon name="Linear" size={14} />, t: "BOOK-150 created: SMS reminders, v1.1", s: "by PM" },
    { icon: <Portrait look={CAST.pm.look} size={18} />, t: "Team briefed from the minutes", s: "4 of 4 acknowledged" },
    { icon: <Portrait look={CAST.ada.look} size={18} bg="#fbe9de" />, t: "Tracking 3 action items", s: "1 done" },
    { icon: <span className="text-[12px]">◈</span>, t: "Decision saved to company memory", s: "links to minutes" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12, type: "spring", stiffness: 260, damping: 26 }}
          className="flex items-center gap-2.5 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#f6f5f2]">{r.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold leading-snug text-ink">{r.t}</div>
            <div className="text-[11.5px] text-muted">{r.s}</div>
          </div>
          <span className="text-[13px] text-ok">✓</span>
        </motion.div>
      ))}
    </div>
  );
}

const TITLES: Record<View, [string, string]> = {
  inbox: ["Needs your attention", "1 new"],
  triage: ["Needs your attention", "Triaged by Ada"],
  preread: ["Pre-read", "Meeting room · 10 min"],
  meeting: ["Meeting room", "You, PM · chaired by Ada"],
  minutes: ["Meeting room", "Minutes writing live"],
  follow: ["Follow-up", "Tracked by Ada"],
};

function Panel({ view, meeting, sound, onToggle }: { view: View; meeting: { index: number; speaking: boolean }; sound: boolean; onToggle: () => void }) {
  const key = view === "triage" ? "inbox" : view === "minutes" ? "meeting" : view;
  const inMeeting = key === "meeting";
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#f6f5f2] shadow-[var(--shadow-float)] ring-1 ring-black/[0.05]">
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] bg-white px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div key={TITLES[view][0] + TITLES[view][1]} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
              {inMeeting && <span className="h-2 w-2 rounded-full bg-bad" style={{ animation: "led 1.4s steps(2) infinite" }} />}
              {TITLES[view][0]}
            </div>
            <div className="text-[12px] text-muted">{TITLES[view][1]}</div>
          </motion.div>
        </AnimatePresence>
        {inMeeting ? <SoundButton sound={sound} onToggle={onToggle} speaking={meeting.speaking} /> : <Portrait look={CAST.ada.look} size={28} bg="#fbe9de" />}
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            className="h-full"
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {key === "inbox" && <InboxView triaged={view === "triage"} />}
            {key === "preread" && <PreRead />}
            {key === "meeting" && <MeetingView index={meeting.index} speaking={meeting.speaking} minutes={view === "minutes"} />}
            {key === "follow" && <FollowView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const TONE: Record<string, "ada" | "ceo" | "default"> = { ada: "ada", you: "ceo", pm: "default" };

function DecisionsStage({ step, desktop }: { step: number; desktop: boolean }) {
  const [sound, setSound] = useState(false);
  const view = STEPS[step].view;
  const phase: MeetingPhase = step < 3 ? "before" : step > 4 ? "after" : "live";
  const meeting = useMeeting(LINES, phase, sound);

  // Whoever is talking gets the speech bubble in the office.
  const scene = useMemo(() => {
    const base = STEPS[step].scene;
    const line = phase === "live" ? LINES[meeting.index] : undefined;
    if (!line) return base;
    const agents = { ...base.agents };
    const a = agents[line.who];
    if (a) agents[line.who] = { ...a, bubble: { text: line.text, tone: TONE[line.who] } };
    return { ...base, agents };
  }, [step, phase, meeting.index]);

  return (
    <div className="flex h-full flex-col">
      <StageHead title="Decisions come to you." second="Everything else doesn't." captions={STEPS.map((s) => s.caption)} step={step} />
      <div className="mx-auto min-h-0 w-full max-w-[1320px] flex-1 px-3 pb-3 pt-5 md:px-8 md:pb-7">
        <Frame>
          <Office scene={scene} inset={desktop ? { right: 384 } : { bottom: 266 }} />
          <div className="absolute inset-x-2 bottom-2 z-20 h-[256px] lg:inset-x-auto lg:bottom-3 lg:right-3 lg:top-3 lg:h-auto lg:w-[360px]">
            <Panel view={view} meeting={meeting} sound={sound} onToggle={() => setSound((v) => !v)} />
          </div>
        </Frame>
      </div>
    </div>
  );
}

export function DecisionsSection() {
  const desktop = useIsDesktop();
  return (
    <Pinned id="decisions" steps={STEPS.length} per={70}>
      {(step) => <DecisionsStage step={step} desktop={desktop} />}
    </Pinned>
  );
}
