import { Folder, Package, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { COLLECTIONS, ITEMS } from "@/lib/mock-data";

const stats = [
  {
    label: "Items",
    value: ITEMS.length,
    icon: Package,
  },
  {
    label: "Collections",
    value: COLLECTIONS.length,
    icon: Folder,
  },
  {
    label: "Favorite Items",
    value: ITEMS.filter((item) => item.isFavorite).length,
    icon: Star,
  },
  {
    label: "Favorite Collections",
    value: COLLECTIONS.filter((collection) => collection.isFavorite).length,
    icon: Star,
  },
];

export function StatsCards() {
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
