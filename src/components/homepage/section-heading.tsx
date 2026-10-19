import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/homepage/reveal";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Badge variant="outline" className="mb-4 h-auto bg-card px-3 py-1 text-[13px] text-muted-foreground">
      {children}
    </Badge>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <Reveal className="mx-auto mb-14 max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3.5 text-[17px] text-muted-foreground">{description}</p>
    </Reveal>
  );
}
