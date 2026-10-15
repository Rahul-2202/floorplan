"use client";

import { useEffect, useRef, useState, type Dispatch, type ReactNode } from "react";
import { JoinGate } from "@/live/JoinGate";
import { LiveSync } from "@/live/LiveSync";
import { ROOMS, setAppLayout } from "@/office/layout";
import { useEngine } from "@/sim/engine";
import { SimProvider, useSim, type Action } from "@/sim/store";
import { CallDock } from "./CallDock";
import { ChatDock } from "./ChatDock";
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
  return (
    <>
      <MobileOffice />
      <LiveSync />
      <JoinGate />
    </>
  );
}

function DesktopShell({ overlay }: { overlay?: ReactNode }) {
  const ui = useUI();
  const { s } = useSim();
  // Agents you're talking to don't wander off, and neither do you.
  const busy = [ui.card, ui.win?.id, s.me].filter(Boolean) as string[];
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
      <CallDock />
      <Toasts />
      <PanelRouter />
      <ChatDock />
      <WindowRouter />
      <LiveSync />
      <JoinGate />
      {overlay}
    </div>
  );
}

/** Runs once when the office opens (used by /start to join as someone). */
function Boot({ fn }: { fn: (d: Dispatch<Action>) => void }) {
  const { d } = useSim();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    fn(d);
  }, [fn, d]);
  return null;
}

/** The office. `overlay` renders inside the app (used by the guided tour). */
export function OfficeApp({ overlay, boot }: { overlay?: ReactNode; boot?: (d: Dispatch<Action>) => void } = {}) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    // The app has desks for people that the landing pages don't.
    setAppLayout(true);
    const t = setTimeout(() => setOk(true), 0);
    return () => {
      clearTimeout(t);
      setAppLayout(false);
      ROOMS.ceo.name = "Your office";
    };
  }, []);
  return (
    <SimProvider>
      {boot && <Boot fn={boot} />}
      <UIProvider>{ok ? <Shell overlay={overlay} /> : <div className="fixed inset-0 bg-[#e9e3d8]" />}</UIProvider>
    </SimProvider>
  );
}
