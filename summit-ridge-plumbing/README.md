# Summit Ridge Plumbing & Heating (concept site, v2)

A one-page site for a fictional residential plumbing and heating company in Loveland and Fort Collins, Colorado, built around a "What's going on?" tool that turns a fixture and a symptom into a filled-in service ticket: likely cause, usual price, how urgent it is, what to do before the truck arrives, and one next step. It's styled like the company's truck and paperwork (spruce door panel, hot and cold PEX stripe, canary work-order copy) and is readable at a glance on a phone mid-emergency.

Concept site by Barbed Wire Glove Games LLC - fictional business, portfolio sample.

## Palette
| Name | Hex | Use |
|---|---|---|
| Spruce livery | `#163F3A` | Hero panel, headings, book buttons, footer (`#0F2E2A`) |
| Hot line red | `#C4291F` | Only "call now": phone buttons, urgent tickets |
| Cold line blue | `#1C5AA3` | "Can wait" urgency, edge-of-area, focus rings |
| Ticket canary | `#FCEFA8` | The diagnosis ticket and the booking carry-over note |
| Galvanized | `#E5E9E6` | Panel backgrounds |
| Ink / muted | `#1C2A27` / `#51605B` | Text |

## Fonts
- Mona Sans (variable, wdth 75-125, wght 400-900), self-hosted woff2 in `fonts/`. Expanded heavy for the livery
  display type (headlines, prices, phone numbers), normal width for text, semi-condensed for ticket field labels.

## Sections
1. Sticky header with the 24/7 emergency number (menu button below 1080px)
2. Hero: spruce panel, headline, call and diagnose buttons, live office-open status from the visitor's clock, photo, hot/cold stripe that draws in on load
3. What's going on? (signature): six fixtures, 24 symptoms, a canary service ticket with cause, price range, a three-step urgency scale and next step; urgent picks turn the ticket red with the phone number at display size; gas smell tells people to get out first; "Book" carries the problem into the booking form
4. What it usually costs: rate sheet with dotted leaders and a weekday / after-hours toggle (+$95 flat, weekday-only jobs marked)
5. How a visit goes: four real steps beside a crawlspace photo
6. Do we cover your place?: town or ZIP check with covered / edge / outside answers and a schematic route map that highlights the match
7. Before the first hard freeze: seasonal winterizing offer
8. Reviews (three samples, initials only)
9. Book a visit: validated demo form, inline confirmation, nothing sent
10. Footer with the concept-site line; sticky Call / Book bar on phones, tucked away while the hero buttons are visible

## Libraries
None. Plain HTML, CSS and vanilla JS (about 30 KB unminified). Motion is CSS keyframes and transitions; everything
respects `prefers-reduced-motion`.

## Files
`index.html`, `css/site.css`, `js/site.js`, `fonts/`, `img/` (WebP, plus `og-image.jpg` for link previews),
`DESIGN.md` (plan and critique notes), `CREDITS.md` (photo sources).
