"use client";

import { motion, useMotionValueEvent, useTransform } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Office } from "@/office/Office";
import type { Scene } from "@/office/types";
import { ChatPanel, type ChatMsg } from "../chat/Chat";
import { Button } from "../ui";
import { DomainCard, LockCard, ProposalCard } from "./cards";
import { easeInOut, lerp, range, usePinProgress, useStep } from "@/lib/scroll";

const BLUEPRINT = { dev: "blueprint", marketing: "blueprint", meeting: "blueprint", sales: "blueprint", legal: "blueprint", finance: "blueprint" } as const;

const HERO: Scene = {
  rooms: { ceo: "built", ...BLUEPRINT },
  agents: {
    you: { at: "seat:you" },
    ada: { at: "ada:home", bubble: { text: "Hi, I'm Ada. Let's build your company.", tone: "ada" } },
  },
  camera: { x: 0, y: 0, w: 50, h: 28, anchor: "top" },
  labels: true,
};

const TEAM_WORKING = {
  pm: { at: "seat:pm", status: "working" as const },
  fe: { at: "seat:fe", status: "working" as const },
  be: { at: "seat:be", status: "working" as const },
  ops: { at: "seat:ops", status: "working" as const },
  qa: { at: "seat:qa", status: "working" as const },
};

interface Step {
  msgs: ChatMsg[];
  scene: Scene;
}

const STEPS: Step[] = [
  {
    msgs: [{ id: "a1", from: "ada", text: "Hi, I'm Ada, your office manager. Tell me what you're building and I'll set up the team." }],
    scene: {
      rooms: { ceo: "built", ...BLUEPRINT },
      camera: "ceo",
      agents: { you: { at: "seat:you" }, ada: { at: "ada:home", bubble: { text: "What are we building?", tone: "ada" } } },
    },
  },
  {
    msgs: [{ id: "y1", from: "you", text: "A booking app for physio clinics. I want it live in six weeks." }],
    scene: {
      rooms: { ceo: "built", ...BLUEPRINT, dev: "ghost" },
      camera: ["ceo", "dev"],
      agents: { you: { at: "seat:you", bubble: { text: "A booking app for physio clinics.", tone: "ceo" } }, ada: { at: "ada:home", status: "thinking" } },
    },
  },
  {
    msgs: [
      { id: "a2", from: "ada", text: "Then you need a development room. A PM to lead it, plus frontend, backend, DevOps and a tester.", card: <ProposalCard /> },
    ],
    scene: {
      rooms: { ceo: "built", ...BLUEPRINT, dev: "built" },
      camera: ["ceo", "dev"],
      board: { todo: 0, doing: 0, done: 0 },
      agents: { you: { at: "seat:you" }, ada: { at: "ada:home", bubble: { text: "Setting up Development…", tone: "ada" } } },
    },
  },
  {
    msgs: [
      { id: "s1", from: "system", text: "✓ 5 agents hired into Development" },
      { id: "a3", from: "ada", text: "They're on their way in. The PM runs the room and reports to you." },
    ],
    scene: {
      rooms: { ceo: "built", ...BLUEPRINT, dev: "built" },
      camera: { x: 8, y: 0, w: 29, h: 16 },
      board: { todo: 0, doing: 0, done: 0 },
      agents: {
        you: { at: "seat:you" },
        ada: { at: "ada:home" },
        pm: { from: "ceo:outside", at: "seat:pm", delay: 0.1, speed: 1.25, bubble: "Hi! I'll lead the room." },
        fe: { from: "ceo:outside", at: "seat:fe", delay: 0.7, speed: 1.25 },
        be: { from: "ceo:outside", at: "seat:be", delay: 1.3, speed: 1.25 },
        ops: { from: "ceo:outside", at: "seat:ops", delay: 1.9, speed: 1.25 },
        qa: { from: "ceo:outside", at: "seat:qa", delay: 2.5, speed: 1.25 },
      },
    },
  },
  {
    msgs: [
      { id: "y2", from: "you", text: "Nothing goes live without my sign-off." },
      { id: "a4", from: "ada", text: "Done. Merges to main now need your approval, and I've locked the rule.", card: <LockCard /> },
    ],
    scene: {
      rooms: { ceo: "built", ...BLUEPRINT, dev: "built" },
      camera: "dev",
      locked: ["dev"],
      board: { todo: 5, doing: 2, done: 0 },
      agents: {
        you: { at: "seat:you" },
        ada: { at: "ada:home" },
        ...TEAM_WORKING,
        pm: { at: "seat:pm", status: "working", bubble: "Sprint 1: 7 tickets. Let's go." },
      },
    },
  },
  {
    msgs: [{ id: "a5", from: "ada", text: "Whenever you're ready, here's what I'd add next. Any team, any domain.", card: <DomainCard /> }],
    scene: {
      rooms: { ceo: "built", dev: "built", meeting: "built", marketing: "ghost", sales: "ghost", legal: "ghost", finance: "ghost" },
      locked: ["dev"],
      board: { todo: 4, doing: 3, done: 1 },
      agents: { you: { at: "seat:you" }, ada: { at: "ada:home" }, ...TEAM_WORKING },
    },
  },
  {
    msgs: [
      { id: "y3", from: "you", text: "Start with dev. Let's ship." },
      { id: "a6", from: "ada", text: "On it. I'll only bring you what needs you." },
    ],
    scene: {
      rooms: { ceo: "built", dev: "built", meeting: "built", marketing: "ghost", sales: "ghost", legal: "ghost", finance: "ghost" },
      camera: ["ceo", "dev"],
      locked: ["dev"],
      board: { todo: 3, doing: 3, done: 2 },
      agents: {
        you: { at: "seat:you" },
        ada: { at: "ada:home", bubble: { text: "Your office is open.", tone: "ada" } },
        ...TEAM_WORKING,
        be: { at: "seat:be", status: "working", badge: 1 },
      },
    },
  },
];

