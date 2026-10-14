"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { BrandIcon } from "@/components/brands";
import { approveOutput, requestChanges } from "@/sim/actions";
import { useSim } from "@/sim/store";
import type { Output } from "@/sim/types";
import { Btn, Face, Window } from "../bits";
import { useUI } from "../ui";
import { nameOf, ROOM_LABEL } from "../who";

export const KIND_LABEL: Record<Output["kind"], string> = {
  pr: "Pull request",
  ticket: "Ticket closed",
  post: "Social drafts",
  video: "Video draft",
  report: "Report",
  design: "Design",
  blog: "Writing",
  deploy: "Deploy",
};

const STATUS: Record<Output["status"], { l: string; c: string }> = {
  review: { l: "Needs your review", c: "bg-[#fdecea] text-[#9b2c24]" },
  approved: { l: "Approved", c: "bg-[#eaf6ee] text-[#24603a]" },
  merged: { l: "Merged", c: "bg-[#f1eefd] text-[#4a3fa8]" },
  closed: { l: "Closed", c: "bg-[#e8eefb] text-[#2c56b0]" },
  changes: { l: "Changes requested", c: "bg-[#fdf3e0] text-[#8a5a10]" },
  shipped: { l: "Shipped", c: "bg-[#eaf6ee] text-[#24603a]" },
};

export function StatusTag({ o }: { o: Output }) {
  return <span className={`rounded-full px-2 py-[2px] text-[11px] font-bold ${STATUS[o.status].c}`}>{STATUS[o.status].l}</span>;
}

const CAPTIONS = ["Booking a physio appointment shouldn't take three phone calls.", "Meridian Physio · bookings in under a minute.", "Patients pick a time. You get your front desk back.", "Bookwell. Online booking for clinics, live Friday."];

function VideoPlayer() {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((v) => (v >= 45 ? (setPlaying(false), 0) : v + 0.5)), 100);
    return () => clearInterval(id);
  }, [playing]);
  const cap = CAPTIONS[Math.min(CAPTIONS.length - 1, Math.floor(t / 11.5))];
  return (
    <div className="mx-auto w-[280px]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-[linear-gradient(160deg,#2b2f3a,#16151a)]">
        <motion.div animate={playing ? { y: [0, -6, 0], rotate: [-2, 2, -2] } : {}} transition={{ repeat: Infinity, duration: 3 }} className="absolute left-1/2 top-[18%] h-[52%] w-[42%] -translate-x-1/2 rounded-[18px] border-4 border-[#0a0a0a] bg-[#f7f6f3] shadow-2xl">
          <div className="mx-auto mt-2 h-1.5 w-8 rounded-full bg-black/20" />
          <div className="mx-2 mt-3 rounded-[6px] bg-[#e8743b] px-1.5 py-1 text-[8px] font-bold text-white">Meridian Physio</div>
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i} animate={playing && i === Math.floor(t / 4) % 4 ? { backgroundColor: "#0a0a0a" } : { backgroundColor: "#e9e6df" }} className="mx-2 mt-1.5 h-4 rounded-[5px]" />
          ))}
        </motion.div>
        <div className="absolute inset-x-3 bottom-4 rounded-[10px] bg-black/60 px-2.5 py-1.5 text-center text-[12px] font-semibold text-white">{cap}</div>
        {!playing && (
          <button onClick={() => setPlaying(true)} className="absolute inset-0 grid place-items-center bg-black/20">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-[20px] text-ink shadow-xl">▶</span>
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11.5px] text-muted">
        <span>0:{String(Math.floor(t)).padStart(2, "0")}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
          <div className="h-full bg-ink" style={{ width: `${(t / 45) * 100}%` }} />
        </div>
        <span>0:45</span>
      </div>
    </div>
  );
}

