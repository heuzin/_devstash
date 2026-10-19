"use client";

import { useInView } from "@/lib/hooks/use-in-view";
import { cn } from "@/lib/utils";

const AI_TAGS = ["react", "hooks", "typescript", "debounce", "performance"];

// One literal class per tag so Tailwind can see each stagger delay
const TAG_DELAYS = ["delay-200", "delay-[340ms]", "delay-[480ms]", "delay-[620ms]", "delay-[760ms]"];

export function AiTags() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.5 });

  return (
    <div ref={ref} className="flex flex-wrap gap-2">
      {AI_TAGS.map((tag, i) => (
        <span
          key={tag}
          className={cn(
            "rounded-full border border-type-snippet/30 bg-type-snippet/10 px-2.5 py-1 font-mono text-xs text-blue-300",
            "motion-safe:transition-[opacity,translate,scale] motion-safe:duration-400",
            TAG_DELAYS[i],
            !inView && "motion-safe:translate-y-1.5 motion-safe:scale-90 motion-safe:opacity-0",
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
