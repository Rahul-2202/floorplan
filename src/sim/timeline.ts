import type { SimState } from "./store";
import type { AgentLive, InboxItem, Output, Task, Toast } from "./types";

type Step = { at: number; run: (s: SimState) => SimState };

const time = (s: SimState) => {
  const m = 9 * 60 + 40 + s.clock;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const live = (s: SimState, id: string, patch: Partial<AgentLive>): SimState => ({ ...s, live: { ...s.live, [id]: { ...s.live[id], ...patch } } });
const task = (s: SimState, id: string, patch: Partial<Task>, update?: { who: string; text: string }): SimState => ({
  ...s,
  tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updates: update ? [...t.updates, { t: `Thu ${time(s)}`, ...update }] : t.updates } : t)),
});
const toast = (s: SimState, t: Omit<Toast, "id">): SimState => ({ ...s, toasts: [...s.toasts, { ...t, id: `tl-${s.clock}-${t.who}` }].slice(-4) });
const output = (s: SimState, o: Output): SimState => ({ ...s, outputs: [o, ...s.outputs.filter((x) => x.id !== o.id)] });
const inbox = (s: SimState, i: InboxItem): SimState => ({ ...s, inbox: [i, ...s.inbox.filter((x) => x.id !== i.id)] });
const post = (s: SimState, convo: string, who: string, text: string): SimState => ({
  ...s,
  conversations: s.conversations.map((c) => (c.id === convo ? { ...c, at: `Thu ${time(s)}`, messages: [...c.messages, { who, text, t: time(s) }] } : c)),
});

