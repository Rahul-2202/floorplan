import type { Metadata } from "next";
import { Appendix } from "@/details/Appendix";
import { Intro } from "@/details/Intro";
import { Walkthrough } from "@/details/Walkthrough";

export const metadata: Metadata = {
  title: "FloorPlan | How it works, end to end",
  description: "Internal walkthrough of the FloorPlan product flow.",
  robots: { index: false, follow: false },
};

export default function Details() {
  return (
    <main>
      <Intro />
      <Walkthrough />
      <Appendix />
    </main>
  );
}
