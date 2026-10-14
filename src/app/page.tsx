import { Nav } from "@/components/Nav";
import { Act1 } from "@/components/landing/Act1";
import { CtaSection, FaqSection, Footer } from "@/components/landing/Closing";
import { DashboardSection } from "@/components/landing/Dashboard";
import { DecisionsSection } from "@/components/landing/Decisions";
import { EverywhereSection } from "@/components/landing/Everywhere";
import { IntegrationsSection } from "@/components/landing/Integrations";
import { LearnSection } from "@/components/landing/Learn";
import { MemorySection } from "@/components/landing/Memory";
import { RulesSection } from "@/components/landing/Rules";
import { ShapeSection } from "@/components/landing/Shape";
import { UseCasesSection } from "@/components/landing/UseCases";
import { WorkSection } from "@/components/landing/Work";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Act1 />
        <ShapeSection />
        <WorkSection />
        <DecisionsSection />
        <DashboardSection />
        <RulesSection />
        <MemorySection />
        <LearnSection />
        <UseCasesSection />
        <IntegrationsSection />
        <EverywhereSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