function Preview({ o }: { o: Output }) {
  if (o.kind === "pr")
    return (
      <div className="overflow-hidden rounded-[14px] bg-[#16151a] p-3 font-mono text-[12px] leading-[1.8]">
        {(o.body ?? []).map((l, i) => (
          <div key={i} className={l.startsWith("+") ? "rounded bg-[#1f3a2a] pl-2 text-[#8ff0b0]" : l.startsWith("-") ? "rounded bg-[#40211f] pl-2 text-[#ff9c94]" : "pl-2 text-white/60"}>
            {l}
          </div>
        ))}
        {!o.body && <div className="text-white/50">Diff collapsed · {o.summary}</div>}
      </div>
    );
  if (o.kind === "post")
    return (
      <div className="flex flex-col gap-2.5">
        {(o.body ?? []).map((p, i) => (
          <div key={i} className="rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.08]">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[12px] font-bold text-white">B</span>
              <div className="leading-tight">
                <div className="text-[13px] font-semibold text-ink">Bookwell</div>
                <div className="text-[11px] text-muted">Draft {i + 1} · scheduled Fri 09:00</div>
              </div>
              <span className="ml-auto">
                <BrandIcon name="LinkedIn" size={16} />
              </span>
            </div>
            <div className="mt-2 text-[13.5px] leading-[1.5] text-ink-2">{p.replace(/^\d · /, "")}</div>
          </div>
        ))}
      </div>
    );
  if (o.kind === "video") return <VideoPlayer />;
  if (o.kind === "report") {
    const rows = (o.body ?? []).map((r) => r.split("|"));
    return rows.length ? (
      <div className="overflow-hidden rounded-[14px] ring-1 ring-black/[0.08]">
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#f6f5f2] px-3 py-2 text-[12px] font-semibold text-ink-2">
          <BrandIcon name="Google Sheets" size={14} /> {o.title}
        </div>
        <table className="w-full text-left text-[12.5px]">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i === 0 ? "bg-[#fbfaf8] font-semibold text-muted" : "border-t border-black/[0.05] text-ink-2"}>
                {r.map((c, j) => (
                  <td key={j} className="px-3 py-2">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-2">
        {(o.meta ?? []).map(([k, v]) => (
          <div key={k} className="rounded-[12px] bg-[#f6f5f2] p-3">
            <div className="text-[11px] text-muted">{k}</div>
            <div className="text-[16px] font-semibold text-ink">{v}</div>
          </div>
        ))}
      </div>
    );
  }
  if (o.kind === "blog")
    return (
      <article className="rounded-[14px] bg-white p-5 ring-1 ring-black/[0.08]">
        <h3 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-ink" style={{ fontFamily: "var(--font-display)" }}>
          {o.title.split("·").pop()}
        </h3>
        <div className="mt-1 text-[12px] text-muted">by {nameOf(o.by)} · {o.at}</div>
        <div className="mt-3 flex flex-col gap-2.5 text-[14px] leading-[1.65] text-ink-2" style={{ fontFamily: "var(--font-serif)" }}>
          {(o.body ?? [o.summary]).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
    );
  if (o.kind === "design")
    return (
      <div className="rounded-[14px] bg-[#2c2c2c] p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-white/60">
          <BrandIcon name="Figma" size={12} /> Launch banner · Frame 1440
        </div>
        <div className="rounded-[10px] bg-white p-3">
          <div className="flex items-center justify-between rounded-[8px] bg-[#0a0a0a] px-3 py-2.5 text-[12px] font-semibold text-white">
            Book your next visit online, in under a minute. <span className="rounded-full bg-[#e8743b] px-2 py-0.5 text-[11px]">Book now</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-[6px] bg-[#f2f0ec]" />
            ))}
          </div>
        </div>
      </div>
    );
  if (o.kind === "deploy")
    return (
      <div className="rounded-[14px] bg-[#16151a] p-3 font-mono text-[12px] leading-[1.8] text-white/70">
        <div>▲ Vercel · staging.bookwell.app</div>
        <div className="text-[#6fe39a]">✓ Build completed in 38s</div>
        <div className="text-[#6fe39a]">✓ 0 errors since deploy</div>
        <div>→ Assigned to staging.bookwell.app</div>
      </div>
    );
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.08]">
      <BrandIcon name="Linear" size={20} />
      <div>
        <div className="text-[13.5px] font-semibold text-ink">{o.title}</div>
        <div className="text-[12px] text-muted">{o.summary}</div>
      </div>
    </div>
  );
}

export function OutputWindow({ id }: { id: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const o = s.outputs.find((x) => x.id === id);
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (o && !o.viewed) d({ type: "output", id: o.id, patch: { viewed: true } });
  }, [o, d]);
  if (!o) return null;
  const reviewable = o.status === "review";
  return (
    <Window
      width={620}
      onClose={ui.closeWin}
      icon={<Face id={o.by} size={32} />}
      title={o.title}
      sub={`${KIND_LABEL[o.kind]} · ${nameOf(o.by)} · ${ROOM_LABEL[o.room]} · ${o.at}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] px-4 py-3">
          <StatusTag o={o} />
          {reviewable ? (
            asking ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  requestChanges(s, d, o.id, note || "See comments");
                  ui.closeWin();
                }}
              >
                <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should change?" className="h-9 flex-1 rounded-full bg-[#f6f5f2] px-3.5 text-[13px] outline-none ring-1 ring-black/[0.06]" />
                <Btn tone="dark">Send to {nameOf(o.by)}</Btn>
              </form>
            ) : (
              <div className="flex gap-2">
                <Btn onClick={() => setAsking(true)}>Request changes</Btn>
                <Btn
                  tone="dark"
                  onClick={() => {
                    approveOutput(s, d, o.id);
                    ui.closeWin();
                  }}
                >
                  {o.kind === "pr" ? "Approve and merge" : "Approve"}
                </Btn>
              </div>
            )
          ) : (
            <Btn onClick={() => ui.openWin({ kind: "chat", id: o.by, mode: "queue" })}>Message {nameOf(o.by)}</Btn>
          )}
        </div>
      }
    >
      <div className="flex max-h-[min(560px,62vh)] flex-col gap-3 overflow-y-auto p-4">
        <div className="text-[13.5px] leading-[1.5] text-ink-2">{o.summary}</div>
        {o.meta && o.kind !== "report" && (
          <div className="flex flex-wrap gap-1.5">
            {o.meta.map(([k, v]) => (
              <span key={k} className="rounded-full bg-[#f6f5f2] px-2.5 py-1 text-[12px] text-ink-2">
                <span className="text-muted">{k}: </span>
                {v}
              </span>
            ))}
          </div>
        )}
        <Preview o={o} />
      </div>
    </Window>
  );
}
