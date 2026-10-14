"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";

function ExposeLenis() {
  // Handy for jumping to a scroll position while reviewing the page.
  const lenis = useLenis();
  useEffect(() => {
    (window as unknown as { lenis?: unknown }).lenis = lenis;
  }, [lenis]);
  return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true, anchors: true }}>
      <ExposeLenis />
      {children}
    </ReactLenis>
  );
}
