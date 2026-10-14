"use client";

import { useEffect, useState } from "react";
import { useEngine } from "@/sim/engine";
import { SimProvider } from "@/sim/store";
import { MobileOffice } from "./MobileOffice";
import { PanelRouter } from "./panels";
import { Toasts } from "./Toasts";
import { TopBar } from "./TopBar";
import { UIProvider, useUI } from "./ui";
import { WindowRouter } from "./windows";
import { World } from "./World";

function Shell() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile ? <MobileShell /> : <DesktopShell />;
}

function MobileShell() {
  useEngine([]);
  return <MobileOffice />;
}

function DesktopShell() {
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
    </div>
  );
}

export function OfficeApp() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOk(true), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <SimProvider>
      <UIProvider>{ok ? <Shell /> : <div className="fixed inset-0 bg-[#e9e3d8]" />}</UIProvider>
    </SimProvider>
  );
}
