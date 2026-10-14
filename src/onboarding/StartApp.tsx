"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { OfficeApp } from "@/office-app/OfficeApp";
import { clearSaved } from "@/sim/store";
import { Onboarding } from "./Onboarding";
import { Tour } from "./Tour";

/** Mock onboarding with Ada, then the same office with a guided tour. */
export function StartApp() {
  const [phase, setPhase] = useState<"setup" | "office">("setup");
  return (
    <AnimatePresence mode="wait">
      {phase === "setup" ? (
        <motion.div key="setup" exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.45 }}>
          <Onboarding
            onDone={() => {
              // Start the office fresh, exactly as set up.
              clearSaved();
              setPhase("office");
            }}
          />
        </motion.div>
      ) : (
        <motion.div key="office" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <OfficeApp overlay={<Tour />} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
