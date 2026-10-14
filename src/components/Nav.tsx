"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui";

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Teams", href: "#teams" },
  { label: "Memory", href: "#memory" },
  { label: "Use cases", href: "#use-cases" },
  { label: "FAQ", href: "#faq" },
];

export function Nav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setSolid(v > 24));
  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 transition-[background,box-shadow,backdrop-filter] duration-500 md:px-8 ${
          solid ? "bg-[rgba(247,246,243,0.72)] shadow-[0_1px_0_rgba(10,10,10,0.06)] backdrop-blur-xl" : ""
        }`}
        style={{ borderRadius: solid ? "0 0 20px 20px" : 0 }}
      >
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[14.5px] font-medium text-ink-2 transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/start" variant="secondary" className="!hidden !h-10 !px-4 !text-[14px] sm:!inline-flex">
            Try the office
          </Button>
          <Button href="#demo" className="!h-10 !px-5 !text-[14px]">
            Book a demo
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
