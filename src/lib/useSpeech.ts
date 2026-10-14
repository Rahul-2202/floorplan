"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Rec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRec(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Push-to-talk speech recognition. Calls onFinal with the transcript. */
export function useSpeech(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Rec | null>(null);
  const finalCb = useRef(onFinal);
  useEffect(() => {
    finalCb.current = onFinal;
  });

  useEffect(() => {
    const t = setTimeout(() => setSupported(!!getRec()), 0);
    return () => clearTimeout(t);
  }, []);

  const start = useCallback(() => {
    const R = getRec();
    if (!R) return;
    setError(null);
    const r = new R();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    let final = "";
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = text;
      }
      setInterim(text);
    };
    r.onerror = (e) => setError(e.error === "not-allowed" ? "Microphone access was blocked." : "Didn't catch that.");
    r.onend = () => {
      setListening(false);
      setInterim("");
      if (final.trim()) finalCb.current(final.trim());
    };
    rec.current = r;
    setListening(true);
    r.start();
  }, []);

  const stop = useCallback(() => rec.current?.stop(), []);

  return { supported, listening, interim, error, start, stop };
}
