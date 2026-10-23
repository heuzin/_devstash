import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceCardProps {
  name: string;
  amount: string;
  period: string;
  description: string;
  features: string[];
  cta: ReactNode;
  highlighted?: boolean;
}

export function PriceCard({
  name,
  amount,
  period,
  description,
  features,
  cta,
  highlighted,
}: PriceCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-xl border border-border bg-card p-8",
        highlighted &&
          "border-type-snippet/60 bg-linear-to-b from-type-snippet/8 via-card to-card shadow-[0_0_0_1px_rgb(59_130_246/0.25),0_30px_60px_-30px_rgb(59_130_246/0.45)]",
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-type-snippet to-indigo-500 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-3.5">
        <span className="text-[44px] font-extrabold tracking-tight">{amount}</span>
        <span className="ml-1 text-muted-foreground">{period}</span>
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      <ul className="mt-7 mb-8 grid flex-1 content-start gap-3 text-[15px]">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check className="mt-1 size-4 shrink-0 text-type-snippet" strokeWidth={3} />
            {feature}
          </li>
        ))}
      </ul>
      {cta}
    </article>
  );
}
