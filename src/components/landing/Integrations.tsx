"use client";

import { BrandIcon } from "../brands";
import { Card, Reveal, SectionHead } from "../ui";

const ROW_A = ["Slack", "Linear", "Jira", "GitHub", "Notion", "Figma", "Google Calendar", "Gmail", "HubSpot", "Salesforce", "Stripe", "Zoom"];
const ROW_B = ["LinkedIn", "X", "Instagram", "Google Docs", "Google Sheets", "Google Drive", "Xero", "QuickBooks", "Zendesk", "Intercom", "Sentry", "Vercel"];

function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const all = [...items, ...items];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div className="flex w-max gap-3 py-1.5" style={{ animation: `marquee 48s linear infinite${reverse ? " reverse" : ""}` }}>
        {all.map((n, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06]">
            <BrandIcon name={n} size={18} />
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

const RUNTIMES = [
  { name: "Claude Code", icon: "Claude", note: "Reads CLAUDE.md", tone: "bg-[#fbe9de]" },
  { name: "Codex", icon: "Codex", note: "Reads AGENTS.md", tone: "bg-[#e8eefb]" },
  { name: "Any runtime", icon: "+", note: "Through an adapter", tone: "bg-[#f0efed]" },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="relative py-[clamp(96px,14vh,160px)]">
      <div className="px-5 md:px-8">
        <SectionHead
          title="Plugs into what you already run."
          second="Every agent, its own engine."
          sub="Pick the runtime per agent, connect the tools your work lives in, and turn existing workflows into rooms. FloorPlan is the office layer on top."
        />
        <div className="mx-auto mt-12 grid max-w-[900px] gap-4 sm:grid-cols-3">
          {RUNTIMES.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.06}>
              <Card className="flex items-center gap-3.5 p-4">
                <span className={`grid h-11 w-11 place-items-center rounded-[13px] ${r.tone}`}>
                  {r.icon === "+" ? <span className="text-[20px] font-semibold text-ink">+</span> : <BrandIcon name={r.icon} size={22} />}
                </span>
                <div>
                  <div className="text-[15px] font-semibold text-ink">{r.name}</div>
                  <div className="text-[12.5px] text-muted">{r.note}</div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal className="mt-10 flex flex-col gap-2">
        <Marquee items={ROW_A} />
        <Marquee items={ROW_B} reverse />
      </Reveal>
    </section>
  );
}
