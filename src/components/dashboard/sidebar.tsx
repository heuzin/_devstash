import { Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import type { CollectionSummary } from "@/lib/db/collections";
import type { ItemTypeSummary } from "@/lib/db/items";
import type { CurrentUser } from "@/lib/db/user";

const PRO_ITEM_TYPE_SLUGS = new Set(["files", "images"]);

interface SidebarProps {
  itemTypes: ItemTypeSummary[];
  favoriteCollections: CollectionSummary[];
  recentCollections: CollectionSummary[];
  user: CurrentUser | null;
}

export function Sidebar({
  itemTypes,
  favoriteCollections,
  recentCollections,
  user,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 overflow-y-auto p-4 pb-20">
        <div>
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Types</h3>
          <ul className="mt-2 space-y-1">
            {itemTypes.map((type) => {
              const Icon = ITEM_TYPE_ICONS[type.icon];
              return (
                <li key={type.id}>
                  <Link
                    href={`/items/${type.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <span className="flex items-center gap-2 capitalize">
                      {Icon && <Icon className="size-4" style={{ color: type.color }} />}
                      {type.name}s
                      {PRO_ITEM_TYPE_SLUGS.has(type.slug) && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          Pro
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{type.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {favoriteCollections.length > 0 && (
          <div className="mt-6">
            <h3 className="px-2 text-xs font-medium text-muted-foreground">Favorites</h3>
            <ul className="mt-2 space-y-1">
              {favoriteCollections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    href={`/collections/${collection.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      {collection.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{collection.itemCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Recent</h3>
          <ul className="mt-2 space-y-1">
            {recentCollections.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/collections/${collection.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full bg-muted-foreground/40"
                      style={{ backgroundColor: collection.accentColor }}
                    />
                    {collection.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{collection.itemCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/collections"
          className="mt-4 block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          View all collections
        </Link>
      </nav>

      <UserMenu user={user} />
    </div>
  );
}
