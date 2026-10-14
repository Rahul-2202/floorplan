"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useSim } from "./store";

const TICK_MS = 2000;

const AMBIENT: Record<string, string[]> = {
  pm: ["dev:board", "dev:huddleT"],
  fe: ["dev:huddleL", "hall:cooler"],
  be: ["hall:cooler", "dev:huddleR"],
  ops: ["dev:front"],
  qa: ["dev:board"],
  strat: ["mkt:brief"],
  cr1: ["mkt:beside-ed"],
  cr2: ["mkt:brief", "hall:cooler"],
  editor: ["mkt:brief"],
};

/** Advances the sim clock and lets agents stretch their legs now and then. */
export function useEngine(busy: string[]) {
  const { s, d } = useSim();
  const ref = useRef(s);
  const busyRef = useRef(busy);
  useLayoutEffect(() => {
    ref.current = s;
    busyRef.current = busy;
  });

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") d({ type: "tick" });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [d]);

  useEffect(() => {
    let back: ReturnType<typeof setTimeout> | null = null;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const st = ref.current;
      const ids = Object.keys(AMBIENT).filter((id) => {
        const l = st.live[id];
        return l && !l.paused && !l.bubble && l.status !== "blocked" && typeof l.at === "string" && l.at.startsWith("seat:") && !busyRef.current.includes(id);
      });
      if (!ids.length) return;
      const id = ids[Math.floor(Math.random() * ids.length)];
      const spots = AMBIENT[id];
      const home = st.live[id].at;
      d({ type: "live", id, patch: { at: spots[Math.floor(Math.random() * spots.length)] } });
      back = setTimeout(() => {
        const cur = ref.current.live[id];
        if (cur && typeof cur.at === "string" && !cur.at.startsWith("seat:") && !busyRef.current.includes(id)) d({ type: "live", id, patch: { at: home } });
      }, 9000);
    }, 16000);
    return () => {
      clearInterval(t);
      if (back) clearTimeout(back);
    };
  }, [d]);
}
