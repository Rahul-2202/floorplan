"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Office } from "@/office/Office";
import { useMeeting, type MeetingPhase } from "@/lib/meeting";
import { LogoMark } from "@/components/Logo";
import { BASE, CHAPTERS, MEETING_LINES, STEPS, SYNC_LINES } from "./script";
import { build } from "./types";
import { ContextPanel, EventLog, MemoryPanel } from "./panels";

const PER = 55; // vh of scroll per step
const LEAD = 20; // vh before the first step advances

type Lenis = { scrollTo: (y: number, o?: { immediate?: boolean; duration?: number }) => void };
const lenis = () => (window as unknown as { lenis?: Lenis }).lenis;

const TONE: Record<string, "ada" | "ceo" | "default"> = { ada: "ada", you: "ceo" };

export function Walkthrough() {
  const all = useMemo(() => build(STEPS, BASE), []);
  const N = all.length;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [sound, setSound] = useState(false);
  const [tab, setTab] = useState<"context" | "memory" | "events">("context");
  const total = N * PER + LEAD;

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const s = Math.min(N - 1, Math.max(0, Math.floor(((v * total - LEAD) / (N * PER)) * N)));
    setStep((p) => (p === s ? p : s));
    setPinned(v > 0 && v < 1);
  });

  const yFor = useCallback(
    (k: number) => {
      const top = ref.current?.offsetTop ?? 0;
      return top + ((LEAD + (k + 0.5) * PER) / 100) * window.innerHeight;
    },
    [],
  );

  const jump = useCallback(
    (k: number, immediate = false) => {
      const target = Math.max(0, Math.min(N - 1, k));
      const y = yFor(target);
      const l = lenis();
      if (l) l.scrollTo(y, immediate ? { immediate: true } : { duration: 1.1 });
      else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
    },
    [N, yFor],
  );

  // Deep links: #step-12
  useEffect(() => {
    const m = window.location.hash.match(/step-(\d+)/);
    if (!m) return;
    const t = setTimeout(() => jump(Number(m[1]) - 1, true), 400);
    return () => clearTimeout(t);
  }, [jump]);

  useEffect(() => {
    if (!pinned) return;
    window.history.replaceState(null, "", `#step-${step + 1}`);
  }, [step, pinned]);

  // Keyboard: arrows, j/k, space
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pinned || e.metaKey || e.ctrlKey || e.altKey) return;
      if (["ArrowDown", "ArrowRight", "j", "PageDown"].includes(e.key)) {
        e.preventDefault();
        jump(step + 1);
      } else if (["ArrowUp", "ArrowLeft", "k", "PageUp"].includes(e.key)) {
        e.preventDefault();
        jump(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned, step, jump]);

  // Meeting playback: the heads' sync and the joint meeting with the CEO.
  const range = (id: "sync" | "joint") => {
    const idx = all.map((b, i) => (b.ctx.kind === "meeting" && b.ctx.id === id ? i : -1)).filter((i) => i >= 0);
    return [idx[0] ?? Infinity, idx[idx.length - 1] ?? -1] as const;
  };
  const phaseFor = (id: "sync" | "joint"): MeetingPhase => {
    const [a, b] = range(id);
    return step < a ? "before" : step > b ? "after" : "live";
  };
  const syncPhase = phaseFor("sync");
  const jointPhase = phaseFor("joint");
  const sync = useMeeting(SYNC_LINES, syncPhase, sound);
  const joint = useMeeting(MEETING_LINES, jointPhase, sound);

  const cur = all[step];
  const scene = useMemo(() => {
    const line = syncPhase === "live" ? SYNC_LINES[sync.index] : jointPhase === "live" ? MEETING_LINES[joint.index] : undefined;
    if (!line) return cur.scene;
    const agents = { ...cur.scene.agents };
    const a = agents[line.who];
    if (a) agents[line.who] = { ...a, bubble: { text: line.text, tone: TONE[line.who] ?? "default" } };
    return { ...cur.scene, agents };
  }, [cur, syncPhase, jointPhase, sync.index, joint.index]);

  const active = cur.ctx.kind === "meeting" && cur.ctx.id === "sync" ? { lines: SYNC_LINES, ...sync } : { lines: MEETING_LINES, ...joint };
  const meetingProps = { lines: active.lines, index: active.index, speaking: active.speaking, sound, toggle: () => setSound((v) => !v) };

  const ctxKey = useMemo(() => {
    let k = step;
    while (k > 0 && !STEPS[k].ctx) k--;
    return String(k);
  }, [step]);

  const chapterStart = CHAPTERS.map((_, c) => STEPS.findIndex((s) => s.ch === c));
  const st = cur.step;

  return (
    <section ref={ref} id="walkthrough" className="relative" style={{ height: `calc(100vh + ${total}vh)` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        {/* top bar */}
        <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-black/[0.06] bg-[rgba(247,246,243,0.85)] px-4 backdrop-blur md:px-5">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="hidden text-[18px] text-ink sm:inline" style={{ fontFamily: "var(--font-serif)" }}>
              FloorPlan
            </span>
          </Link>
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">Internal</span>
          <div className="hidden min-w-0 flex-1 truncate text-[13.5px] text-muted md:block">
            <span className="font-semibold text-ink">Bookwell</span> · Launch online booking in two weeks
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={st.time}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-full bg-white px-2.5 py-1 font-mono text-[12px] font-semibold text-ink ring-1 ring-black/[0.06]"
              >
                {st.time}
              </motion.span>
            </AnimatePresence>
            <span className="hidden font-mono text-[12px] text-muted sm:inline">
              {String(step + 1).padStart(2, "0")} / {N}
            </span>
            <button onClick={() => jump(step - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink ring-1 ring-black/[0.08] hover:bg-[#f2f0ec]" aria-label="Previous step">
              ↑
            </button>
            <button onClick={() => jump(step + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white hover:bg-black" aria-label="Next step">
              ↓
            </button>
          </div>
        </div>
        <div className="h-[2px] w-full shrink-0 bg-black/[0.05]">
          <motion.div className="h-full bg-accent" animate={{ width: `${((step + 1) / N) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 30 }} />
        </div>

        <div className="flex min-h-0 flex-1 gap-3 p-3 md:gap-4 md:p-4">
          {/* chapter rail */}
          <nav className="hidden w-[228px] shrink-0 flex-col gap-0.5 overflow-hidden xl:flex">
            {CHAPTERS.map((c, ci) => {
              const active = st.ch === ci;
              const steps = STEPS.map((s, i) => ({ s, i })).filter((x) => x.s.ch === ci);
              const done = st.ch > ci;
              return (
                <div key={c.n} className="relative">
                  {active && <motion.div layoutId="rail-bg" className="absolute inset-0 rounded-[14px] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]" transition={{ type: "spring", stiffness: 300, damping: 32 }} />}
                  <button onClick={() => jump(chapterStart[ci])} className="relative flex w-full items-center gap-2.5 px-3 py-2 text-left">
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10.5px] font-bold ${
                        active ? "bg-ink text-white" : done ? "bg-ok text-white" : "bg-black/[0.07] text-muted"
                      }`}
                    >
                      {done ? "✓" : ci + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-semibold ${active ? "text-ink" : "text-ink-2"}`}>{c.n}</span>
                      <span className="block text-[11px] text-faint">{c.sub}</span>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="relative overflow-hidden">
                        <div className="flex flex-col pb-2 pl-[38px] pr-2">
                          {steps.map(({ s, i }) => (
                            <button
                              key={i}
                              onClick={() => jump(i)}
                              className={`truncate rounded-[8px] px-2 py-1 text-left text-[12px] transition-colors ${i === step ? "bg-[#f6f5f2] font-semibold text-ink" : i < step ? "text-muted hover:text-ink" : "text-faint hover:text-ink"}`}
                            >
                              {s.title}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            <div className="mt-auto rounded-[12px] px-3 py-2 text-[11px] leading-snug text-faint">
              Scroll, use ↑ ↓ or j / k. Every step has a link: <span className="font-mono">#step-{step + 1}</span>
            </div>
          </nav>

          {/* centre */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
            <div className="relative min-h-0 flex-[1.45] overflow-hidden rounded-[24px] shadow-[0_2px_4px_rgba(10,10,10,0.04),0_30px_80px_-30px_rgba(10,10,10,0.3)] ring-1 ring-black/[0.06]">
              <Office scene={scene} />
              <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-semibold text-ink-2 shadow-sm backdrop-blur">
                <span className="text-faint">Chapter {st.ch + 1}</span> {CHAPTERS[st.ch].n}
              </div>
            </div>
            <div className="grid min-h-0 flex-1 gap-3 md:gap-4 lg:grid-cols-[1.15fr_1fr]">
              <Narration step={step} />
              <div className="hidden min-h-0 lg:block">
                <EventLog built={cur} index={step} />
              </div>
            </div>
          </div>

          {/* right */}
          <div className="hidden w-[372px] shrink-0 flex-col gap-3 md:flex md:gap-4">
            <div className="min-h-0 flex-[1.2]">
              <ContextPanel ctx={cur.ctx} ctxKey={ctxKey} meeting={meetingProps} />
            </div>
            <div className="min-h-0 flex-1">
              <MemoryPanel all={all} index={step} />
            </div>
          </div>
        </div>

        {/* phones: tabs */}
        <div className="flex h-[40%] shrink-0 flex-col gap-2 px-3 pb-3 md:hidden">
          <div className="flex gap-1 rounded-full bg-black/[0.05] p-1 text-[12.5px] font-semibold">
            {(["context", "memory", "events"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-full py-1.5 capitalize ${tab === t ? "bg-white text-ink shadow-sm" : "text-muted"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {tab === "context" && <ContextPanel ctx={cur.ctx} ctxKey={ctxKey} meeting={meetingProps} />}
            {tab === "memory" && <MemoryPanel all={all} index={step} />}
            {tab === "events" && <EventLog built={cur} index={step} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function Narration({ step }: { step: number }) {
  const st = STEPS[step];
  return (
    <div className="relative min-h-0 overflow-hidden rounded-[22px] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05]">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-full flex-col"
        >
          <div className="flex items-center gap-2 text-[11.5px] font-semibold text-faint">
            <span className="font-mono">{String(step + 1).padStart(2, "0")}</span>
            <span>·</span>
            <span>{st.time}</span>
          </div>
          <h2 className="mt-1 text-[clamp(19px,1.7vw,24px)] font-semibold leading-tight tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
            {st.title}
          </h2>
          <p className="mt-2 text-[14.5px] leading-[1.55] text-ink-2">{st.text}</p>
          {st.aside && (
            <div className="mt-3 flex gap-2 rounded-[12px] bg-[#fff4ec] p-2.5 text-[12.5px] leading-snug text-[#8a4a24] ring-1 ring-[#f3cfb6]">
              <span className="font-bold">What if?</span>
              <span>{st.aside}</span>
            </div>
          )}
          {st.spec && (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
              {st.spec.map((s) => (
                <span key={s} className="rounded-full bg-[#f6f5f2] px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-black/[0.05]">
                  Spec · {s}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

