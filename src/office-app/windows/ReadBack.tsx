"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useSim } from "@/sim/store";
import type { Pending } from "@/sim/types";
import { Btn, Face } from "../bits";

/** Ada's plain-language confirmation before any setting changes. */
export function ReadBack({ pending, onClose, onApplied }: { pending: Pending | null; onClose: () => void; onApplied?: () => void }) {
  const { s, d } = useSim();
  const [done, setDone] = useState<number | null>(null);
  const [items, setItems] = useState<string[]>([]);
  return (
    <AnimatePresence>
      {pending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-white/80 p-6 backdrop-blur-sm">
          <motion.div initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-[440px] rounded-[20px] bg-white p-5 shadow-[var(--shadow-float)] ring-1 ring-black/[0.08]">
            <div className="flex items-center gap-2.5">
              <Face id="ada" size={30} />
              <div className="text-[14px] font-semibold text-ink">{done !== null ? "Applied" : "Ada read this back before applying"}</div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {(done !== null ? items : pending.items).map((x) => (
                <div key={x} className="flex items-start gap-2 text-[13px] text-ink-2">
                  <span className={`mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${done !== null ? "bg-ok" : "bg-black/25"}`}>✓</span>
                  {x}
                </div>
              ))}
            </div>
            {done !== null ? (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-[#24603a]">Saved as v{done}. One click rolls back.</span>
                <Btn
                  tone="dark"
                  onClick={() => {
                    setDone(null);
                    onClose();
                  }}
                >
                  Done
                </Btn>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <Btn onClick={onClose}>Back</Btn>
                <Btn
                  tone="dark"
                  onClick={() => {
                    setItems(pending.items);
                    d({ type: "propose", pending });
                    d({ type: "applyPending", who: "You" });
                    setDone((s.versions[0]?.v ?? 0) + 1);
                    onApplied?.();
                  }}
                >
                  Confirm and apply
                </Btn>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
