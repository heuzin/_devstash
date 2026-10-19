# Homepage

## Overview

Replace the placeholder `src/app/page.tsx` with the real marketing homepage, ported from the static prototype in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). Match the prototype's layout, copy, and animations, but rebuild it with Tailwind/shadcn and React components instead of plain HTML/CSS/JS.

## Requirements

- `/` renders the homepage (public, not added to `proxy.ts`'s matcher)
- Sections, in order: Navbar, Hero (text + chaos → arrow → dashboard visual), Features, AI, Pricing, CTA, Footer
- Copy, section order, and content come straight from `prototypes/homepage/index.html`
- Set page `metadata` (title/description) from the prototype's `<head>`
- Leave `prototypes/homepage/` untouched

## Component Structure

Server components by default; `'use client'` only for the pieces that need browser APIs or state. Place everything in `src/components/homepage/`.

**Server components**

- `src/app/page.tsx` — composes the sections below
- `HeroSection` — eyebrow, gradient headline, subtext, CTAs; renders `ChaosBox`, the pulsing arrow, and `DashboardPreview`
- `DashboardPreview` — static simplified sidebar + card grid
- `FeaturesSection` — maps over a `FEATURES` array (title, description, Lucide icon, accent color) to render 6 `FeatureCard`s
- `AiSection` — Pro badge, checklist, editor mockup (code block + `AiTags`)
- `PricingSection` — section header; renders `PricingCards`
- `CtaSection`, `Footer` (copyright year via `new Date().getFullYear()` on the server)

**Client components**

- `HomeNavbar` — fixed nav that becomes more opaque past `scrollY > 20`
- `ChaosBox` — the 8 floating icons; port the `requestAnimationFrame` logic from `script.js` (drift, wall bounce, rotation, scale pulse, cursor repel), using refs instead of `getElementById`, pausing via `IntersectionObserver` when off-screen, and cleaning up listeners/RAF on unmount
- `PricingCards` — monthly/yearly toggle (shadcn `Switch`) swapping Pro between `$8/month` and `$72/year` ("Just $6/month, billed yearly.")
- `Reveal` — small wrapper that fades/slides children in when scrolled into view (one shared `IntersectionObserver` hook, e.g. `useInView` in `src/lib/hooks/`); `AiTags` uses the same hook to stagger the tags in

All animations respect `prefers-reduced-motion` (Tailwind `motion-safe:`/`motion-reduce:` variants, and skip the RAF loop in `ChaosBox`).

## Links & Buttons

| Element                                     | Destination                                     |
| ------------------------------------------- | ----------------------------------------------- |
| Logo (nav + footer)                         | `/`                                             |
| Nav "Features" / "Pricing", footer Product  | `#features` / `#pricing` (smooth scroll)        |
| Nav "Sign In"                               | `/sign-in`                                      |
| "Get Started", "Get Started Free" (all)     | `/register`                                     |
| Hero "See Features"                         | `#features`                                     |
| Free plan "Get Started"                     | `/register`                                     |
| Pro plan "Upgrade to Pro"                   | `/register` (Stripe billing not built yet)      |

- If the user is signed in (`auth()` in `page.tsx`), the navbar swaps Sign In / Get Started for a single "Go to Dashboard" button → `/dashboard`
- Drop footer links with no destination yet (Changelog, Docs, Blog, Support, About, Privacy, Terms) rather than shipping `href="#"`

## Styling

- Tailwind CSS v4 utilities only; no ported `styles.css`, no inline `style` props (use Tailwind arbitrary values or CSS variables set via classes where a per-card accent color is needed)
- Use shadcn `Button` (with `nativeButton={false}` when rendered as a `Link`), `Badge`, `Card`, and `Switch` where they fit
- Reuse the app's existing theme tokens (`bg-background`, `text-muted-foreground`, `border-border`, etc.) and Geist fonts from the root layout instead of the prototype's Inter/JetBrains Mono and custom variables
- Item type accent colors: define once in a shared constant (e.g. `HOMEPAGE_TYPE_COLORS`) and use the app's real system type colors (snippet `#3b82f6`, prompt `#8b5cf6`, command `#f97316`, note `#fde047`, file `#6b7280`, image `#ec4899`, link `#10b981`) so the homepage matches what users see in-app
- Use Lucide icons for features, checklist, and arrow; the brand marks in `ChaosBox` (Notion, Slack, VS Code) stay inline SVGs, and GitHub reuses `src/components/icons/github-icon.tsx`
- Extract the duplicated logo markup (`Layers` icon + "DevStash" wordmark, currently in `dashboard-chrome.tsx` and `(auth)/layout.tsx`) into a shared `Logo` component and reuse it in the navbar and footer

## Responsive

- Mobile: hero visual stacks vertically with the arrow rotated 90° to point down; features, AI, pricing, and footer grids collapse to a single column
- No horizontal overflow at 390px

## Testing

- No unit tests needed (UI-only, no server actions or `src/lib` utilities beyond a trivial hook)
- Verify via Playwright at 1440px and 390px: animations run, pricing toggle swaps prices, every link/button goes to the destination in the table above, signed-in users see "Go to Dashboard", no console errors or horizontal overflow
