"use client";

import { useEffect, useRef, useState } from "react";
import { CAST } from "@/office/layout";
import { PERM_LABEL } from "@/sim/data/agents";
import { NORMS } from "@/sim/data/rooms";
import { isCeo } from "@/sim/people";
import { useSim } from "@/sim/store";
import type { Pending, PermKey, PermLevel, RoomKey } from "@/sim/types";
import { Bar, Btn, Face, Section, Toggle } from "../bits";
import { useUI } from "../ui";
import { ReadBack } from "../windows/ReadBack";
import { nameOf } from "../who";

const NEXT: Record<PermLevel, PermLevel> = { no: "approval", approval: "yes", yes: "no" };
const CELL: Record<PermLevel, { l: string; c: string }> = {
  yes: { l: "Free", c: "bg-[#eaf6ee] text-[#24603a]" },
  approval: { l: "Ask", c: "bg-[#fdf3e0] text-[#8a5a10]" },
  no: { l: "—", c: "bg-[#f6f5f2] text-faint" },
};
const PERMS: PermKey[] = ["openPRs", "mergeMain", "closeTickets", "postPublic", "deploy", "spend", "emailCustomers"];
const SHORT: Record<PermKey, string> = { openPRs: "PRs", mergeMain: "Merge", closeTickets: "Close", postPublic: "Post", deploy: "Deploy", spend: "Spend", emailCustomers: "Email" };

