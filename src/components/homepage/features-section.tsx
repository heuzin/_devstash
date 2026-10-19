import type { ReactNode } from "react";
import { Code, File, Folder, Search, Sparkles, Terminal, type LucideIcon } from "lucide-react";
import { Container } from "@/components/homepage/container";
import { Reveal } from "@/components/homepage/reveal";
import { SectionHeading } from "@/components/homepage/section-heading";
import { TYPE_ACCENTS, type TypeAccent } from "@/components/homepage/type-accents";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: ReactNode;
  icon: LucideIcon;
  accent: TypeAccent;
}

const FEATURES: Feature[] = [
  {
    title: "Code Snippets",
    description:
      "Save reusable code with syntax highlighting for dozens of languages, ready to copy in one click.",
    icon: Code,
    accent: "snippet",
  },
  {
    title: "AI Prompts",
    description:
      "Keep your best prompts, system messages, and context files out of forgotten chat threads.",
    icon: Sparkles,
    accent: "prompt",
  },
  {
    title: "Instant Search",
    description: (
      <>
        Hit{" "}
        <kbd className="rounded border border-border bg-secondary px-1.5 py-px font-mono text-xs">⌘K</kbd>{" "}
        and search across titles, content, tags, and types without leaving the keyboard.
      </>
    ),
    icon: Search,
    accent: "link",
  },
  {
    title: "Commands",
    description:
      "Stop digging through bash history. Store the terminal commands you always forget.",
    icon: Terminal,
    accent: "command",
  },
  {
    title: "Files & Docs",
    description:
      "Upload context files, configs, PDFs, and images, then preview or download them anywhere.",
    icon: File,
    accent: "file",
  },
  {
    title: "Collections",
    description:
      "Group items of any type into collections like React Patterns or Interview Prep. One item, many homes.",
    icon: Folder,
    accent: "note",
  },
];

function FeatureCard({ title, description, icon: Icon, accent }: Feature) {
  return (
    <Reveal className="h-full">
      <article
        className={cn(
          "relative h-full overflow-hidden rounded-xl border border-border bg-card p-7 transition-[border-color,translate] duration-300 hover:-translate-y-1 hover:border-(--type-accent)/50",
          TYPE_ACCENTS[accent],
        )}
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-(--type-accent)/80" />
        <div className="mb-4.5 grid size-11 place-items-center rounded-lg bg-(--type-accent)/15 text-(--type-accent)">
          <Icon className="size-5.5" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-[15px] text-muted-foreground">{description}</p>
      </article>
    </Reveal>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 py-18 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title="Everything you reach for, in one place"
          description="Every item has a type, every type has a home. Find anything in seconds."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Container>
    </section>
  );
}
