"use client";

import { useState } from "react";
import { useSim } from "@/sim/store";
import type { MemItem } from "@/sim/types";
import { Empty, Segmented } from "../bits";
import { MemCard } from "../windows/MemoryWindow";

type Tab = "company" | "ceo" | "decisions" | "rooms" | "agents";

export function MemoryPanel({ initial }: { initial?: string }) {
  const { s } = useSim();
  const target = s.memory.find((m) => m.id === initial);
  const [tab, setTab] = useState<Tab>(target ? (target.layer.startsWith("agent") ? "agents" : target.layer.startsWith("room") ? "rooms" : target.layer === "ceo" ? "ceo" : "company") : ((initial as Tab) ?? "company"));
  const [q, setQ] = useState("");
  const match = (m: MemItem) => !q || (m.title + m.body + m.source).toLowerCase().includes(q.toLowerCase());
  const pick: Record<Tab, (m: MemItem) => boolean> = {
    company: (m) => m.layer === "company",
    ceo: (m) => m.layer === "ceo",
    decisions: (m) => m.type === "decision",
    rooms: (m) => m.layer.startsWith("room:"),
    agents: (m) => m.layer.startsWith("agent:"),
  };
  const list = s.memory.filter((m) => pick[tab](m) && match(m));
  const counts = { active: s.memory.filter((m) => m.status === "active").length, superseded: s.memory.filter((m) => m.status === "superseded").length, stale: s.memory.filter((m) => m.status === "stale").length };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="rounded-[14px] bg-white px-3 py-2 ring-1 ring-black/[0.05]">
            <div className="text-[11px] font-semibold capitalize text-muted">{k}</div>
            <div className="text-[20px] font-semibold text-ink">{v}</div>
          </div>
        ))}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything the company remembers…" className="h-10 rounded-full bg-white px-4 text-[13px] outline-none ring-1 ring-black/[0.08] focus:ring-black/20" />
      <div className="overflow-x-auto">
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { v: "company", l: "Company" },
            { v: "ceo", l: "Your preferences" },
            { v: "decisions", l: "Decision log" },
            { v: "rooms", l: "Rooms" },
            { v: "agents", l: "Agents" },
          ]}
        />
      </div>
      <div className="text-[12px] text-muted">
        {tab === "ceo"
          ? "What Ada has learned about how you decide. Heads see only what's relevant to their room."
          : tab === "decisions"
            ? "Every decision links to the meeting or message it came from. Old ones are superseded, never deleted."
            : "Memory distills up from conversations and is derived down to rooms and agents. You can edit anything."}
      </div>
      {list.length ? (
        <div className="flex flex-col gap-2">
          {list.map((m) => (
            <div key={m.id} className={m.id === initial ? "rounded-[16px] ring-2 ring-accent" : ""}>
              <MemCard m={m} />
            </div>
          ))}
        </div>
      ) : (
        <Empty>Nothing matches.</Empty>
      )}
    </div>
  );
}
