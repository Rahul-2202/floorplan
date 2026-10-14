export type LineKind = "prompt" | "think" | "tool" | "out" | "add" | "del" | "ok" | "err" | "dim";
export interface SessionLine {
  k: LineKind;
  t: string;
}

const L = (k: LineKind, t: string): SessionLine => ({ k, t });

export const SESSIONS: Record<string, { repo: string; lines: SessionLine[] }> = {
  be: {
    repo: "bookwell/api · booking/confirm-emails",
    lines: [
      L("prompt", "BOOK-153: write tests for confirmation emails, including the DST edge case"),
      L("think", "Reading the ticket, the contract and my lesson on timezones…"),
      L("tool", "Read src/emails/confirmation.ts"),
      L("tool", "Read memory/dev/contract.md"),
      L("think", "Emails render in the clinic's timezone. Need a test across the DST switch."),
      L("tool", "Edit test/emails/confirmation.test.ts"),
      L("add", "+ it('uses the clinic timezone across DST', async () => {"),
      L("add", "+   const slot = slotAt('2026-03-29T01:30', 'Europe/London')"),
      L("add", "+   expect(await render(slot)).toContain('Sun 29 Mar, 02:30')"),
      L("add", "+ })"),
      L("tool", "Bash npm test -- emails"),
      L("out", "  PASS  test/emails/confirmation.test.ts (14 tests)"),
      L("out", "  PASS  test/emails/send.test.ts (6 tests)"),
      L("ok", "✓ 20 passed · 0 failed · 2.4s"),
      L("tool", "Bash git commit -m \"Test confirmation emails across DST\""),
      L("dim", "Break point reached · reading 1 queued message from PM"),
      L("tool", "Bash gh pr create --title \"Booking confirmation emails\""),
      L("ok", "✓ PR #53 opened · merge to main needs CEO approval"),
    ],
  },
  fe: {
    repo: "bookwell/web · feat/launch-banner",
    lines: [
      L("prompt", "BOOK-148: finish the mobile layout for the launch banner"),
      L("tool", "Read src/components/LaunchBanner.tsx"),
      L("tool", "Read memory/agent/frontend/lessons.md"),
      L("think", "Lesson: use the clinic's brand colour, not ours."),
      L("tool", "Edit src/components/LaunchBanner.tsx"),
      L("add", "+ background: clinic.brandColor ?? 'var(--bw-ink)'"),
      L("del", "- background: 'var(--bw-orange)'"),
      L("tool", "Bash npm run test:visual -- banner"),
      L("out", "  ✓ desktop 1440 · ✓ tablet 768 · ✓ mobile 375"),
      L("tool", "Bash npx axe http://localhost:3000/book/meridian"),
      L("ok", "✓ 0 accessibility violations"),
      L("tool", "Bash git push"),
      L("ok", "✓ PR #52 updated · preview ready"),
    ],
  },
  pm: {
    repo: "linear · release v1.0",
    lines: [
      L("prompt", "Review PR #52 against BOOK-148's definition of done"),
      L("tool", "Read linear://BOOK-148"),
      L("tool", "Read github://bookwell/web/pull/52"),
      L("think", "Copy matches Marketing's final. Mobile verified. Accessibility clean."),
      L("tool", "GitHub approve PR #52"),
      L("ok", "✓ Approved · sent to CEO for merge (locked rule)"),
      L("tool", "Linear update BOOK-152 checklist"),
      L("out", "  [x] Freeze API  [x] Rollback plan  [ ] Regression  [ ] Prod pipeline  [ ] Tag v1.0"),
      L("dim", "Next: check the regression run at 15:00"),
    ],
  },
  ops: {
    repo: "bookwell/infra · prod-pipeline",
    lines: [
      L("prompt", "BOOK-154: production deploy pipeline"),
      L("tool", "Bash vercel deploy --prod --dry-run"),
      L("ok", "✓ Build 38s · 0 errors"),
      L("tool", "Bash dig bookwell.app +short"),
      L("err", "✕ bookwell.app still points at the old host"),
      L("think", "Need DNS access to change the A record. Policy for this room: stop and wait."),
      L("tool", "Slack DM → CEO: DNS access or temporary domain?"),
      L("dim", "Waiting for the CEO · parked at 80%"),
    ],
  },
  qa: {
    repo: "bookwell/e2e · regression",
    lines: [
      L("prompt", "BOOK-155: run the full booking regression on staging"),
      L("tool", "Bash npx playwright test --project=booking"),
      L("out", "  suite 1/5 · search & slots ........ 24 passed"),
      L("out", "  suite 2/5 · booking & payment ..... 31 passed"),
      L("out", "  suite 3/5 · double booking ........ running"),
      L("think", "Lesson: always run the concurrent booking test on release branches."),
      L("out", "  ✓ 50 concurrent bookings, 0 duplicates"),
      L("out", "  suite 4/5 · emails & timezones .... queued"),
    ],
  },
  strat: {
    repo: "notion · Launch campaign",
    lines: [
      L("prompt", "Finish the launch campaign plan"),
      L("tool", "Read memory/marketing/brand-voice.md"),
      L("tool", "Read memory/company/decisions/launch-scope.md"),
      L("think", "Launch is Friday the 10th. Tone is the only open call, and that's the CEO's."),
      L("tool", "Edit notion://Launch campaign/Timeline"),
      L("add", "+ Fri 09:00 LinkedIn ×3 · 09:30 X thread · 10:00 clinic email · 12:00 video"),
      L("dim", "Asked the CEO about tone · best guess meanwhile: warm but precise"),
    ],
  },
  cr1: {
    repo: "docs · LinkedIn launch posts",
    lines: [
      L("prompt", "Draft three LinkedIn posts for launch day"),
      L("tool", "Read memory/marketing/brand-voice.md"),
      L("tool", "Read memory/ceo/preferences.md"),
      L("think", "No \"excited\". Specific, calm, one number per post, sourced."),
      L("tool", "Write docs://launch-posts"),
      L("ok", "✓ 3 drafts · edited by Editor · sent to CEO"),
      L("dim", "Idle until the CEO reviews · next: Meridian case study"),
    ],
  },
  cr2: {
    repo: "media · launch-video",
    lines: [
      L("prompt", "Cut 2 of the launch video with Strategist's notes"),
      L("tool", "Read notes://cut-1-feedback"),
      L("think", "Faster open on the phone screen. Clinic name in the first three seconds."),
      L("tool", "Edit timeline: move shot 4 → 0:00"),
      L("tool", "Bash ffmpeg -i cut2.mov -vf captions.srt -c:v h264 cut2.mp4"),
      L("out", "  frame= 812 fps= 61 q=24.0 size=  18432kB time=00:00:27"),
      L("out", "  rendering… 64%"),
    ],
  },
  editor: {
    repo: "docs · blog/why-clinics-lose-bookings",
    lines: [
      L("prompt", "Edit the blog draft and check every claim"),
      L("tool", "Read docs://blog-draft"),
      L("think", "The '1 in 5' stat needs a source before it goes to the CEO."),
      L("tool", "Search \"missed calls physiotherapy bookings survey\""),
      L("out", "  Found: 2025 clinic survey, n=212, 19% of calls missed"),
      L("tool", "Edit docs://blog-draft"),
      L("add", "+ Nearly one in five calls to a clinic go unanswered (2025 survey, 212 clinics)."),
      L("del", "- Clinics lose 20% of all bookings."),
    ],
  },
};
