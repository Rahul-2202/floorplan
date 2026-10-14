"use client";

import { useMemo } from "react";
import { Office } from "@/office/Office";
import type { AgentScene, Scene } from "@/office/types";
import { useIsDesktop } from "@/lib/useMedia";
import { FeedPanel, FileChip, type FeedItem } from "../feed/Feed";
import { Frame, Pinned, StageHead } from "./Pinned";

const ROOMS = { ceo: "built", dev: "built", meeting: "built", marketing: "ghost", sales: "blueprint", legal: "blueprint", finance: "blueprint" } as const;

const seated = (status: AgentScene["status"] = "working"): Record<string, AgentScene> => ({
  you: { at: "seat:you" },
  ada: { at: "ada:home" },
  pm: { at: "seat:pm", status },
  fe: { at: "seat:fe", status },
  be: { at: "seat:be", status },
  ops: { at: "seat:ops", status },
  qa: { at: "seat:qa", status },
});

const TASKS = {
  t1: { kind: "ticket" as const, at: [18, 6.15] as [number, number], label: "Slots UI" },
  t2: { kind: "ticket" as const, at: [22, 6.15] as [number, number], label: "Slots API" },
  t3: { kind: "ticket" as const, at: [18, 9.65] as [number, number], label: "Staging" },
  t4: { kind: "ticket" as const, at: [22, 9.65] as [number, number], label: "Test plan" },
};

interface Step {
  caption: string;
  feed: FeedItem[];
  scene: Scene;
}

const base = (s: Partial<Scene>): Scene => ({ rooms: ROOMS, camera: "dev", locked: ["dev"], agents: seated(), ...s });

