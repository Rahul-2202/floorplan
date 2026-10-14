import type { Metadata } from "next";
import { OfficeApp } from "@/office-app/OfficeApp";

export const metadata: Metadata = {
  title: "FloorPlan | Your office (live demo)",
  description: "Walk around a simulated FloorPlan office: talk to agents and Ada, see their work, outputs, memory and settings.",
};

export default function OfficePage() {
  return <OfficeApp />;
}
