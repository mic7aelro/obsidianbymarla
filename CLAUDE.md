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

---

## What's built

- [x] Black canvas, grain overlay, no white flash
- [x] Fixed transparent nav — wordmark + links, gradient scrim for legibility
- [x] Cormorant Garamond display type + DM Sans body
- [x] Work index page with 2-column ProjectGrid
- [x] LCP-safe HeroImage with black overlay
- [x] Lenis smooth scroll + GSAP ScrollTrigger integration
- [x] Staggered card reveal animations on scroll
- [x] Hero parallax (0.8× scroll rate)
- [x] LookbookStrip component (horizontal scroll)
- [x] Individual project pages at `/work/[slug]` — full-bleed hero + 4-column gallery grid (landscape images span 2 cols), `ProjectImage` type with explicit dimensions
- [x] Services page — sticky/scroll split layout (identity left, service list right scrollable)
- [x] Contact page — two-column editorial split (headline + location left, booking form right)

---

## What still needs building

### Phase 4 — Cursor + micro-interactions
- Custom cursor: 8px dot, expands + shows "VIEW" on image hover
- Cursor hidden on mobile/touch
- [x] Nav hide on scroll-down / show on scroll-up
- Nav link hover: opacity 0.4 → 1.0 only, no fills or underlines

### Phase 5 — Remaining pages + mobile
- [x] `/` (home) — Psalm quote + artist statement, two-column with portrait photo (placeholder at `public/images/marla-pfp.jpg`)
- `/about` — editorial portrait placeholder + bio prose
- Mobile nav: hamburger → full-screen black overlay with large-type nav items
- Project grid: single column on mobile
- Branded loading screen: black, "MARLA McLEOD" fades in → holds → fades out
- [x] `/services` — sticky/scroll split layout
- [x] `/contact` — two-column editorial split, booking form

### Phase 6 — Booking system

**Stack:** MongoDB Atlas (free tier) + Vercel + Cal.com (hosted at cal.com/marlizzlle) + out-of-band payment (Venmo/Zelle/bank transfer). Stripe slots in later at the deposit step without touching anything else.

**Full flow:**
Inquiry submitted → Marla notified → Admin reviews → Creates event → Invoice emailed (with payment instructions) → Marla manually marks deposit paid → Event confirmed

#### Phase 6A — Inquiry capture
- Contact form submits to MongoDB
- Email notification to Marla on new inquiry (use Resend or Nodemailer)
- Confirmation email to client

#### Phase 6B — Cal.com consultation booking
- Embed Cal.com widget on the contact page for initial consultation slot picking
- Cal.com handles availability; Marla manages her calendar on cal.com dashboard
- Use hosted cal.com/marlizzlle — zero infra, can style embed to match aesthetic

#### Phase 6C — Admin portal (`/admin`)
- Auth: simple session-based, hardcoded credentials (no OAuth needed at this scale)
- **Inquiries tab** — all submissions with status badge: `pending → reviewed → awaiting deposit → confirmed → completed`
- **"Create event" button** on each inquiry → moves to Events tab
- **Events tab** — date, client, service, deposit status
- **"Mark deposit paid" button** → status flips to confirmed
- **"Send invoice" button** → emails invoice with payment instructions (plain styled email or PDF via `@react-pdf/renderer`)

#### Phase 6D — Stripe (future)
- Replace "Mark deposit paid" manual step with Stripe payment link
- Webhook auto-confirms on successful payment
- Deposit amount = 10% of service price

---

## GSAP rules

- All ScrollTrigger instances must use `gsap.context()` and `ctx.revert()` — no cleanup = ghost animations on route change
- GSAP ticker callback must be stored as a named reference for correct cleanup with `gsap.ticker.remove()`
- Tailwind v4: no `tailwind.config.js`, theme vars go in `@theme inline {}` block in globals.css
- `window.matchMedia` must be mocked in vitest setup — GSAP ScrollTrigger calls it at module register time
