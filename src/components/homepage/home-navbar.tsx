"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Container } from "@/components/homepage/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 20);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors duration-300",
        scrolled ? "border-border bg-background/90" : "border-transparent bg-background/35",
      )}
    >
      <Container className="flex h-16 items-center gap-8">
        <Logo href="/" aria-label="DevStash home" />
        <nav aria-label="Primary" className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/sign-in" />}>
            Sign In
          </Button>
          <Button nativeButton={false} render={<Link href="/register" />}>
            Get Started
          </Button>
        </div>
      </Container>
    </header>
  );
}
