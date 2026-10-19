import Link from "next/link";
import { Container } from "@/components/homepage/container";
import { Reveal } from "@/components/homepage/reveal";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-18 md:py-24">
      <Container>
        <Reveal className="rounded-2xl border border-border bg-card bg-[radial-gradient(ellipse_at_top,rgb(99_102_241/0.25),transparent_65%)] px-8 py-18 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Organize Your Knowledge?</h2>
          <p className="mx-auto mt-3.5 mb-7 max-w-lg text-[17px] text-muted-foreground">
            Join developers who stopped losing their best snippets, prompts, and commands.
          </p>
          <Button size="lg" className="h-11 px-5" nativeButton={false} render={<Link href="/register" />}>
            Get Started Free
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
