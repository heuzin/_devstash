import { Container } from "@/components/homepage/container";
import { PricingCards } from "@/components/homepage/pricing-cards";
import { SectionHeading } from "@/components/homepage/section-heading";

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 py-18 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing, start free"
          description="Upgrade when you need unlimited storage and AI superpowers."
        />
        <PricingCards />
      </Container>
    </section>
  );
}