const HERO_END = 0.12;
const CHAT_W = 360;
const STEP_FROM = 0.1;

export function Act1() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const p = usePinProgress(section);
  const step = useStep(p, STEPS.length, STEP_FROM, 0.98);
  const [heroMode, setHeroMode] = useState(true);
  const hero = useRef({ tx: 0, ty: 0, s: 1 });
  const [, force] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [chatH, setChatH] = useState(300);

  useLayoutEffect(() => {
    const measure = () => {
      const st = stage.current?.getBoundingClientRect();
      const sl = slot.current?.getBoundingClientRect();
      if (!st || !sl) return;
      const vw = st.width;
      const vh = st.height;
      const mobile = vw < 1024;
      setMobile(mobile);
      setChatH(Math.round(Math.min(340, sl.height * 0.46)));
      const targetW = Math.min(1256, vw - (mobile ? 24 : 64));
      const s = targetW / sl.width;
      const copyBottom = copy.current ? copy.current.getBoundingClientRect().bottom - st.top : vh * 0.5;
      const targetTop = Math.max(copyBottom + (mobile ? 28 : 44), vh * 0.42);
      const left = sl.left - st.left;
      const top = sl.top - st.top;
      hero.current = {
        s,
        tx: vw / 2 - (left + sl.width / 2),
        ty: targetTop - top - sl.height / 2 + (sl.height * s) / 2,
      };
      force((n) => n + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const t = useTransform(p, (v) => easeInOut(range(v, 0.025, HERO_END)));
  const frameX = useTransform(t, (v) => lerp(hero.current.tx, 0, v));
  const frameY = useTransform(t, (v) => lerp(hero.current.ty, 0, v));
  const frameS = useTransform(t, (v) => lerp(hero.current.s, 1, v));
  const radius = useTransform(t, (v) => lerp(30, 28, v));
  const headOpacity = useTransform(p, (v) => 1 - range(v, 0.005, 0.05));
  const headY = useTransform(p, (v) => -70 * easeInOut(range(v, 0, 0.07)));
  const headBlur = useTransform(p, (v) => `blur(${range(v, 0.01, 0.05) * 8}px)`);
  const chatOpacity = useTransform(p, (v) => range(v, 0.085, 0.125));
  const chatX = useTransform(p, (v) => -28 * (1 - easeInOut(range(v, 0.08, 0.13))));
  const hintOpacity = useTransform(p, (v) => 1 - range(v, 0, 0.03));

  useMotionValueEvent(p, "change", (v) => setHeroMode(v < STEP_FROM));

  const scene = heroMode ? HERO : STEPS[step].scene;
  const messages = useMemo(() => STEPS.slice(0, step + 1).flatMap((s) => s.msgs), [step]);

  return (
    <section ref={section} id="top" className="relative" style={{ height: "calc(100vh + 620vh)" }}>
      <div ref={stage} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* soft backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,#ffffff_0%,rgba(255,255,255,0)_60%)]" />

        {/* Hero copy */}
        <motion.div style={{ opacity: headOpacity, y: headY, filter: headBlur }} className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center px-5 pt-[clamp(96px,14vh,150px)] text-center">
          <div ref={copy} className="pointer-events-auto flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="display text-[clamp(40px,6.4vw,84px)] text-ink">
              Your AI company.
              <br />
              <span className="text-second">Built in one conversation.</span>
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-[620px] text-[16.5px] leading-[1.55] text-muted md:text-[18.5px]"
          >
            Tell Ada, your office manager, what you&apos;re building. She sets up rooms of AI agents that plan, build and ship together, and brings you only
            the decisions that need you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 flex items-center gap-3"
          >
            <Button href="#demo">Book a demo</Button>
            <Button href="/start" variant="secondary">
              Set up your office →
            </Button>
          </motion.div>
          </div>
        </motion.div>

        {/* Stage: the office fills it, Ada's chat floats inside */}
        <div className="absolute inset-x-0 bottom-0 top-[76px] mx-auto max-w-[1320px] px-3 pb-3 md:px-8 md:pb-7">
          <div ref={slot} className="relative h-full w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.45 }}
              style={{ x: frameX, y: frameY, scale: frameS, borderRadius: radius }}
              className="absolute inset-0 z-10 overflow-hidden shadow-[0_2px_4px_rgba(10,10,10,0.04),0_40px_100px_-30px_rgba(10,10,10,0.35)] ring-1 ring-black/[0.06]"
            >
              <Office scene={scene} inset={heroMode ? undefined : mobile ? { bottom: chatH + 12 } : { left: CHAT_W + 24 }} />
              <motion.div
                style={{ opacity: chatOpacity, x: chatX }}
                className="absolute inset-x-2 bottom-2 z-20 lg:inset-x-auto lg:bottom-3 lg:left-3 lg:top-3"
              >
                <div style={mobile ? { height: chatH } : { width: CHAT_W, height: "100%" }}>
                  <ChatPanel messages={messages} compact={mobile && chatH < 280} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.div style={{ opacity: hintOpacity }} className="pointer-events-none absolute inset-x-0 bottom-6 z-20 hidden justify-center md:flex">
          <div className="flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-accent" style={{ animation: "pulse-ring 1.8s ease-out infinite" }} />
              <span className="relative h-2 w-2 rounded-full bg-accent" />
            </span>
            Scroll to build your office
          </div>
        </motion.div>
      </div>
    </section>
  );
}
