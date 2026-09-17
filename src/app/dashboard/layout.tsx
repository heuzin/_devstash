"use client";

import { useState } from "react";
import { FolderPlus, Layers, PanelLeft, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function toggleSidebar() {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setDesktopSidebarOpen((open) => !open);
    } else {
      setMobileSidebarOpen((open) => !open);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <PanelLeft className="size-4" />
          </Button>
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

      <div className="flex flex-1">
        <aside
          className={cn(
            "hidden shrink-0 overflow-hidden border-r border-border transition-all duration-200 md:block",
            desktopSidebarOpen ? "w-64" : "w-0 border-r-0",
          )}
        >
          <div className="h-full w-64">
            <Sidebar />
          </div>
        </aside>

        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Sidebar</SheetTitle>
            <Sidebar />
          </SheetContent>
        </Sheet>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
