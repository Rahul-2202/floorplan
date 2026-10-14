import type { InboxItem } from "../types";

export const INBOX: InboxItem[] = [
  { id: "i-dns", kind: "question", from: "ops", title: "DNS access for bookwell.app?", sub: "Blocks the production pipeline. Or use a temporary domain.", priority: "high", at: "08:52", ref: { type: "task", id: "t-154" } },
  { id: "i-tone", kind: "question", from: "strat", title: "Launch posts: playful or professional?", sub: "Last open item in the campaign plan.", priority: "high", at: "09:00", ref: { type: "task", id: "t-m21" } },
  { id: "i-pr52", kind: "approval", from: "fe", title: "Merge PR #52 launch banner", sub: "PM approved. Merge to main needs you.", priority: "normal", at: "09:33", ref: { type: "output", id: "o-pr52" } },
  { id: "i-posts", kind: "approval", from: "cr1", title: "Three LinkedIn launch posts", sub: "Edited. Nothing goes out without your yes.", priority: "normal", at: "09:18", ref: { type: "output", id: "o-posts" } },
  { id: "i-video", kind: "meeting", from: "cr2", title: "Video review at 15:00?", sub: "Requested by Creator, checked by Ada. Clashes with nothing.", priority: "normal", at: "09:35", ref: { type: "event", id: "ev-video" } },
  { id: "i-fyi", kind: "fyi", from: "ada", title: "4 updates batched for Friday", sub: "Spend on track · 2 tickets closed · staging deploy · voice guide v2", priority: "low", at: "08:00", batched: true },
];
