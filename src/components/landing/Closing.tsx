"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Office } from "@/office/Office";
import type { Scene } from "@/office/types";
import { LogoMark } from "../Logo";
import { Button, Reveal, SectionHead } from "../ui";

const FAQ = [
  {
    q: "What is FloorPlan?",
    a: "An AI office you run as CEO. You talk to Ada, your office manager, and she sets up rooms of AI agents for each part of your work, such as development, marketing, sales, legal or finance. The agents do the work, talk to each other and bring you only the decisions that need you.",
  },
  {
    q: "How is this different from an AI agent or a chatbot?",
    a: "An agent waits for your next prompt. FloorPlan gives you a team that's organised like a company: heads who own a room, specialists who work in parallel, structured meetings with minutes, and a shared memory. You manage it through an org chart, not a node graph or a prompt box.",
  },
  {
    q: "Who is Ada?",
    a: "Your always-present office manager. She interviews you, proposes teams, hires and configures agents, writes each room's spec, enforces your rules, triages your inbox, books meetings with a pre-read and keeps company memory tidy. To you she feels like one person; underneath she works over structured settings you can always see.",
  },
  {
    q: "Which kinds of teams can I set up?",
    a: "Any domain. Ada suggests agents to match: a PM, developers, DevOps and a tester for development; a strategist, creators and an editor for marketing; leads and researchers for sales; reviewers for legal; a controller and bookkeeper for finance. Every room's members, tools, outputs and definition of done are yours to change.",
  },
  {
    q: "Do the agents really talk to each other?",
    a: "Yes, through structured channels. Any agent can ask any other a question directly. Work for another room goes through that room's head. Messages queue until a natural break point, urgent issues go to the head, and only a head, Ada or you can tell someone to stop. Anything that needs a decision becomes a meeting with minutes.",
  },
  {
    q: "Which AI models and runtimes do the agents use?",
    a: "You choose per agent. One developer can run on Claude Code and another on Codex. FloorPlan is the office layer on top: it writes each agent's memory file before every session, so improvements in any runtime show up in your team.",
  },
  {
    q: "What needs my approval?",
    a: "You decide. By default nothing goes public without you, and the first time an agent uses a powerful permission, such as merging to main, it asks first. You can lock rules so Ada can never change them from a chat, and every change is read back and versioned with one-click rollback.",
  },
  {
    q: "How does the memory work?",
    a: "Memory is layered like the company: company, room, agent and conversation, each with an owner. Knowledge distills up and is derived down, old facts are superseded rather than deleted, and each agent loads only what its current task needs. You can read and edit everything the company remembers.",
  },
  {
    q: "Can I use it with the tools and workflows I already have?",
    a: "Yes. Rooms work inside your Slack, Linear, Jira, GitHub, HubSpot, Google Workspace and more. Many teams start by attaching an existing workflow as a room and grow from there.",
  },
  {
    q: "Do I have to use the visual office?",
    a: "On desktop the office is the interface, and every cue reflects real status: working, blocked, idle or waiting at your door. You can jump straight to any room, search or open your inbox without walking anywhere. On mobile it becomes a simple list of what needs you.",
  },
];

function Item({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-black/[0.08]">
      <button onClick={onClick} className="flex w-full items-center justify-between gap-6 py-5 text-left">
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
          {q}
        </span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 28 }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ebe9e4] text-[18px] text-ink">
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <p className="max-w-[680px] pb-6 text-[15.5px] leading-[1.6] text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative px-5 py-[clamp(96px,14vh,160px)] md:px-8">
      <SectionHead title="Questions, answered." sub="How FloorPlan works, and what makes it different." />
      <Reveal className="mx-auto mt-12 max-w-[820px]">
        {FAQ.map((f, i) => (
          <Item key={f.q} q={f.q} a={f.a} open={open === i} onClick={() => setOpen(open === i ? null : i)} />
        ))}
      </Reveal>
    </section>
  );
}

const BUSY: Scene = {
  rooms: { ceo: "built", dev: "built", marketing: "built", meeting: "built", sales: "built", legal: "built", finance: "built" },
  labels: false,
  camera: { x: 0, y: 0, w: 50, h: 28, cover: true },
  board: { todo: 2, doing: 4, done: 7 },
  agents: {
    you: { at: "seat:you" },
    ada: { at: "ada:home" },
    pm: { at: "mt:t2", status: "meeting" },
    strat: { at: "mt:b2", status: "meeting" },
    fe: { at: "seat:fe", status: "working" },
    be: { at: "seat:be", status: "working" },
    ops: { at: "seat:ops", status: "working" },
    qa: { at: "seat:qa", status: "working" },
    cr1: { at: "seat:cr1", status: "working" },
    cr2: { at: "seat:cr2", status: "working" },
    editor: { at: "seat:editor", status: "working" },
    lead: { at: "seat:lead", status: "working" },
    sdr: { at: "seat:sdr", status: "working" },
    res: { at: "seat:res", status: "working" },
    counsel: { at: "seat:counsel", status: "working" },
    reviewer: { at: "seat:reviewer", status: "working" },
    para: { at: "seat:para", status: "idle" },
    ctrl: { at: "seat:ctrl", status: "working" },
    book: { at: "seat:book", status: "working" },
    analyst: { at: "seat:analyst", status: "working" },
  },
};

export function CtaSection() {
  return (
    <section id="demo" className="relative px-3 pb-6 pt-[clamp(80px,12vh,140px)] md:px-8">
      <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[36px] bg-[#efe9df] ring-1 ring-black/[0.05]">
        <div className="relative z-10 flex flex-col items-center px-6 pb-10 pt-[clamp(56px,9vh,96px)] text-center">
          <SectionHead
            title="Walk into your office."
            second="Your company is one conversation away."
            sub="Book a demo and we'll set up your first room with you, live. Bring a real project."
          />
          <Reveal delay={0.15} className="mt-8 flex gap-3">
            <Button href="#demo">Book a demo</Button>
            <Button href="#top" variant="secondary" className="!bg-white hover:!bg-white/80">
              Back to the start
            </Button>
          </Reveal>
        </div>
        <Reveal className="relative mx-3 mb-3 aspect-[16/8] overflow-hidden rounded-[26px] ring-1 ring-black/[0.06] md:mx-6 md:mb-6">
          <Office scene={BUSY} />
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-4 px-5 py-10 text-[13.5px] text-muted md:flex-row md:px-8">
      <div className="flex items-center gap-2.5">
        <LogoMark size={22} />
        <span className="text-[17px] text-ink" style={{ fontFamily: "var(--font-serif)" }}>
          FloorPlan
        </span>
        <span className="ml-2">Your AI company, in one office.</span>
      </div>
      <div className="flex gap-6">
        <a href="#how" className="hover:text-ink">
          How it works
        </a>
        <a href="#memory" className="hover:text-ink">
          Memory
        </a>
        <a href="#faq" className="hover:text-ink">
          FAQ
        </a>
        <span>© 2026 FloorPlan</span>
      </div>
    </footer>
  );
}
