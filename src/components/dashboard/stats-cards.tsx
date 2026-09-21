import { Folder, Package, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";

export async function StatsCards() {
  const [itemStats, collectionStats] = await Promise.all([getItemStats(), getCollectionStats()]);

  const stats = [
    { label: "Items", value: itemStats.total, icon: Package },
    { label: "Collections", value: collectionStats.total, icon: Folder },
    { label: "Favorite Items", value: itemStats.favorites, icon: Star },
    { label: "Favorite Collections", value: collectionStats.favorites, icon: Star },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-foreground">
              <stat.icon className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