export const TIMELINE: Step[] = [
  {
    at: 1,
    run: (s) => live(task(s, "t-155", { progress: 55, step: "Running suite 4/5" }), "qa", { step: "Running regression suite 4/5", bubble: "Suite 3 green ✓" }),
  },
  { at: 3, run: (s) => live(s, "qa", { bubble: null }) },
  {
    at: 4,
    run: (s) => live(task(s, "t-153", { progress: 85, step: "Opening the PR" }, { who: "be", text: "All 20 tests green." }), "be", { bubble: "Tests green ✓", step: "Opening PR #53" }),
  },
  {
    at: 6,
    run: (s) => {
      let n = live(s, "be", { bubble: null, queued: 0, step: "Waiting on review for PR #53" });
      n = task(n, "t-153", { state: "review", progress: 95, step: "PR #53 waiting for your approval", outputs: ["o-pr53"] }, { who: "be", text: "PR #53 opened. Merge to main needs you." });
      n = output(n, {
        id: "o-pr53",
        kind: "pr",
        title: "PR #53 · Booking confirmation emails",
        by: "be",
        room: "dev",
        at: `Thu ${time(n)}`,
        status: "review",
        viewed: false,
        taskId: "t-153",
        summary: "Sends a confirmation within a minute of booking, in the clinic's timezone. 20 tests, including DST.",
        meta: [
          ["Files", "6 changed · +214 −12"],
          ["Checks", "Build ✓ · Tests ✓ (20)"],
          ["Reviewers", "PM approved · merge needs you"],
        ],
        body: ["+ await sendConfirmation(booking, { tz: clinic.timezone })", "+ it('uses the clinic timezone across DST', …)", "- // TODO: confirmation email"],
      });
      n = inbox(n, { id: "i-pr53", kind: "approval", from: "be", title: "Merge PR #53 confirmation emails", sub: "PM approved. 20 tests green.", priority: "normal", at: time(n), ref: { type: "output", id: "o-pr53" } });
      n = post(n, "c-dev", "be", "PR #53 is up: confirmation emails, 20 tests green.");
      return toast(n, { who: "be", text: "PR #53 is ready: booking confirmation emails", action: { label: "Review", panel: "outputs", ref: "o-pr53" } });
    },
  },
  {
    at: 8,
    run: (s) => live(task(s, "t-148", { progress: 80, step: "Mobile layout done" }), "fe", { bubble: "Mobile layout done.", step: "Final checks on the banner" }),
  },
  { at: 10, run: (s) => live(s, "fe", { bubble: null }) },
  {
    at: 11,
    run: (s) => {
      let n = live(s, "cr2", { step: "Cut 2 ready for review", status: "idle", bubble: "Cut 2 is ready!" });
      n = task(n, "t-m25", { state: "review", progress: 100, step: "Waiting for your review", outputs: ["o-video1", "o-video2"] }, { who: "cr2", text: "Cut 2 rendered with the faster open." });
      n = output(n, {
        id: "o-video2",
        kind: "video",
        title: "Launch video · cut 2 (45s)",
        by: "cr2",
        room: "marketing",
        at: `Thu ${time(n)}`,
        status: "review",
        viewed: false,
        taskId: "t-m25",
        summary: "Faster open on the phone screen, clinic name in the first 3 seconds, captions on.",
        meta: [
          ["Length", "0:45"],
          ["Format", "1080×1350, captions on"],
          ["Changes", "Applied both of Strategist's notes"],
        ],
      });
      n = post(n, "c-mkt", "cr2", "Cut 2 is up for review.");
      return toast(n, { who: "cr2", text: "Launch video cut 2 is ready for your review", action: { label: "Watch", panel: "outputs", ref: "o-video2" } });
    },
  },
  { at: 13, run: (s) => live(s, "cr2", { bubble: null }) },
  {
    at: 14,
    run: (s) => {
      let n = live(s, "qa", { at: "dev:beside-pm", status: "blocked", bubble: "Emails show UTC for one clinic!" });
      n = live(n, "pm", { emote: "!" });
      n = post(n, "c-dev", "qa", "Urgent → PM: confirmation email shows UTC for Meridian's second site.");
      return toast(n, { who: "qa", text: "Urgent to PM: a timezone bug in confirmation emails" });
    },
  },
  {
    at: 16,
    run: (s) => {
      let n = live(s, "pm", { emote: null, bubble: "Backend, fix before merge please." });
      n = live(n, "qa", { at: "seat:qa", status: "working", bubble: null });
      n = live(n, "be", { status: "working", step: "Fixing the multi-site timezone bug", bubble: "On it." });
      n = task(n, "t-153", { state: "ongoing", progress: 90, step: "Fixing multi-site timezone" }, { who: "pm", text: "Tester found a multi-site timezone bug. Fix before merge." });
      return post(n, "c-dev", "pm", "Backend: fix the multi-site timezone before PR #53 merges.");
    },
  },
  { at: 18, run: (s) => live(live(s, "pm", { bubble: null }), "be", { bubble: null }) },
  {
    at: 19,
    run: (s) => {
      const n = toast(s, { who: "ada", text: "Launch readiness review is at 11:00. The pre-read is ready.", action: { label: "Open", panel: "calendar", ref: "ev-readiness" } });
      return live(n, "ada", { bubble: "Pre-read is ready." });
    },
  },
  { at: 21, run: (s) => live(s, "ada", { bubble: null }) },
  {
    at: 22,
    run: (s) => {
      let n = live(s, "be", { step: "Fix pushed to PR #53", bubble: "Fixed. Tester, can you re-run?" });
      n = task(n, "t-153", { state: "review", progress: 95, step: "Waiting for your approval" }, { who: "be", text: "Multi-site timezone fixed, test added." });
      return post(n, "c-dev", "be", "Fixed: each site now uses its own timezone. Test added.");
    },
  },
  {
    at: 24,
    run: (s) => {
      let n = live(s, "be", { bubble: null });
      n = live(n, "qa", { bubble: "Re-run green ✓" });
      n = task(n, "t-155", { progress: 75, step: "Running suite 5/5" });
      return n;
    },
  },
  { at: 26, run: (s) => live(s, "qa", { bubble: null, step: "Running regression suite 5/5" }) },
  {
    at: 27,
    run: (s) => {
      let n = live(s, "editor", { bubble: "Blog draft is ready for you.", status: "idle", step: "Draft sent to you" });
      n = task(n, "t-m26", { state: "review", progress: 100, step: "Sent to you for review" }, { who: "editor", text: "Every claim sourced. Sent to the CEO." });
      n = output(n, {
        id: "o-blog",
        kind: "blog",
        title: "Blog draft · Why clinics lose 1 in 5 bookings",
        by: "editor",
        room: "marketing",
        at: `Thu ${time(n)}`,
        status: "review",
        viewed: false,
        taskId: "t-m26",
        summary: "900 words. Every number sourced (2025 clinic survey, n=212).",
        body: [
          "Nearly one in five calls to a physio clinic go unanswered.",
          "For a busy front desk that's not carelessness, it's arithmetic: one person, three lines, a patient in the room.",
          "Online booking doesn't replace the front desk. It gives it back the hours it spends on the phone.",
        ],
      });
      return toast(n, { who: "editor", text: "Blog draft is ready for review", action: { label: "Read", panel: "outputs", ref: "o-blog" } });
    },
  },
  { at: 29, run: (s) => live(s, "editor", { bubble: null }) },
  {
    at: 30,
    run: (s) => {
      const open = s.inbox.find((i) => i.id === "i-dns" && !i.resolved);
      if (!open) return s;
      let n = inbox(s, { ...open, priority: "high", sub: "Unanswered for 40 min. Escalated by Ada: launch depends on it." });
      n = live(n, "ops", { bubble: "Still waiting on DNS…" });
      return toast(n, { who: "ada", text: "DevOps' DNS question is still open and blocks launch. Escalated.", action: { label: "Answer", panel: "inbox" } });
    },
  },
  { at: 32, run: (s) => live(s, "ops", { bubble: null }) },
  {
    at: 34,
    run: (s) => {
      let n = live(s, "qa", { bubble: "Regression complete ✓", status: "idle", step: "Regression complete" });
      n = task(n, "t-155", { state: "done", progress: 100, step: "All suites green" }, { who: "qa", text: "All 5 suites green on staging." });
      n = task(n, "t-152", { progress: 80, subtasks: s.tasks.find((t) => t.id === "t-152")?.subtasks?.map((x) => (x.title.startsWith("Regression") ? { ...x, done: true } : x)) });
      n = output(n, { id: "o-regress", kind: "report", title: "Regression report · release v1.0", by: "qa", room: "dev", at: `Thu ${time(n)}`, status: "approved", viewed: false, taskId: "t-155", summary: "5 suites, 142 tests, 0 failures. Double booking: 50 concurrent, 0 duplicates.", body: ["Suite|Tests|Result", "Search & slots|24|Pass", "Booking & payment|31|Pass", "Double booking|18|Pass", "Emails & timezones|41|Pass", "Accessibility|28|Pass"] });
      return toast(n, { who: "qa", text: "Regression complete: 142 tests, all green", action: { label: "Report", panel: "outputs", ref: "o-regress" } });
    },
  },
  { at: 36, run: (s) => live(s, "qa", { bubble: null }) },
  {
    at: 38,
    run: (s) => {
      let n = live(s, "strat", { at: "mkt:beside-ed", bubble: "Clinic email next?" });
      n = live(n, "editor", { bubble: "On it after the blog." });
      return n;
    },
  },
  { at: 41, run: (s) => live(live(s, "strat", { at: "seat:strat", bubble: null }), "editor", { bubble: null }) },
];
