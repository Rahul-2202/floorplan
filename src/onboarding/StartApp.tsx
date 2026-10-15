"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, type Dispatch } from "react";
import { OfficeApp } from "@/office-app/OfficeApp";
import { clearSaved, type Action } from "@/sim/store";
import { Onboarding, type StartAs } from "./Onboarding";
import { Tour } from "./Tour";

/** Joining with an invite: Nina walks in, by the office code or Marco's room link. */
function joinAsNina(via: "office" | "room") {
  return (d: Dispatch<Action>) => {
    const room = via === "room" ? "marketing" : null;
    d({
      type: "addPerson",
      person: { id: "nina", name: "Nina", full: "Nina Patel", title: "Brand designer", role: "member", room, presence: "online", email: "nina@bookwell.app", joined: "Thu 09:40", via: via === "room" ? "mkt-r8w2" : "BKW-7Q4M" },
      at: room ? "mkt:new2" : "lobby:2",
    });
    d({ type: "viewer", id: "nina" });
    d({ type: "post", channel: "general", msg: { id: "nina-join", who: "ada", t: "09:40", agent: true, text: room ? "Nina just joined Marketing with Marco's room link. Welcome, Nina! 👋" : "Nina just joined with the office code and is in the lobby. Welcome! 👋" } });
    d({ type: "addInbox", item: { id: "i-nina-hi", kind: "fyi", from: "ada", title: room ? "Welcome to Marketing, Nina" : "Welcome to Bookwell, Nina", sub: room ? "Marco is your lead. The Strategist and three creators work with you." : "You're in the lobby. The CEO or I will give you a room shortly.", priority: "low", at: "09:40", to: ["nina"] } });
    if (room) d({ type: "addInbox", item: { id: "i-nina-marco", kind: "fyi", from: "nina", title: "Nina joined Marketing with your room link", sub: "Brand designer. Say hi!", priority: "low", at: "09:40", to: ["marco"] } });
    else d({ type: "addInbox", item: { id: "i-nina", kind: "approval", from: "nina", title: "Nina joined with the office code. Pick a room", sub: "Brand designer · invited by Marco for Marketing", priority: "normal", at: "09:40", ref: { type: "person", id: "nina" }, to: ["you"] } });
  };
}

/** Mock onboarding with Ada, then the same office with a guided tour. */
export function StartApp() {
  const [as, setAs] = useState<StartAs | null>(null);
  const boot = useCallback((d: Dispatch<Action>) => as?.as === "nina" && joinAsNina(as.via)(d), [as]);
  return (
    <AnimatePresence mode="wait">
      {!as ? (
        <motion.div key="setup" exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.45 }}>
          <Onboarding
            onDone={(who) => {
              // Start the office fresh, exactly as set up.
              clearSaved();
              setAs(who);
            }}
          />
        </motion.div>
      ) : (
        <motion.div key="office" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <OfficeApp overlay={<Tour flow={as.as === "ceo" ? "ceo" : "member"} />} boot={as.as === "nina" ? boot : undefined} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
