import type { ReactNode } from "react";

interface FavoritesSectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

export function FavoritesSection({ title, count, children }: FavoritesSectionProps) {
  return (
    <section>
      <h2 className="flex items-center gap-2 border-b border-border px-2 pb-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {title}
        <span className="text-foreground/70">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="px-2 py-1.5 text-muted-foreground">No favorite {title.toLowerCase()}.</p>
      ) : (
        <ul className="divide-y divide-border/50">{children}</ul>
      )}
    </section>
  );
}
