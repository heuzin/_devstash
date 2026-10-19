import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChaosBox } from "@/components/homepage/chaos-box";
import { Container } from "@/components/homepage/container";
import { DashboardPreview } from "@/components/homepage/dashboard-preview";
import { Reveal } from "@/components/homepage/reveal";
import { Eyebrow } from "@/components/homepage/section-heading";
import { Button } from "@/components/ui/button";

function VisualPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="w-full min-w-0">
      <p className="mb-2.5 font-mono text-[13px] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-18 md:pt-35 md:pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-50 left-1/2 h-150 w-225 -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(99_102_241/0.22),transparent)]"
      />
      <Container className="relative">
        <Reveal className="mx-auto mb-16 max-w-3xl text-center">
          <Eyebrow>Your developer knowledge hub</Eyebrow>
          <h1 className="text-[clamp(38px,6vw,64px)] leading-tight font-extrabold tracking-tight">
            Stop Losing Your
            <span className="block bg-linear-to-r from-type-snippet via-indigo-500 to-type-image bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Snippets in VS Code, prompts in old chat threads, commands in bash history, links buried
            in bookmarks. DevStash brings it all into one fast, searchable, AI-enhanced hub.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-11 px-5" nativeButton={false} render={<Link href="/register" />}>
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-5"
              nativeButton={false}
              render={<a href="#features" />}
            >
              See Features
            </Button>
          </div>
        </Reveal>

        <Reveal className="grid grid-cols-1 items-center justify-items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <VisualPanel label="Your knowledge today...">
            <ChaosBox />
          </VisualPanel>
          <div aria-hidden="true" className="rotate-90 md:mt-7.5 md:rotate-0">
            <div className="grid size-14 place-items-center rounded-full bg-linear-to-br from-type-snippet to-indigo-500 text-white motion-safe:animate-arrow-pulse">
              <ArrowRight className="size-6.5" strokeWidth={2.5} />
            </div>
          </div>
          <VisualPanel label="...with DevStash">
            <DashboardPreview />
          </VisualPanel>
        </Reveal>
      </Container>
    </section>
  );
}
