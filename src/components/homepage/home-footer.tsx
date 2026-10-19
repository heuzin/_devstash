import { Container } from "@/components/homepage/container";
import { Logo } from "@/components/shared/logo";

const PRODUCT_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export function HomeFooter() {
  return (
    <footer className="border-t border-border bg-card/40 pt-16 pb-8">
      <Container className="grid grid-cols-1 gap-10 sm:grid-cols-[2fr_1fr]">
        <div>
          <Logo href="/" aria-label="DevStash home" />
          <p className="mt-3.5 max-w-xs text-sm text-muted-foreground">
            One fast, searchable, AI-enhanced hub for all your developer knowledge.
          </p>
        </div>
        <nav aria-label="Product" className="flex flex-col gap-2.5 text-sm">
          <h4 className="mb-1 text-[13px] font-semibold tracking-wider uppercase">Product</h4>
          {PRODUCT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>
      <Container className="mt-12 border-t border-border pt-6 text-[13px] text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} DevStash. All rights reserved.</p>
      </Container>
    </footer>
  );
}
