"use client";

import { useEffect, useRef, useState } from "react";

export type Speaker = "ada" | "pm" | "you" | "strat" | "be" | "qa" | "fe" | "ops" | (string & {});

export interface Line {
  who: Speaker;
  text: string;
  /** What the voice should say, when it differs from the transcript. */
  say?: string;
}

export type MeetingPhase = "before" | "live" | "after";

/* ----------------------------------------------------------------- voices */

const PREFS: Record<string, { names: string[]; pitch: number; rate: number }> = {
  ada: { names: ["Samantha", "Ava", "Allison", "Aria", "Google US English", "Karen", "Moira", "Tessa", "Zira"], pitch: 1.08, rate: 1.04 },
  pm: { names: ["Daniel", "Rishi", "Google UK English Male", "Guy", "Arthur", "Oliver", "Aaron", "David"], pitch: 0.95, rate: 1.02 },
  you: { names: ["Alex", "Evan", "Tom", "Nathan", "Google UK English Female", "Jenny", "Fred", "Mark"], pitch: 1.0, rate: 1.0 },
  strat: { names: ["Karen", "Moira", "Serena", "Google UK English Female", "Susan"], pitch: 1.05, rate: 1.03 },
  priya: { names: ["Veena", "Lekha", "Rishi", "Tessa", "Fiona", "Google UK English Female", "Victoria"], pitch: 1.04, rate: 1.03 },
  sam: { names: ["Aaron", "Fred", "Ralph", "Google US English", "Junior", "Reed"], pitch: 0.92, rate: 1.04 },
  marco: { names: ["Luca", "Alice", "Diego", "Jorge", "Eddy", "Rocko", "Google UK English Male"], pitch: 0.97, rate: 1.02 },
  lena: { names: ["Nicky", "Kathy", "Vicki", "Flo", "Shelley", "Google US English"], pitch: 1.12, rate: 1.05 },
  jordan: { names: ["Grandpa", "Sandy", "Tom", "Evan", "Google US English"], pitch: 1.0, rate: 1.03 },
};

let chosen: Record<string, SpeechSynthesisVoice | null> | null = null;

function pickVoices(): Record<string, SpeechSynthesisVoice | null> {
  const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  const used = new Set<string>();
  const out: Record<string, SpeechSynthesisVoice | null> = {};
  const quality = (v: SpeechSynthesisVoice) => (/premium/i.test(v.name) ? 3 : /enhanced|natural|neural/i.test(v.name) ? 2 : /google/i.test(v.name) ? 1 : 0);
  for (const [who, pref] of Object.entries(PREFS)) {
    let best: SpeechSynthesisVoice | null = null;
    for (const name of pref.names) {
      const hits = all.filter((v) => v.name.includes(name) && !used.has(v.name)).sort((a, b) => quality(b) - quality(a));
      if (hits.length) {
        best = hits[0];
        break;
      }
    }
    if (!best) best = all.find((v) => !used.has(v.name)) ?? all[0] ?? null;
    if (best) used.add(best.name);
    out[who] = best;
  }
  return out;
}

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

const readingTime = (text: string) => Math.max(1700, text.split(/\s+/).length * 330 + 700);

/**
 * Speaks a line and calls onEnd exactly once. If the voice never starts
 * (audio blocked) or never reports finishing, it falls back to reading pace
 * so the meeting can't stall.
 */
function speak(line: Line, onEnd: () => void) {
  const synth = window.speechSynthesis;
  if (!chosen || !Object.values(chosen).some(Boolean)) chosen = pickVoices();
  const key = PREFS[line.who] ? line.who : "pm";
  const u = new SpeechSynthesisUtterance(line.say ?? line.text);
  const v = chosen[key];
  if (v) u.voice = v;
  u.pitch = PREFS[key].pitch;
  u.rate = PREFS[key].rate;

  let done = false;
  let started = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const finish = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    onEnd();
  };
  u.onstart = () => {
    started = true;
  };
  u.onend = finish;
  u.onerror = finish;
  synth.speak(u);
  const budget = readingTime(line.text);
  timers.push(
    setTimeout(() => {
      if (!started) {
        synth.cancel();
        // Voice is unavailable: show the line for the rest of its reading time.
        timers.push(setTimeout(finish, Math.max(0, budget - 1500)));
      }
    }, 1500),
  );
  timers.push(setTimeout(finish, budget * 2.2 + 2000));
  return () => {
    done = true;
    timers.forEach(clearTimeout);
  };
}

/** Speak one line aloud in a speaker's voice (used for Ada's replies). */
export function say(text: string, who: Speaker = "ada") {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  speak({ who, text }, () => {});
}

/* ------------------------------------------------------------------- hook */

/**
 * Plays a meeting line by line. With sound on, each line is spoken and the
 * next starts when the voice finishes; otherwise lines advance at reading
 * pace. Returns the index of the line being said (-1 before it starts).
 */
export function useMeeting(lines: Line[], phase: MeetingPhase, sound: boolean) {
  const [index, setIndex] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase changes: reset before the meeting, finish after it.
  useEffect(() => {
    const t = setTimeout(() => {
      if (phase === "before") setIndex(-1);
      if (phase === "after") setIndex(lines.length);
      if (phase === "live") setIndex((i) => (i < 0 || i >= lines.length ? 0 : i));
    }, phase === "live" ? 700 : 0);
    return () => clearTimeout(t);
  }, [phase, lines.length]);

  useEffect(() => {
    if (phase !== "live" || index < 0 || index >= lines.length) return;
    const line = lines[index];
    const next = () => {
      setSpeaking(false);
      timer.current = setTimeout(() => setIndex((i) => (i === index ? i + 1 : i)), 320);
    };
    let cancelled = false;
    let stop: (() => void) | undefined;
    if (sound && speechSupported()) {
      window.speechSynthesis.cancel();
      timer.current = setTimeout(() => {
        if (cancelled) return;
        setSpeaking(true);
        stop = speak(line, () => {
          if (!cancelled) next();
        });
      }, 60);
    } else {
      timer.current = setTimeout(next, readingTime(line.text));
    }
    return () => {
      cancelled = true;
      stop?.();
      if (timer.current) clearTimeout(timer.current);
      if (speechSupported()) window.speechSynthesis.cancel();
    };
  }, [index, phase, sound, lines]);

  // Stop talking when leaving the page section.
  useEffect(() => () => {
    if (speechSupported()) window.speechSynthesis.cancel();
  }, []);

  // Voices load asynchronously in some browsers.
  useEffect(() => {
    if (!speechSupported()) return;
    const load = () => (chosen = pickVoices());
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  return { index, speaking: speaking && sound && phase === "live" };
}
