import { Settings, Star } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ITEM_TYPE_ICONS } from "@/lib/item-type-icons";
import { CURRENT_USER, COLLECTIONS, ITEM_TYPES, ITEMS } from "@/lib/mock-data";

const favoriteCollections = COLLECTIONS.filter((collection) => collection.isFavorite);
const recentCollections = COLLECTIONS.filter((collection) => !collection.isFavorite).sort(
  (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
);

export function Sidebar() {
  const initials = CURRENT_USER.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 overflow-y-auto p-4 pb-20">
        <div>
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Types</h3>
          <ul className="mt-2 space-y-1">
            {ITEM_TYPES.map((type) => {
              const Icon = ITEM_TYPE_ICONS[type.icon];
              const count = ITEMS.filter((item) => item.itemTypeId === type.id).length;
              return (
                <li key={type.id}>
                  <Link
                    href={`/items/${type.name}s`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <span className="flex items-center gap-2 capitalize">
                      {Icon && <Icon className="size-4" style={{ color: type.color }} />}
                      {type.name}s
                    </span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

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

        <div className="mt-6">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Recent</h3>
          <ul className="mt-2 space-y-1">
            {recentCollections.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/collections/${collection.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span>{collection.name}</span>
                  <span className="text-xs text-muted-foreground">{collection.itemCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="fixed inset-x-0 bottom-0 z-10 flex w-64 items-center gap-2 border-t border-border bg-background p-4">
        <Avatar className="size-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{CURRENT_USER.name}</p>
          <p className="truncate text-xs text-muted-foreground">{CURRENT_USER.email}</p>
        </div>
        <Link
          href="/settings"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </div>
  );
}
