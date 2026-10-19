import { Check, Sparkles } from "lucide-react";
import { AiTags } from "@/components/homepage/ai-tags";
import { Container } from "@/components/homepage/container";
import { Reveal } from "@/components/homepage/reveal";
import { Badge } from "@/components/ui/badge";

const AI_CAPABILITIES = [
  "Auto-tag suggestions based on your content",
  "Short summaries of long notes and files",
  '"Explain This Code" in plain English',
  "Prompt Optimizer that rewrites prompts to be clearer",
];

function CodeMockup() {
  return (
    <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.7] text-zinc-300">
      <code>
        <span className="text-purple-400">export function</span>{" "}
        <span className="text-blue-400">useDebounce</span>&lt;<span className="text-teal-400">T</span>
        &gt;(value: <span className="text-teal-400">T</span>, delay ={" "}
        <span className="text-amber-400">300</span>) {"{"}
        {"\n  "}
        <span className="text-purple-400">const</span> [debounced, setDebounced] ={" "}
        <span className="text-blue-400">useState</span>(value);
        {"\n\n  "}
        <span className="text-blue-400">useEffect</span>(() =&gt; {"{"}
        {"\n    "}
        <span className="text-purple-400">const</span> id = <span className="text-blue-400">setTimeout</span>
        (() =&gt; <span className="text-blue-400">setDebounced</span>(value), delay);
        {"\n    "}
        <span className="text-purple-400">return</span> () =&gt;{" "}
        <span className="text-blue-400">clearTimeout</span>(id);
        {"\n  }"}, [value, delay]);
        {"\n\n  "}
        <span className="text-purple-400">return</span> debounced;
        {"\n}"}
      </code>
    </pre>
  );
}

export function AiSection() {
  return (
    <section className="border-y border-border bg-card/40 py-18 md:py-24">
      <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <Badge className="mb-4.5 h-auto gap-1.5 border-type-prompt/35 bg-type-prompt/10 px-3 py-1 text-[13px] font-semibold text-type-prompt">
            <Sparkles className="fill-current" />
            Pro Feature
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Let AI do the organizing</h2>
          <p className="mt-3.5 text-[17px] text-muted-foreground">
            DevStash understands what you save, so you spend less time filing and more time building.
          </p>
          <ul className="mt-7 grid gap-3.5">
            {AI_CAPABILITIES.map((capability) => (
              <li key={capability} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5.5 shrink-0 place-items-center rounded-full bg-green-500/15 text-green-500">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {capability}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="min-w-0 overflow-hidden rounded-xl border border-border bg-background shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)]">
          <div className="flex items-center gap-1.75 border-b border-border bg-card px-3.5 py-3">
            <span className="size-2.75 rounded-full bg-red-500" />
            <span className="size-2.75 rounded-full bg-yellow-500" />
            <span className="size-2.75 rounded-full bg-green-500" />
            <span className="ml-2.5 font-mono text-xs text-muted-foreground">useDebounce.ts</span>
          </div>
          <CodeMockup />
          <div className="border-t border-dashed border-border bg-linear-to-b from-type-prompt/5 to-transparent px-5 pt-4 pb-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-type-prompt uppercase">
              <Sparkles className="size-3.25 fill-current" />
              AI Generated Tags
            </p>
            <AiTags />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
