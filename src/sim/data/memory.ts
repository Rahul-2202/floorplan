import type { MemItem } from "../types";

export const MEMORY: MemItem[] = [
  /* company */
  { id: "m-charter", layer: "company", type: "charter", title: "Company charter", body: "Bookwell: online booking for independent physio clinics. Mission: no clinic loses a patient to a missed call.", owner: "ada", status: "active", source: "Onboarding call, Day 1", date: "Day 1" },
  { id: "m-dec-scope", layer: "company", type: "decision", title: "Launch Fri Mar 10, SMS in v1.1", body: "Decided in the launch scope meeting. SMS needs a provider contract; email reminders cover launch.", owner: "ada", status: "active", source: "Minutes · Launch scope, Tue 15:39", date: "Tue" },
  { id: "m-launch-old", layer: "company", type: "decision", title: "Launch Wed Mar 15 (tentative)", body: "Original estimate from the PM, if SMS made it.", owner: "ada", status: "superseded", source: "Cross-team channel, Tue 10:02", date: "Tue", supersededBy: "m-dec-scope" },
  { id: "m-timeline", layer: "company", type: "timeline", title: "Company timeline", body: "Day 1 setup · Day 2 work begins · Tue scope decision · Wed staging live · Fri launch", owner: "ada", status: "active", source: "Cross-room digest", date: "Thu" },
  { id: "m-digest", layer: "company", type: "note", title: "Cross-room digest", body: "Dev shipped online booking and staging. Marketing finished the voice guide and page copy.", owner: "ada", status: "active", source: "Weekly digest", date: "Wed" },

  /* CEO preferences */
  { id: "m-pref-public", layer: "ceo", type: "preference", title: "Approve anything public before it ships", body: "Locked rule. Drafts always come to you.", owner: "ada", status: "active", source: "Onboarding call", date: "Day 1" },
  { id: "m-pref-excited", layer: "ceo", type: "preference", title: "Never say \"excited\" in copy", body: "Visible to Marketing only.", owner: "ada", status: "active", source: "Your correction to Editor, Mon", date: "Mon" },
  { id: "m-pref-merge", layer: "ceo", type: "preference", title: "Merge rights stay with heads", body: "Unless scoped to hotfixes. Visible to Development only.", owner: "ada", status: "active", source: "Rollback v7 → v6", date: "Day 6" },
  { id: "m-pref-brief", layer: "ceo", type: "preference", title: "Morning briefing at 9:00, short", body: "Three bullets max. FYIs batched for Friday.", owner: "ada", status: "active", source: "Your feedback, week 1", date: "Week 1" },
  { id: "m-pref-meet", layer: "ceo", type: "preference", title: "Meetings: 10 minutes, with a pre-read", body: "No meetings during focus time (13:30–15:00).", owner: "ada", status: "active", source: "Your calendar rules", date: "Week 1" },

  /* development */
  { id: "m-dev-charter", layer: "room:dev", type: "charter", title: "Room charter", body: "Owns the booking product end to end. Derived from the company charter.", owner: "pm", status: "active", source: "Derived from company charter", date: "Day 1" },
  { id: "m-contract", layer: "room:dev", type: "note", title: "API contract: /slots", body: "GET /slots?clinic&day → start, end, therapistId, timezone. One shared object, linked from BOOK-143 and BOOK-144.", owner: "be", status: "active", source: "DM Backend ↔ Frontend", date: "Wed" },
  { id: "m-dev-sms", layer: "room:dev", type: "decision", title: "SMS reminders moved to v1.1", body: "Approved by PM from the launch scope minutes.", owner: "pm", status: "active", source: "Minutes · Launch scope", date: "Tue" },
  { id: "m-freeze", layer: "room:dev", type: "note", title: "API freeze Thursday the 9th", body: "Derived from the Mar 10 launch. Flag for refresh if the date moves.", owner: "pm", status: "active", source: "Derived from company decision", date: "Tue" },
  { id: "m-team-notes", layer: "room:dev", type: "note", title: "Team notes", body: "Backend is fastest on API work; Tester catches booking edge cases early; DevOps waits rather than guesses on production.", owner: "pm", status: "active", source: "PM's observations", date: "Wed" },

  /* marketing */
  { id: "m-mkt-charter", layer: "room:marketing", type: "charter", title: "Room charter", body: "Owns the launch campaign and brand voice. Derived from the company charter.", owner: "strat", status: "active", source: "Derived from company charter", date: "Day 1" },
  { id: "m-voice", layer: "room:marketing", type: "note", title: "Brand voice", body: "Warm, specific, never hype. Talk like a good physio: calm and clear.", owner: "strat", status: "active", source: "Brand voice guide (MKT-20)", date: "Mon" },
  { id: "m-plan-date", layer: "room:marketing", type: "decision", title: "Posts scheduled for Fri the 10th", body: "Derived from the launch decision.", owner: "strat", status: "active", source: "Derived from company decision", date: "Tue" },
  { id: "m-pricing", layer: "room:marketing", type: "note", title: "Pricing page notes", body: "Updated after a stale flag from Creator. Two flags merged.", owner: "strat", status: "active", source: "Stale flag, Day 5", date: "Wed" },

  /* agents */
  { id: "m-be-tz", layer: "agent:be", type: "lesson", title: "Always return timezone with slots", body: "Clinics span time zones; booking times must carry the clinic's zone.", owner: "be", status: "active", source: "BOOK-151", date: "Wed", confidence: "high" },
  { id: "m-be-email", layer: "agent:be", type: "lesson", title: "Email reminders until SMS ships", body: "From the launch scope decision.", owner: "be", status: "active", source: "Minutes · Launch scope", date: "Tue", confidence: "high" },
  { id: "m-be-role", layer: "agent:be", type: "role", title: "Role card", body: "Owns the booking API. Never double-books. Merge to main needs approval.", owner: "ada", status: "active", source: "Set up by Ada", date: "Day 1" },
  { id: "m-be-scratch", layer: "agent:be", type: "scratch", title: "Scratchpad", body: "BOOK-153: tests for DST edge case still TODO.", owner: "be", status: "active", source: "Current session", date: "Thu" },
  { id: "m-fe-brand", layer: "agent:fe", type: "lesson", title: "Use each clinic's brand colour", body: "You asked for clinic colours over ours on the booking page.", owner: "fe", status: "active", source: "Your answer, Day 2", date: "Day 2", confidence: "high" },
  { id: "m-fe-role", layer: "agent:fe", type: "role", title: "Role card", body: "Patient-facing booking UI. Mobile first, accessible.", owner: "ada", status: "active", source: "Set up by Ada", date: "Day 1" },
  { id: "m-qa-double", layer: "agent:qa", type: "lesson", title: "Always test double booking", body: "Run concurrent-booking test on every release branch.", owner: "qa", status: "active", source: "PR #48 incident", date: "Mon", confidence: "high" },
  { id: "m-ops-dns", layer: "agent:ops", type: "scratch", title: "Scratchpad", body: "Production ready except DNS. Fallback: floorplan temp domain.", owner: "ops", status: "active", source: "Current session", date: "Thu" },
  { id: "m-pm-notes", layer: "agent:pm", type: "lesson", title: "CEO prefers short pre-reads", body: "Question, two options, positions. One screen.", owner: "pm", status: "active", source: "Launch scope meeting", date: "Tue", confidence: "medium" },
  { id: "m-editor-excited", layer: "agent:editor", type: "lesson", title: "No \"excited\" in any copy", body: "From your correction.", owner: "editor", status: "active", source: "Your DM, Mon", date: "Mon", confidence: "high" },
  { id: "m-cr1-claims", layer: "agent:cr1", type: "lesson", title: "Only claims we can source", body: "Editor cut an unsourced stat. Keep a source for every number.", owner: "cr1", status: "active", source: "Editor review, Thu", date: "Thu", confidence: "medium" },
  { id: "m-cr2-cuts", layer: "agent:cr2", type: "scratch", title: "Scratchpad", body: "Cut 2: open on the phone screen, clinic name in first 3s, captions on.", owner: "cr2", status: "active", source: "Current session", date: "Thu" },
  { id: "m-strat-tone", layer: "agent:strat", type: "lesson", title: "Clinic owners prefer calm over playful", body: "From 40 owner interviews.", owner: "strat", status: "active", source: "Research notes", date: "Wed", confidence: "medium" },
];
