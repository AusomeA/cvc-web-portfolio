# Skip Stop Pictures (concept site)

A two-page site (homepage and shop) for a fictional film and television production company in Long Island City,
Queens, built as an Upwork portfolio sample. Its signature is a trailer-first homepage that opens like a film: a
letterboxed still, the title card and a Play trailer button, with a reel in the letterbox bar that cuts between the
studio's four films and carries the poster, synopsis, credits and "where to watch" below along with it.

**Palette:** projection black `#000000` (letterbox, lightbox, contact, footer), silver screen `#ECEEEC` (page),
ink `#17191B`, concrete `#C9CDCB`, and one deep color per film for the featured block (The Last Local: platform
teal `#0D2A31` with platform-edge yellow `#F2C230`; Delancey After Midnight `#1C1430` / `#FF9E4A`; Fire Escape Summer
`#4A1D14` / `#FFE2A0`; Water Towers `#2B373D` / `#D8C3A0`).

**Fonts:** Sofia Sans Extra Condensed (titles, wordmark, billing block) and Libre Franklin (text), self-hosted.

**Sections:** black nav with the cart; opening titles (still, title card, trailer button, film reel); films as
one-sheet posters; featured film (poster, synopsis, credits, where to watch, trailer); merch with sizes and
Add to cart; about; press kit with poster and still downloads; contact form (demo) and details; footer. The shop page
has filters, five products and the same cart drawer (add, quantity, remove, subtotal, kept in localStorage).
The trailer opens in a lightbox with a short Academy-leader count; it is a sample, so no video plays.

**Libraries:** none. Plain HTML, CSS and vanilla JS, no build step. Respects `prefers-reduced-motion`.

**Files:** `index.html`, `shop.html`, `css/site.css`, `js/site.js`, `js/cart.js`, `fonts/`, `img/` (WebP),
`CREDITS.md`. Local only (not committed): `DESIGN.md`, `shots/`, `src/` (poster and merch generators).
