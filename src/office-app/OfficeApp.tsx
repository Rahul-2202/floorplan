"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useEngine } from "@/sim/engine";
import { SimProvider } from "@/sim/store";
import { MobileOffice } from "./MobileOffice";
import { PanelRouter } from "./panels";
import { Toasts } from "./Toasts";
import { TopBar } from "./TopBar";
import { UIProvider, useUI } from "./ui";
import { WindowRouter } from "./windows";
import { World } from "./World";

function Shell({ overlay }: { overlay?: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile ? <MobileShell /> : <DesktopShell overlay={overlay} />;
}

function MobileShell() {
  useEngine([]);
  return <MobileOffice />;
}

function DesktopShell({ overlay }: { overlay?: ReactNode }) {
  const ui = useUI();
  // Agents you're talking to don't wander off.
  const busy = [ui.card, ui.win?.id].filter(Boolean) as string[];
  useEngine(busy);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (ui.win) ui.closeWin();
      else if (ui.panel) ui.closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#e9e3d8]">
      <World />
      <TopBar />
      <Toasts />
      <PanelRouter />
      <WindowRouter />
      {overlay}
    </div>
  );
}

/** The office. `overlay` renders inside the app (used by the guided tour). */
export function OfficeApp({ overlay }: { overlay?: ReactNode } = {}) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOk(true), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <SimProvider>
      <UIProvider>{ok ? <Shell overlay={overlay} /> : <div className="fixed inset-0 bg-[#e9e3d8]" />}</UIProvider>
    </SimProvider>
  );
}
