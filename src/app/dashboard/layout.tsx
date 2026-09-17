import { FolderPlus, Layers, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white">
            <Layers className="size-4" />
          </div>
          <span className="font-semibold">DevStash</span>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search items..." className="pl-9" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline">
            <FolderPlus className="size-4" />
            New Collection
          </Button>
          <Button>
            <Plus className="size-4" />
            New Item
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
}
