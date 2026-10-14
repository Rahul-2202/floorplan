"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BrandIcon } from "@/components/brands";
import { PERM_LABEL, TOOL_OPTIONS } from "@/sim/data/agents";
import { useSim } from "@/sim/store";
import type { AgentConfig, PermKey, PermLevel, WhenBlocked } from "@/sim/types";
import { Btn, Face, Segmented, Window } from "../bits";
import { useUI } from "../ui";
import { nameOf, roleOf } from "../who";

const LEVEL: Record<PermLevel, string> = { yes: "Free", approval: "Ask you", no: "Never" };
const BLOCKED: Record<WhenBlocked, string> = { park: "Park and switch", guess: "Best guess, flag it", wait: "Stop and wait" };
const AUTONOMY = ["Asks about everything", "Asks often", "Balanced", "Acts on the usual", "Acts on what you always approve"];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-black/[0.05] py-3 last:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{label}</div>
        {hint && <div className="text-[11.5px] text-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function diffConfig(a: AgentConfig, b: AgentConfig, who: string) {
  const out: string[] = [];
  if (a.runtime !== b.runtime) out.push(`${who} runs on ${b.runtime} instead of ${a.runtime}`);
  if (a.model !== b.model) out.push(`Model: ${a.model} → ${b.model}`);
  const addT = b.tools.filter((t) => !a.tools.includes(t));
  const remT = a.tools.filter((t) => !b.tools.includes(t));
  if (addT.length) out.push(`${who} can use ${addT.join(", ")}`);
  if (remT.length) out.push(`${who} loses access to ${remT.join(", ")}`);
  (Object.keys(b.permissions) as PermKey[]).forEach((k) => {
    if (a.permissions[k] !== b.permissions[k]) out.push(`${PERM_LABEL[k]}: ${LEVEL[a.permissions[k]].toLowerCase()} → ${LEVEL[b.permissions[k]].toLowerCase()}`);
  });
  if (a.budget !== b.budget) out.push(`Weekly budget: $${a.budget} → $${b.budget}`);
  if (a.whenBlocked !== b.whenBlocked) out.push(`When blocked: ${BLOCKED[b.whenBlocked].toLowerCase()}`);
  if (a.autonomy !== b.autonomy) out.push(`Escalation: ${AUTONOMY[b.autonomy - 1].toLowerCase()}`);
  if (a.roleCard !== b.roleCard) out.push("Role card updated");
  return out;
}

