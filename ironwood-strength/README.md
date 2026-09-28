# Ironwood Strength Co. (concept site)

A one-page site for a fictional barbell gym in Greeley, Colorado, built as an Upwork portfolio sample.
Its signature is a working plate loader: type a weight and the competition-colored plates slide onto a
to-scale bar resting on a lifting platform, with the per-side list and warm-up jumps worked out for you.

**Palette** (materials, see DESIGN.md): chalk `#ECEDE9`, chalk bright `#F8F8F6`, graphite `#1C2325`,
rubber `#152A2D`, platform wood `#C9A46C`, and the plate colors, used only as information: red `#D0262D`,
blue `#1F5BB0`, yellow `#F1C232`, green `#277D43`, white `#F2F2EF`, steel `#A7AFB3`.

**Fonts:** Archivo variable (self-hosted, latin subset), using its width axis: extra condensed for
headlines, normal width for text, expanded for small labels.

**Sections:** header with phone and booking button; hero (headline, photo, live "next class" line)
joined to the plate loader platform; what we coach (six classes, color-keyed to the schedule); this
week's classes (filters by class, time of day and beginner-friendly, day tabs on phones, live "next up"
in Mountain Time, every session books into the form); membership price board; coaches; free-class
section with the first-visit steps, member quotes and the demo booking form; questions; visit with a
live open/closed line and hours; footer; sticky call/book bar on phones.

**Libraries:** GSAP 3.15 core only (`vendor/gsap.min.js`, used for the plate, collar and bar
animations). No framework, no build step. The page works without GSAP (plates just appear) and
respects `prefers-reduced-motion`.

**Files:** `index.html`, `css/site.css`, `js/site.js`, `vendor/`, `fonts/`, `img/` (WebP),
`DESIGN.md` (design plan), `CREDITS.md`, `shots/` (QA screenshots).
