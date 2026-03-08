# Marla McLeod Portfolio — Project Brief

## What this is

A luxury fashion portfolio for Marla McLeod — fashion stylist, photographer, creative director. The aesthetic reference is Loewe.com, Bottega Veneta, Rick Owens — not a portfolio template. Visitors should feel they've entered a fashion house.

**Live dev server:** `npm run dev` → http://localhost:3000

---

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** — uses `@import 'tailwindcss'` in CSS, no tailwind.config.js
- **GSAP 3** — all scroll animation and micro-interactions
- **Lenis** (`@studio-freight/lenis`) — smooth scroll, integrated with GSAP ScrollTrigger ticker. Do not mix with the newer `lenis` package.
- **Vitest** — test runner

---

## Project structure

```
src/
  app/
    globals.css          # Black body, Tailwind 4 theme, easing constant
    layout.tsx           # Root layout: fonts, GrainOverlay, Nav, SmoothScrollProvider
    page.tsx             # Home page (/)
  components/
    layout/
      GrainOverlay.tsx   # SVG feTurbulence noise overlay, pointer-events none
      Nav.tsx            # Fixed transparent nav — wordmark left, links right
    work/
      HeroImage.tsx      # LCP-safe hero with black overlay reveal
      ProjectGrid.tsx    # 2-column grid of project cards
      LookbookStrip.tsx  # Horizontal scroll film-strip
  data/
    projects.ts          # Static project data — edit this to add/change projects
    services.ts          # Services + pricing data
  lib/
    fonts.ts             # Cormorant Garamond (display) + DM Sans (body) singletons
  providers/
    SmoothScrollProvider.tsx  # Lenis + GSAP ScrollTrigger integration
  types/
    project.ts           # Project interface
```

---

## Design rules — never break these

- **Black background everywhere** — `#000000`, no exceptions
- **No border-radius** on images or cards — sharp edges only
- **No drop shadows** — separation via contrast and space
- **No gradient backgrounds** — solid black + grain only
- **No spring physics** — cubic-bezier easing only. One var defined in globals.css: `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`
- **No masonry grid** — 2-column uniform grid only
- **No social icons** — "Instagram" as plain uppercase text only
- **No sticky header with background fill** — nav is always transparent
- **Animations slow and cinematic** — minimum 800ms, never bouncy
- **Forms are allowed** — booking and contact forms are in scope, styled to match the aesthetic (black bg, no border-radius, minimal labels)

---

## Typography

| Role | Font | Size | Style |
|------|------|------|-------|
| Display headlines | Cormorant Garamond | 10–14vw | Uppercase, tracking 0.05–0.15em, weight 300–400 |
| Nav items | DM Sans | 9–11px | Uppercase, tracking 0.2–0.4em |
| Body / prose | DM Sans | 13–15px | Line-height 1.6–1.8, max-width 560px — use `.prose` class |
| Metadata labels | DM Sans | 8–10px | Uppercase, tracking 0.3em, opacity 0.5–0.7 |

CSS font vars: `var(--font-display)` (Cormorant), `var(--font-sans)` (DM Sans)

---

## Site copy (sourced from live site)

### Home page

**Biblical quote (full-width display type):**
> "I praise you, for I am fearfully and wonderfully made. Wonderful are your works; my soul knows it very well." — Psalm 139:14

**Artist statement (prose, max-width 560px):**
> McLeod's photography philosophy centers on celebrating human authenticity rather than staged perfection. Her mission is capturing the inherent beauty people possess when unposed and uninhibited — trusting instinct to document genuine moments while allowing existing beauty to emerge naturally, rather than imposing predetermined aesthetic visions.

### Navigation

Work / Services / Contact / Instagram (@marlizzlle)

### Services page

Prose intro (2–3 sentences) followed by named packages. Services link to the booking page, not a raw email.

**Wedding Photography**
- Engagement Session — $350 (1 hour, 15 edited photos)
- Elopement Package — $900 (2 hours, 40 edited photos)
- Wedding Package — from $2,500 (full-day coverage, 100+ edited photos, online gallery)

**Styling (Personal or Brand)**
- Personal Styling — $150/hr (wardrobe consultation, outfit curation, guided shopping, wardrobe building)
- Brand Styling — from $500 (visual identity consultation, wardrobe selection for branding shoots)

