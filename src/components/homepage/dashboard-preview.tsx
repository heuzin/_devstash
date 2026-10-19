import { TYPE_ACCENT_ORDER, TYPE_ACCENTS, type TypeAccent } from "@/components/homepage/type-accents";
import { cn } from "@/lib/utils";

const PREVIEW_CARDS: TypeAccent[] = ["snippet", "prompt", "command", "note", "image", "link"];

export function DashboardPreview() {
  return (
    <div className="flex h-70 overflow-hidden rounded-xl border border-border bg-card md:h-80" aria-hidden="true">
      <div className="flex w-[26%] flex-col gap-2.5 border-r border-border bg-background px-3 py-3.5">
        <div className="mb-1.5 h-2.5 w-3/5 rounded bg-linear-to-r from-indigo-500 to-purple-600" />
        {TYPE_ACCENT_ORDER.map((type) => (
          <div key={type} className={cn("flex items-center gap-1.5", TYPE_ACCENTS[type])}>
            <span className="size-2 shrink-0 rounded-xs bg-(--type-accent)" />
            <span className="h-2 flex-1 rounded bg-secondary" />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1 p-3.5">
        <div className="mb-3.5 h-5.5 rounded-md border border-border bg-background" />
        <div className="grid grid-cols-3 gap-2.5">
          {PREVIEW_CARDS.map((type) => (
            <div
              key={type}
              className={cn(
                "flex h-26 flex-col gap-1.5 rounded-lg border border-t-[3px] border-border border-t-(--type-accent) bg-secondary px-2.5 py-3 transition-transform duration-300 hover:-translate-y-0.75",
                TYPE_ACCENTS[type],
              )}
            >
              <span className="h-2 w-[70%] rounded-full bg-(--type-accent)/45" />
              <span className="h-1.5 rounded-full bg-muted-foreground/20" />
              <span className="h-1.5 w-[90%] rounded-full bg-muted-foreground/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
