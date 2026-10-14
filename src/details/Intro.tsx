"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { LogoMark } from "@/components/Logo";
import { CHAPTERS } from "./script";

export function Intro() {
  return (
    <section className="relative flex min-h-[86svh] flex-col px-5 md:px-8">
      <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[22px] text-ink" style={{ fontFamily: "var(--font-serif)" }}>
            FloorPlan
          </span>
        </Link>
        <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Internal · not linked</span>
      </div>
      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col justify-center py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <div className="text-[13px] font-semibold text-accent">Product walkthrough</div>
          <h1 className="display mt-3 max-w-[900px] text-[clamp(38px,5.6vw,72px)] text-ink">
            One company, end to end.
            <br />
            <span className="text-second">Every flow, as it happens.</span>
          </h1>
          <p className="mt-5 max-w-[640px] text-[17px] leading-[1.6] text-muted">
            Bookwell, a two-person startup selling booking software to physio clinics, wants online booking live in two weeks. Follow the CEO from an
            empty office to launch day: what Ada sets up, how agents talk, how a decision is made, and what memory keeps along the way.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        >
          {CHAPTERS.map((c, i) => (
            <a key={c.n} href="#walkthrough" className="group rounded-[16px] bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.05] transition-transform hover:-translate-y-0.5">
              <div className="font-mono text-[11px] font-semibold text-faint">
                {String(i + 1).padStart(2, "0")} · {c.sub}
              </div>
              <div className="mt-1 text-[15px] font-semibold text-ink">{c.n}</div>
            </a>
          ))}
        </motion.div>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-[13px] text-muted">
          <a href="#walkthrough" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Start the walkthrough ↓
          </a>
          <span>Scroll, or use ↑ ↓ and j / k. Each step has a shareable link.</span>
          <a href="#ref-org" className="font-semibold text-ink underline decoration-black/20 underline-offset-4">
            Jump to the reference
          </a>
        </div>
      </div>
    </section>
  );
}
