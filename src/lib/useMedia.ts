"use client";

import { useEffect, useState } from "react";

export function useIsDesktop() {
  const [d, setD] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setD(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return d;
}
