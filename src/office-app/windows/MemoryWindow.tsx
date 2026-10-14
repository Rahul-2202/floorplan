"use client";

import { useState } from "react";
import { CAST } from "@/office/layout";
import { useSim } from "@/sim/store";
import type { MemItem } from "@/sim/types";
import { Btn, Empty, Face, Segmented, Window } from "../bits";
import { useUI } from "../ui";
import { nameOf } from "../who";

export function MemCard({ m, editable = true }: { m: MemItem; editable?: boolean }) {
  const { d } = useSim();
  const [edit, setEdit] = useState(false);
  const [body, setBody] = useState(m.body);
  const tone = m.status === "superseded" ? "opacity-55" : "";
  return (
    <div className={`rounded-[14px] bg-white p-3.5 ring-1 ring-black/[0.06] ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#f2f0ec] px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide text-muted">{m.type}</span>
            {m.status !== "active" && <span className={`rounded-full px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide ${m.status === "stale" ? "bg-[#fdf3e0] text-[#8a5a10]" : "bg-[#f0efed] text-muted"}`}>{m.status}</span>}
            {m.confidence && <span className="text-[11px] text-faint">confidence: {m.confidence}</span>}
          </div>
          <div className={`mt-1 text-[13.5px] font-semibold text-ink ${m.status === "superseded" ? "line-through decoration-black/30" : ""}`}>{m.title}</div>
        </div>
        <Face id={m.owner} size={22} />
      </div>
      {edit ? (
        <div className="mt-2">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="h-20 w-full rounded-[10px] bg-[#f6f5f2] p-2 text-[13px] outline-none ring-1 ring-black/[0.08]" />
          <div className="mt-1.5 flex gap-1.5">
            <Btn
              tone="dark"
              onClick={() => {
                d({ type: "memory", id: m.id, patch: { body, source: `Edited by you · ${m.source}` } });
                setEdit(false);
              }}
            >
              Save
            </Btn>
            <Btn onClick={() => setEdit(false)}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <div className="mt-1 text-[12.5px] leading-[1.5] text-ink-2">{m.body}</div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <span>
          {nameOf(m.owner)} · {m.source} · {m.date}
        </span>
        {editable && !edit && m.status === "active" && (
          <span className="flex gap-2">
            <button onClick={() => setEdit(true)} className="font-semibold text-ink hover:underline">
              Edit
            </button>
            <button onClick={() => d({ type: "memory", id: m.id, patch: { status: "stale" } })} className="font-semibold text-[#8a5a10] hover:underline">
              Flag stale
            </button>
          </span>
        )}
        {m.status === "stale" && (
          <button onClick={() => d({ type: "memory", id: m.id, patch: { status: "active", source: `Refreshed by ${nameOf(m.owner)}` } })} className="font-semibold text-ink hover:underline">
            Ask owner to refresh
          </button>
        )}
      </div>
    </div>
  );
}

export function MemoryWindow({ id }: { id: string }) {
  const { s } = useSim();
  const ui = useUI();
  const [tab, setTab] = useState<"own" | "reads">("own");
  const room = CAST[id]?.room === "marketing" ? "room:marketing" : "room:dev";
  const own = s.memory.filter((m) => m.layer === `agent:${id}`);
  const reads = s.memory.filter((m) => m.layer === room || m.layer === "company" || (m.layer === "ceo" && m.status === "active"));
  const groups: [string, MemItem[]][] = [
    ["Role card", own.filter((m) => m.type === "role")],
    ["Lessons", own.filter((m) => m.type === "lesson")],
    ["Scratchpad", own.filter((m) => m.type === "scratch" || m.type === "note")],
  ];
  return (
    <Window width={600} onClose={ui.closeWin} icon={<Face id={id} size={32} />} title={`${nameOf(id)}'s memory`} sub="Everything this agent remembers. You can edit any of it.">
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] bg-[#fbfaf8] px-4 py-2.5">
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { v: "own", l: "Own memory" },
            { v: "reads", l: "What it reads" },
          ]}
        />
        <span className="text-[11.5px] text-muted">Loads ~2.1k tokens per task: an index, then only what&apos;s relevant</span>
      </div>
      <div className="flex max-h-[min(520px,60vh)] flex-col gap-4 overflow-y-auto p-4">
        {tab === "own" ? (
          groups.map(([t, items]) => (
            <div key={t}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">{t}</div>
              {items.length ? (
                <div className="flex flex-col gap-2">
                  {items.map((m) => (
                    <MemCard key={m.id} m={m} />
                  ))}
                </div>
              ) : (
                <Empty>Nothing yet. {t === "Lessons" ? "Lessons are added as the agent learns from your corrections." : ""}</Empty>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-[12.5px] text-muted">Derived from room and company memory, plus your preferences filtered to this room. It reads the index first and pulls only what a task needs.</div>
            {reads.map((m) => (
              <MemCard key={m.id} m={m} editable={false} />
            ))}
          </div>
        )}
      </div>
    </Window>
  );
}
