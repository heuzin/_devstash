import type { Metadata } from "next";
import { AiSection } from "@/components/homepage/ai-section";
import { CtaSection } from "@/components/homepage/cta-section";
import { FeaturesSection } from "@/components/homepage/features-section";
import { HeroSection } from "@/components/homepage/hero-section";
import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeNavbar } from "@/components/homepage/home-navbar";
import { PricingSection } from "@/components/homepage/pricing-section";

export const metadata: Metadata = {
  title: "DevStash — Your Developer Knowledge Hub",
  description:
    "One fast, searchable, AI-enhanced hub for your snippets, prompts, commands, notes, files, images, and links.",
};

export default function HomePage() {
  return (
    <div className="overflow-x-clip">
      <HomeNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AiSection />
        <PricingSection />
        <CtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}