**Photography (Personal or Commercial)**
- Personal Portraits — $250 (1 hour, 10 retouched photos)
- Headshots — $150 (30 min, 5 edited photos)
- Commercial Photography — from $500 (product, event, or marketing)

**Personal Shopping**
- Sourcing — 10% of item cost (personalized concierge sourcing for hard-to-find items)

Custom packages available on request.

### Contact page

- Instagram: @marlizzlle (plain uppercase text link)
- Location: New York (small uppercase)
- Booking form (see Booking section below)

---

## Projects data

Edit `src/data/projects.ts` — one entry per project:

```ts
{
  slug: 'nyfw-23',
  title: 'NYFW 23',
  year: 2023,
  category: 'Runway',
  image: '/images/projects/nyfw-23/cover.jpg',
  coverAlt: 'NYFW 2023 runway styling by Marla McLeod',
}
```

**6 projects:** NYFW 23, RYLEE 2023, Cailin 2021, Rachel Halloween 2021, Barbie Gets Dressed (Strike Magazine 2021), ANNIA 2021

Images go in `public/images/projects/[slug]/`. Placeholders are dark `#111` divs until real images drop in.

---

## Booking system (future phases)

The goal is a full in-site booking + payment flow. Keeping users in the branded experience is intentional — no redirecting to Calendly or external forms.

### Phase A — Booking form (in scope next)
- `/contact` and each service link to a booking form
- Fields: Name, Email, Phone (optional), Service type (select), Preferred dates, Message/vision
- On submit: sends notification email to Marla, sends confirmation email to client
- No payment at this stage — just lead capture

### Phase B — Calendar availability
- Marla can block/open dates via a simple admin view
- Client selects from available slots during booking
- Stack options: Cal.com (self-hosted or API), or a custom availability table in a DB

### Phase C — Stripe + invoicing
- Client selects service → sees price → pays deposit or full amount via Stripe
- On successful payment: generate PDF invoice, email to client, log in dashboard
- Stripe webhooks confirm payment before booking is confirmed

---

## What's built (Phase 1 + 2 done)

- [x] Black canvas, grain overlay, no white flash
- [x] Fixed transparent nav — wordmark + links
- [x] Cormorant Garamond display type + DM Sans body
- [x] Work index page with 2-column ProjectGrid
- [x] LCP-safe HeroImage with black overlay
- [x] Lenis smooth scroll + GSAP ScrollTrigger integration
- [x] Staggered card reveal animations on scroll
- [x] Hero parallax (0.8× scroll rate)
- [x] LookbookStrip component (horizontal scroll)

---

## What still needs building

### Phase 3 — Project pages + route transitions
- Individual project page at `/work/[slug]`
- Full-bleed hero (100vw × 100vh, no chrome) on project open
- Sparse metadata: name, year, category in small uppercase
- Horizontal image strip for supporting photos
- Route transitions — black overlay fade, min 400ms
- Clicking a project card: full-screen takeover, then page reveals (black overlay wipe is preferred over GSAP Flip — safer with App Router)

### Phase 4 — Cursor + micro-interactions
- Custom cursor: 8px dot, expands + shows "VIEW" on image hover
- Cursor hidden on mobile/touch
- Nav hide on scroll-down / show on scroll-up
- Nav link hover: opacity 0.4 → 1.0 only, no fills or underlines

### Phase 5 — Remaining pages + mobile
- `/` (home) — Psalm 139:14 full-width display type + artist statement prose
- `/about` — editorial portrait placeholder + bio prose
- `/services` — prose intro + package list (see Site copy above)
- `/contact` — booking form + Instagram + "New York"
- Mobile nav: hamburger → full-screen black overlay with large-type nav items
- Project grid: single column on mobile
- Branded loading screen: black, "MARLA McLEOD" fades in → holds → fades out

### Phase 6 — Booking + payments (see Booking system section)

---

## GSAP rules

- All ScrollTrigger instances must use `gsap.context()` and `ctx.revert()` — no cleanup = ghost animations on route change
- GSAP ticker callback must be stored as a named reference for correct cleanup with `gsap.ticker.remove()`
- Tailwind v4: no `tailwind.config.js`, theme vars go in `@theme inline {}` block in globals.css
- `window.matchMedia` must be mocked in vitest setup — GSAP ScrollTrigger calls it at module register time
