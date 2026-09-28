# Juniper & Rye Bakehouse (concept site, v2)

A one-page site for a fictional sourdough bakery in Fort Collins, built around the bake room's own
timetable: the hero is today's oven schedule, driven by the visitor's clock, answering "when should I come
in?". Photography-led, with a custom-cake builder that draws a live cross-section of the cake and prices it.

**Palette:** oven steel `#2A2F33`, flour `#ECECE8`, kraft `#C9A77E`, rye `#33241C` (text),
juniper `#3D4A6E` with bloom `#A9B5D3`, ember `#E8A23A` (used only for "in the oven").

**Fonts:** Big Shoulders (condensed signage face: wordmark, headings, times, prices) and Literata
(reading serif: body, menu, forms). Both self-hosted woff2, latin subset.

**Sections:**
1. Sign: the name as a shopfront sign, nav, phone.
2. Today's oven (signature): the day's bakes with live statuses (in the oven with a progress bar, next,
   on the shelf, going fast, usually gone) and a needle at the current time. The sentence above says what
   comes out next and what is on the shelf. Drag the needle (mouse or touch), click a row, or focus it and
   use the arrow keys, Page Up/Down, Home/End to plan an arrival time; "Back to now" resets it. After
   closing and on Mondays it switches to the next open day, parked at opening time. Tue-Fri, Saturday and
   Sunday have different schedules.
3. Menu: price list that says when each item comes out of the oven, with a sticky crumb photo.
4. Story: the two bakers, three process photos, one sample review.
5. Custom cakes: size, sponge, filling and finish redraw an SVG cross-section and update the price and
   the earliest pickup date (3 days, 14 for two tiers, never a Monday); then a demo request form with
   inline validation. Nothing is sent.
6. Visit: address, phone, hours with today marked, FAQ.
7. Footer with the concept-site line; a sticky call / order-a-cake bar on phones.

**Libraries:** GSAP 3 core only (the load sweep of the needle, cake-drawing tweens and the price
count). No frameworks, no build step.

**Demo tip:** add `?day=2&time=08:12` (day 0 = Sunday) to the URL to show any moment of the week.

Fictional business: the address, phone number, people and review are invented for a portfolio sample.
Photo credits are in CREDITS.md; the design plan is in DESIGN.md.
