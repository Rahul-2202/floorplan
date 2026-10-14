"use client";

import { useState } from "react";
import { answerQuestion } from "@/sim/actions";
import { useSim } from "@/sim/store";
import type { RoomKey, Task, TaskState } from "@/sim/types";
import { Bar, Btn, Face, Section, Segmented, StateChip } from "../bits";
import { useUI } from "../ui";
import { nameOf } from "../who";

function TaskRow({ t }: { t: Task }) {
  const { s, d } = useSim();
  const ui = useUI();
  return (
    <div className="rounded-[16px] bg-white p-3 ring-1 ring-black/[0.06]">
      <button onClick={() => ui.openWin({ kind: "task", id: t.id })} className="flex w-full items-start gap-2.5 text-left">
        <Face id={t.owner} size={30} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10.5px] text-faint">{t.key}</span>
            {t.priority === "P1" && <span className="rounded bg-[#fdecea] px-1 text-[9.5px] font-bold text-[#9b2c24]">P1</span>}
            <span className="ml-auto">
              <StateChip state={t.state} />
            </span>
          </div>
          <div className="mt-0.5 text-[13.5px] font-semibold leading-snug text-ink">{t.title}</div>
          <div className="mt-0.5 text-[12px] text-muted">
            {nameOf(t.owner)} · {t.step ?? `due ${t.due}`}
          </div>
          {t.state !== "done" && t.state !== "queued" && (
            <div className="mt-2">
              <Bar value={t.progress} color={t.state === "question" || t.state === "blocked" ? "#d99a2b" : t.state === "review" ? "#7b6cd9" : "#3f9b5f"} />
            </div>
          )}
        </div>
      </button>
      {t.question && (
        <div className="mt-2.5 rounded-[12px] bg-[#fdecea]/60 p-2.5">
          <div className="text-[12.5px] font-semibold text-ink">{t.question.text}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {t.question.options.map((o, i) => (
              <Btn key={o} tone={i === 0 ? "dark" : "light"} className="!py-1 !text-[12px]" onClick={() => answerQuestion(s, d, t.id, o)}>
                {o}
              </Btn>
            ))}
          </div>
        </div>
      )}
      {t.state === "review" && t.outputs?.length ? (
        <div className="mt-2.5 flex justify-end">
          <Btn tone="dark" className="!py-1 !text-[12px]" onClick={() => ui.openWin({ kind: "output", id: t.outputs![t.outputs!.length - 1] })}>
            Review output
          </Btn>
        </div>
      ) : null}
    </div>
  );
}

const GROUPS: { k: string; l: string; states: TaskState[] }[] = [
  { k: "q", l: "Questions for you", states: ["question"] },
  { k: "b", l: "Blockers", states: ["blocked"] },
  { k: "r", l: "Waiting for your review", states: ["review"] },
  { k: "o", l: "Ongoing", states: ["ongoing"] },
  { k: "u", l: "Queued", states: ["queued"] },
  { k: "d", l: "Completed", states: ["done"] },
];

export function DashboardPanel() {
  const { s } = useSim();
  const [room, setRoom] = useState<"all" | RoomKey>("all");
  const tasks = s.tasks.filter((t) => room === "all" || t.room === room);
  const count = (st: TaskState[]) => tasks.filter((t) => st.includes(t.state)).length;
  const stats = [
    { l: "Ongoing", v: count(["ongoing"]), c: "#3f9b5f" },
    { l: "Blocked", v: count(["blocked", "question"]), c: "#d99a2b" },
    { l: "In review", v: count(["review"]), c: "#7b6cd9" },
    { l: "Completed", v: count(["done"]), c: "#3b7be8" },
  ];
  return (
    <div className="flex flex-col gap-5">
      <Segmented
        value={room}
        onChange={setRoom}
        options={[
          { v: "all", l: "All rooms" },
          { v: "dev", l: "Development" },
          { v: "marketing", l: "Marketing" },
        ]}
      />
      <div className="grid grid-cols-4 gap-2">
        {stats.map((x) => (
          <div key={x.l} className="rounded-[14px] bg-white px-3 py-2.5 ring-1 ring-black/[0.05]">
            <div className="text-[11px] font-semibold text-muted">{x.l}</div>
            <div className="text-[22px] font-semibold tracking-[-0.02em]" style={{ color: x.c, fontFamily: "var(--font-display)" }}>
              {x.v}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["dev", "marketing"] as RoomKey[])
          .filter((r) => room === "all" || r === room)
          .map((r) => {
            const cfg = s.rooms[r];
            return (
              <div key={r} className="rounded-[14px] bg-white p-3 ring-1 ring-black/[0.05]">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-ink">{cfg.name} spend</span>
                  <span className="text-muted">
                    ${cfg.spent} / ${cfg.budget}
                  </span>
                </div>
                <div className="mt-2">
                  <Bar value={(cfg.spent / cfg.budget) * 100} color={cfg.spent / cfg.budget > 0.8 ? "#d99a2b" : "#0a0a0a"} />
                </div>
              </div>
            );
          })}
      </div>
      {GROUPS.map((g) => {
        const items = tasks.filter((t) => g.states.includes(t.state));
        if (!items.length) return null;
        return (
          <Section key={g.k} title={`${g.l} · ${items.length}`}>
            <div className="flex flex-col gap-2">
              {items.map((t) => (
                <TaskRow key={t.id} t={t} />
              ))}
            </div>
          </Section>
        );
      })}
    </div>
  );
}
