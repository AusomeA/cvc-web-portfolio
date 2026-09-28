# Summit Ridge Plumbing & Heating (concept portfolio site)

A fictional 24/7 plumbing & heating company serving Loveland and Fort Collins, Colorado, built as a lead-generation
landing page: hero with click-to-call, priced services grid, a free-quote form, service-area map, trust badges,
sample reviews, and an FAQ, all backed by inline SVG illustration (no photos, no external assets).

Concept site by Barbed Wire Glove Games LLC — fictional business, portfolio sample.

## Palette
- Navy `#0A2647` (primary / headings / dark sections)
- Navy dark `#061A33` (footer / gradients)
- Safety orange `#FF6600` (accent, badges, icon fills)
- Deep orange `#B84A00` (CTA buttons, links — tuned for 4.5:1+ contrast with white text)
- Ice `#F4F7FB` (alternating section background)

## Fonts
- "Archivo Black" — display headings (Google Fonts)
- "Barlow" (400/500/600/700/800) — body copy and UI (Google Fonts)

## Sections
1. Sticky header — logo mark, nav, click-to-call
2. Hero — 24/7 emergency badge, H1, dual CTAs (call / free quote), trust strip, inline-SVG house illustration
3. Services grid — 8 services with inline SVG icons and starting prices
4. Get a Free Quote form — name, phone, service, message; JS-validated, demo-only submit with inline success message
5. Service area — town list + stylized inline-SVG map (Loveland, Fort Collins, Windsor, Berthoud, Timnath)
6. Trust badges — licensed & insured, upfront pricing, satisfaction guarantee (marked sample)
7. Reviews — 3 sample testimonials, clearly marked "(sample)"
8. FAQ — 5 questions using native `<details>`/`<summary>` accordion
9. CTA banner — final call/quote push
10. Footer — contact, hours, sitemap links, license line (sample), required concept-site line
11. Sticky mobile call bar — fixed Call Now / Free Quote buttons, hidden ≥760px

## Notes / shortcuts
- All contact details (phone, address, email, license #) are fabricated per the brief (555 number, "123 Example St").
- Form is demo-only: validates client-side, calls `preventDefault()`, shows "Thanks! (Demo site: nothing was sent.)", never transmits data.
- `meta name="robots" content="noindex, nofollow"` added since this is a non-published portfolio sample, not a live business.