export function GovernancePanel({ initial }: { initial?: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const [pending, setPending] = useState<Pending | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initial) return;
    const t = setTimeout(() => root.current?.querySelector(`[data-anchor="${initial}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    return () => clearTimeout(t);
  }, [initial]);

  const agents = ["pm", "fe", "be", "ops", "qa", "strat", "cr1", "cr2", "editor", ...s.hires.map((h) => h.id)].filter((id) => s.configs[id]);
  const lock = (id: string) => s.locked.find((l) => l.id === id)?.locked;

  const cyclePerm = (id: string, k: PermKey) => {
    if ((k === "postPublic" && lock("lock-public")) || (k === "mergeMain" && lock("lock-merge"))) return;
    const cur = s.configs[id].permissions[k];
    const nxt = NEXT[cur];
    setPending({
      id: `perm-${id}-${k}-${s.clock}`,
      summary: `${nameOf(id)}: ${PERM_LABEL[k].toLowerCase()} → ${CELL[nxt].l.toLowerCase()}`,
      items: [`${nameOf(id)} — ${PERM_LABEL[k]}: ${cur === "yes" ? "free" : cur === "approval" ? "asks you" : "never"} → ${nxt === "yes" ? "free" : nxt === "approval" ? "asks you" : "never"}`, nxt === "yes" ? "The first use still pauses and asks you" : "Takes effect at the agent's next step"],
      apply: { configs: { [id]: { permissions: { ...s.configs[id].permissions, [k]: nxt } } } },
    });
  };

  const editable = isCeo(s);
  return (
    <div ref={root} className="relative flex flex-col gap-6">
      {!editable && (
        <div className="-mb-2 flex items-center justify-between gap-3 rounded-[16px] bg-[#eef2fc] px-3.5 py-3 text-[12.5px] text-[#21409a]">
          <span>View only. Company rules are set by the CEO and Ada. Your room&apos;s own spec and rules are yours to edit.</span>
          {s.people[s.me]?.room && (s.people[s.me].room === "dev" || s.people[s.me].room === "marketing") && (
            <button onClick={() => ui.openWin({ kind: "room", id: s.people[s.me].room as "dev" | "marketing", tab: "rules" })} className="shrink-0 rounded-full bg-[#2b4fb8] px-3 py-1 text-[12px] font-semibold text-white">
              My room&apos;s rules
            </button>
          )}
        </div>
      )}
      <fieldset disabled={!editable} className="contents">
      <div data-anchor="permissions">
        <Section title="Permissions · click a cell to change it">
          <div className="overflow-x-auto rounded-[16px] bg-white ring-1 ring-black/[0.06]">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-faint">
                  <th className="px-2 py-2 text-left font-semibold">Agent</th>
                  {PERMS.map((p) => (
                    <th key={p} className="px-1 py-2 font-semibold" title={PERM_LABEL[p]}>
                      {SHORT[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((id) => (
                  <tr key={id} className="border-t border-black/[0.05]">
                    <td className="px-2 py-1.5">
                      <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold text-ink">
                        <Face id={id} size={18} /> {CAST[id]?.name}
                      </span>
                    </td>
                    {PERMS.map((p) => {
                      const v = s.configs[id].permissions[p];
                      const locked = (p === "postPublic" && lock("lock-public") && v !== "no") || (p === "mergeMain" && lock("lock-merge") && v !== "no");
                      return (
                        <td key={p} className="px-0.5 py-1 text-center">
                          <button onClick={() => cyclePerm(id, p)} className={`w-full rounded-[6px] px-1 py-1 font-semibold ${locked ? "bg-ink text-white" : CELL[v].c}`} title={locked ? "Locked by you: always asks" : PERM_LABEL[p]}>
                            {locked ? "🔒" : CELL[v].l}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[11.5px] text-muted">Free · Ask (needs your approval) · — (never). The first use of any powerful permission always pauses and asks you.</div>
        </Section>
      </div>

      <div data-anchor="locked">
        <Section title="Locked rules · only you can change these">
          <div className="flex flex-col gap-2">
            {s.locked.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]">
                <span className={`grid h-8 w-8 place-items-center rounded-[10px] text-[14px] ${l.locked ? "bg-ink text-white" : "bg-[#f2f0ec] text-muted"}`}>{l.locked ? "🔒" : "🔓"}</span>
                <span className="flex-1 text-[13px] font-semibold text-ink">{l.text}</span>
                <Toggle
                  on={l.locked}
                  onChange={(v) =>
                    setPending({
                      id: `lock-${l.id}-${s.clock}`,
                      summary: `${v ? "Lock" : "Unlock"}: ${l.text}`,
                      items: [v ? `Locked: ${l.text}` : `Unlocked: ${l.text}`, v ? "Ada can never change this from chat" : "Ada and room settings can change this again"],
                      apply: { locked: s.locked.map((x) => (x.id === l.id ? { ...x, locked: v } : x)) },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div data-anchor="approvals">
        <Section title="Approval gates">
          <div className="flex flex-col gap-2">
            {(["dev", "marketing"] as RoomKey[]).map((r) => (
              <button key={r} onClick={() => ui.openWin({ kind: "room", id: r, tab: "rules" })} className="flex items-center justify-between rounded-[14px] bg-white p-3 text-left ring-1 ring-black/[0.06] hover:ring-black/15">
                <span>
                  <span className="block text-[13px] font-semibold text-ink">{s.rooms[r].name}</span>
                  <span className="block text-[12px] text-muted">
                    {lock("lock-public") || s.rooms[r].publishing === "drafts" ? "Drafts to you" : "Publishes directly"} · {lock("lock-merge") || s.rooms[r].merge === "approval" ? "you approve merges" : "head approves merges"}
                  </span>
                </span>
                <span className="text-[12px] font-semibold text-ink">Edit →</span>
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div data-anchor="budgets">
        <Section title="Budgets">
          <div className="flex flex-col gap-2">
            {(["dev", "marketing"] as RoomKey[]).map((r) => {
              const c = s.rooms[r];
              return (
                <div key={r} className="rounded-[14px] bg-white p-3 ring-1 ring-black/[0.06]">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-ink">{c.name}</span>
                    <span className="text-muted">
                      ${c.spent} of ${c.budget} · ${c.convBudget} per conversation
                    </span>
                  </div>
                  <div className="mt-2">
                    <Bar value={(c.spent / c.budget) * 100} color={c.spent / c.budget > 0.8 ? "#d99a2b" : "#0a0a0a"} />
                  </div>
                </div>
              );
            })}
            <div className="text-[11.5px] text-muted">Change budgets in each room&apos;s rules, or tell Ada: “Raise marketing&apos;s budget to $200”.</div>
          </div>
        </Section>
      </div>

      <div data-anchor="blocked">
        <Section title="When blocked">
          <div className="grid grid-cols-2 gap-2">
            {(["dev", "marketing"] as RoomKey[]).map((r) => (
              <button key={r} onClick={() => ui.openWin({ kind: "room", id: r, tab: "rules" })} className="rounded-[14px] bg-white p-3 text-left ring-1 ring-black/[0.06]">
                <div className="text-[13px] font-semibold text-ink">{s.rooms[r].name}</div>
                <div className="text-[12px] text-muted">{{ park: "Park and switch", guess: "Best guess, flag it", wait: "Stop and wait" }[s.rooms[r].whenBlocked]}</div>
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div data-anchor="norms">
        <Section title="Communication norms (defaults)">
          <div className="flex flex-col gap-1.5">
            {NORMS.map((n, i) => (
              <div key={n.t} className="flex gap-2.5 rounded-[12px] bg-white p-2.5 ring-1 ring-black/[0.05]">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-[10.5px] font-bold text-white">{i + 1}</span>
                <div>
                  <div className="text-[12.5px] font-semibold text-ink">{n.t}</div>
                  <div className="text-[11.5px] text-muted">{n.d}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div data-anchor="versions">
        <Section title="Version history">
          <div className="flex flex-col gap-1.5">
            {s.versions.map((v, i) => (
              <div key={v.v} className="flex items-center gap-2.5 rounded-[12px] bg-white p-2.5 ring-1 ring-black/[0.05]">
                <span className="rounded-[6px] bg-[#f6f5f2] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-2">v{v.v}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{v.summary}</span>
                  <span className="block text-[11px] text-muted">
                    {v.who} · {v.at}
                  </span>
                </span>
                {i === 0 ? (
                  <span className="rounded-full bg-[#eaf6ee] px-2 py-0.5 text-[10.5px] font-bold text-[#24603a]">Current</span>
                ) : (
                  <Btn className="!py-1 !text-[11.5px]" onClick={() => d({ type: "rollback", v: v.v })}>
                    Roll back
                  </Btn>
                )}
              </div>
            ))}
          </div>
        </Section>
      </div>
      </fieldset>

      <div className="pointer-events-none fixed inset-0 z-[70] [&>*]:pointer-events-auto">
        <ReadBack pending={pending} onClose={() => setPending(null)} />
      </div>
    </div>
  );
}