const STEPS: Step[] = [
  {
    caption: "A ticket lands in Linear. The PM owns it and plans the work.",
    feed: [{ id: "f1", kind: "linear", who: "linear", text: "BOOK-142 Online booking was assigned to Development.", meta: "9:02" }],
    scene: base({
      board: { todo: 1, doing: 0, done: 0 },
      agents: { ...seated(), pm: { at: "seat:pm", status: "thinking", bubble: "Splitting this into four tasks." } },
      props: { ticket: { kind: "ticket", at: [30, 6.15], label: "BOOK-142", sub: "Online booking" } },
    }),
  },
  {
    caption: "Each specialist gets a piece, and they all work in parallel.",
    feed: [
      {
        id: "f2",
        kind: "room",
        who: "pm",
        text: "Frontend takes the slots UI, Backend the /slots API, DevOps staging, Tester the test plan.",
        meta: "9:04",
      },
    ],
    scene: base({ board: { todo: 2, doing: 4, done: 0 }, props: TASKS }),
  },
  {
    caption: "Agents talk to each other directly. No one waits for you to relay a question.",
    feed: [{ id: "f3", kind: "dm", who: "fe", to: "be", text: "What does /slots return? I want to build the picker against it.", meta: "9:31" }],
    scene: base({
      board: { todo: 2, doing: 4, done: 0 },
      props: TASKS,
      agents: { ...seated(), fe: { at: "dev:beside-be", bubble: "What does /slots return?" } },
    }),
  },
  {
    caption: "Decisions get written down, not lost in chat. Both tickets link to one contract.",
    feed: [
      {
        id: "f4",
        kind: "dm",
        who: "be",
        to: "fe",
        text: "Start, end and therapist id. I've saved it as the API contract.",
        meta: "9:33",
        attach: <FileChip name="contract.md" sub="linked to 2 tickets" />,
      },
    ],
    scene: base({
      board: { todo: 2, doing: 4, done: 0 },
      props: { ...TASKS, contract: { kind: "doc", at: [24.5, 7.1], label: "contract.md", sub: "shared", tone: "violet" } },
      agents: { ...seated(), fe: { at: "dev:beside-be", emote: "✓" }, be: { at: "seat:be", bubble: "Start, end, therapist. Writing it down." } },
    }),
  },
  {
    caption: "Messages queue instead of interrupting. Agents read them at natural break points.",
    feed: [
      { id: "f5", kind: "queue", who: "pm", to: "be", text: "Can you also return the clinic's timezone?", meta: "10:12" },
      { id: "f5b", kind: "queue", who: "ops", to: "be", text: "Staging DB is ready when you are.", meta: "10:14" },
    ],
    scene: base({
      board: { todo: 2, doing: 4, done: 0 },
      props: TASKS,
      agents: { ...seated(), be: { at: "seat:be", status: "working", badge: 2, bubble: { text: "Finishing my commit first…", tone: "quiet" } } },
    }),
  },
  {
    caption: "Commit pushed, inbox cleared. Focus is protected, nothing is dropped.",
    feed: [
      { id: "f6", kind: "github", who: "github", text: "Backend pushed 3 commits to booking/slots-api.", meta: "10:20" },
      { id: "f6b", kind: "dm", who: "be", to: "pm", text: "Timezone added. Picking up staging next.", meta: "10:21" },
    ],
    scene: base({
      board: { todo: 1, doing: 4, done: 1 },
      props: { t1: TASKS.t1, t3: TASKS.t3, t4: TASKS.t4, commit: { kind: "pr", at: [22, 6.15], label: "a1f3 pushed", tone: "ok" } },
      agents: { ...seated(), be: { at: "seat:be", status: "working", emote: "✓" } },
    }),
  },
  {
    caption: "Anyone can raise an urgent issue. It goes to the head, who decides what stops.",
    feed: [{ id: "f7", kind: "urgent", who: "qa", to: "pm", text: "Two patients can book the same slot on the release branch.", meta: "11:05" }],
    scene: base({
      board: { todo: 1, doing: 4, done: 1 },
      props: { t1: TASKS.t1, t3: TASKS.t3 },
      agents: {
        ...seated(),
        qa: { at: "dev:beside-pm", bubble: { text: "Double booking on the release branch!", tone: "urgent" } },
        pm: { at: "seat:pm", emote: "!" },
      },
    }),
  },
  {
    caption: "Fixed, tested, merged with your approval. The ticket closes itself.",
    feed: [
      { id: "f8", kind: "room", who: "pm", text: "Backend fixed the double booking. Tester signed off.", meta: "13:40" },
      { id: "f9", kind: "github", who: "github", text: "PR #48 merged into main. Approved by you.", meta: "13:52" },
    ],
    scene: base({
      board: { todo: 0, doing: 3, done: 4 },
      props: { pr: { kind: "pr", at: [30, 6.15], label: "PR #48 merged", tone: "ok" } },
      agents: { ...seated(), pm: { at: "seat:pm", bubble: "BOOK-142 is done. Nice work, team." }, qa: { at: "seat:qa", emote: "✓" } },
    }),
  },
];

export function WorkSection() {
  const desktop = useIsDesktop();
  return (
    <Pinned id="how" steps={STEPS.length} per={62}>
      {(step) => <WorkStage step={step} desktop={desktop} />}
    </Pinned>
  );
}

function WorkStage({ step, desktop }: { step: number; desktop: boolean }) {
  const feed = useMemo(() => STEPS.slice(0, step + 1).flatMap((s) => s.feed), [step]);
  return (
    <div className="flex h-full flex-col">
      <StageHead title="They work like a company." second="Not a chatbot waiting for prompts." captions={STEPS.map((s) => s.caption)} step={step} />
      <div className="mx-auto min-h-0 w-full max-w-[1320px] flex-1 px-3 pb-3 pt-5 md:px-8 md:pb-7">
        <Frame>
          <Office scene={STEPS[step].scene} inset={desktop ? { right: 384 } : { bottom: 236 }} />
          <div className="absolute inset-x-2 bottom-2 z-20 h-[226px] lg:inset-x-auto lg:bottom-3 lg:right-3 lg:top-3 lg:h-auto lg:w-[360px]">
            <FeedPanel items={feed} title="Activity" subtitle="Development · today" />
          </div>
        </Frame>
      </div>
    </div>
  );
}
