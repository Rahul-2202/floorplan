import type { Metadata } from "next";
import { StartApp } from "@/onboarding/StartApp";

export const metadata: Metadata = {
  title: "FloorPlan | Set up your office (demo)",
  description: "Set up a FloorPlan office with Ada, then take a guided tour of everything it can do.",
};

export default function StartPage() {
  return <StartApp />;
}