export function ConfigWindow({ id }: { id: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const base = s.configs[id];
  const [c, setC] = useState<AgentConfig>(base);
  const [review, setReview] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const lockPublic = s.locked.find((l) => l.id === "lock-public")?.locked;
  const lockMerge = s.locked.find((l) => l.id === "lock-merge")?.locked;
  const changes = diffConfig(base, c, nameOf(id));

  const lockedPerm = (k: PermKey) => (k === "postPublic" && lockPublic) || (k === "mergeMain" && lockMerge);

  return (
    <Window
      width={620}
      onClose={ui.closeWin}
      icon={<Face id={id} size={32} />}
      title={`${nameOf(id)} · configuration`}
      sub={`${roleOf(id)} · changes are read back, then saved as a new version`}
      footer={
        <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-4 py-3">
          <span className="text-[12px] text-muted">{changes.length ? `${changes.length} change${changes.length > 1 ? "s" : ""}` : "No changes yet"}</span>
          <div className="flex gap-2">
            <Btn onClick={() => setC(base)} disabled={!changes.length}>
              Reset
            </Btn>
            <Btn tone="dark" disabled={!changes.length} onClick={() => setReview(true)}>
              Review changes
            </Btn>
          </div>
        </div>
      }
    >
      <div className="relative">
        <div className="max-h-[min(540px,62vh)] overflow-y-auto px-4 pb-2">
          <Row label="Role card" hint="What the agent reads first, every session">
            <textarea value={c.roleCard} onChange={(e) => setC({ ...c, roleCard: e.target.value })} className="h-20 w-[300px] rounded-[12px] bg-[#f6f5f2] p-2.5 text-[12.5px] outline-none ring-1 ring-black/[0.06]" />
          </Row>
          <Row label="Runtime" hint="The engine behind this agent">
            <Segmented
              value={c.runtime}
              onChange={(v) => setC({ ...c, runtime: v, model: v === "Codex" ? "GPT-5 Codex" : "Sonnet 5.5" })}
              options={[
                { v: "Claude Code", l: "Claude Code" },
                { v: "Codex", l: "Codex" },
              ]}
            />
          </Row>
          <Row label="Model">
            <select value={c.model} onChange={(e) => setC({ ...c, model: e.target.value })} className="rounded-full bg-[#f2f0ec] px-3 py-1.5 text-[12.5px] font-semibold outline-none">
              {(c.runtime === "Codex" ? ["GPT-5 Codex", "GPT-5"] : ["Opus 5.5", "Sonnet 5.5", "Haiku 5.5"]).map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Row>
          <div className="border-b border-black/[0.05] py-3">
            <div className="text-[13px] font-semibold text-ink">Tools</div>
            <div className="text-[11.5px] text-muted">Integrations this agent can use</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TOOL_OPTIONS.map((t) => {
                const on = c.tools.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => setC({ ...c, tools: on ? c.tools.filter((x) => x !== t) : [...c.tools, t] })}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 transition-colors ${on ? "bg-ink text-white ring-ink" : "bg-white text-ink-2 ring-black/[0.1] hover:bg-[#f6f5f2]"}`}
                  >
                    <BrandIcon name={t} size={12} mono={on} />
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-b border-black/[0.05] py-3">
            <div className="text-[13px] font-semibold text-ink">Permissions</div>
            <div className="text-[11.5px] text-muted">The first use of a powerful permission always asks you</div>
            <div className="mt-1">
              {(Object.keys(PERM_LABEL) as PermKey[]).map((k) => (
                <div key={k} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
                    {PERM_LABEL[k]}
                    {lockedPerm(k) && <span className="rounded-full bg-ink px-1.5 py-[1px] text-[10px] font-bold text-white">🔒 locked by you</span>}
                  </span>
                  {lockedPerm(k) ? (
                    <span className="text-[12px] font-semibold text-muted">Always asks you</span>
                  ) : (
                    <Segmented
                      size="sm"
                      value={c.permissions[k]}
                      onChange={(v) => setC({ ...c, permissions: { ...c.permissions, [k]: v } })}
                      options={[
                        { v: "yes", l: "Free" },
                        { v: "approval", l: "Ask you" },
                        { v: "no", l: "Never" },
                      ]}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <Row label="Weekly budget" hint={`Spent $${c.spent} so far this week`}>
            <div className="flex items-center gap-2">
              <input type="range" min={10} max={300} step={5} value={c.budget} onChange={(e) => setC({ ...c, budget: Number(e.target.value) })} className="w-[160px] accent-[#0a0a0a]" />
              <span className="w-12 text-right text-[13px] font-semibold">${c.budget}</span>
            </div>
          </Row>
          <Row label="When blocked" hint="For gaps the spec doesn't cover">
            <Segmented
              size="sm"
              value={c.whenBlocked}
              onChange={(v) => setC({ ...c, whenBlocked: v })}
              options={[
                { v: "park", l: "Park" },
                { v: "guess", l: "Best guess" },
                { v: "wait", l: "Wait" },
              ]}
            />
          </Row>
          <Row label="Escalation" hint={AUTONOMY[c.autonomy - 1]}>
            <input type="range" min={1} max={5} value={c.autonomy} onChange={(e) => setC({ ...c, autonomy: Number(e.target.value) })} className="w-[180px] accent-[#0a0a0a]" />
          </Row>
        </div>

        <AnimatePresence>
          {(review || done !== null) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 grid place-items-center bg-white/80 p-6 backdrop-blur-sm">
              <motion.div initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-[440px] rounded-[20px] bg-white p-5 shadow-[var(--shadow-float)] ring-1 ring-black/[0.08]">
                <div className="flex items-center gap-2.5">
                  <Face id="ada" size={30} />
                  <div className="text-[14px] font-semibold text-ink">{done !== null ? "Applied" : "Ada read this back before applying"}</div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {(done !== null ? applied : changes).map((x) => (
                    <div key={x} className="flex items-start gap-2 text-[13px] text-ink-2">
                      <span className={`mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${done !== null ? "bg-ok" : "bg-black/25"}`}>✓</span>
                      {x}
                    </div>
                  ))}
                </div>
                {done !== null ? (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-[#24603a]">Saved as v{done}. One click rolls back.</span>
                    <Btn tone="dark" onClick={ui.closeWin}>
                      Close
                    </Btn>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-end gap-2">
                    <Btn onClick={() => setReview(false)}>Back</Btn>
                    <Btn
                      tone="dark"
                      onClick={() => {
                        const patch: Partial<AgentConfig> = { ...c };
                        d({ type: "propose", pending: { id: `cfg-${id}-${s.clock}`, summary: `${nameOf(id)}: ${changes[0]}${changes.length > 1 ? ` +${changes.length - 1}` : ""}`, items: changes, apply: { configs: { [id]: patch } } } });
                        d({ type: "applyPending", who: "You" });
                        setApplied(changes);
                        setDone((s.versions[0]?.v ?? 0) + 1);
                        setReview(false);
                      }}
                    >
                      Confirm and apply
                    </Btn>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Window>
  );
}
