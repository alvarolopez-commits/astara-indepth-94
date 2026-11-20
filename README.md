# Astara Intelligence · In Depth #94 — Hydrogen in transport in 2026

Fewer stations, up to €19 a kilo and bets that are narrowing. Cars, trucks, buses and stations; EN | ES.

- `index_94.html` — the published page (self-contained apart from `deploy/`). `index.html` is an identical copy written by the build.
- `deploy/` — logo and the cover photo. The cover photo is `img/hero94-*.webp`, graded from the supplied banner by `_build/make_hero94.py` (source: `DATA/hero94_source.png`, not tracked). `d3.v7.min.js`, `flags/`, `countries-110m.js` and `topojson-client.min.js` are left over from #92/#93 and are not used by #94.
- `DATA/` — the editor's docx (text) and Excel (chart data). Not published.
- `_build/` — sources to regenerate the page. Run from this folder:

```bash
python -X utf8 _build/docx_paras94.py DATA/Hydrogen_Transport_InDepth_Content.docx _build/paras94.json
python -X utf8 _build/prep_data94.py DATA/Hydrogen_Transport_InDepth_Data.xlsx _build/data94.json
python -X utf8 _build/build94.py _build .
```

`paras94.json` and `data94.json` are kept, so the last command alone rebuilds the page. Same pipeline and checks as #93 (see `#93/_build/README.md`):
text by stable key in `_build/i18n/en.json` and `es.json`; `doc.*` (docx blocks), `tbl.*` (docx tables) and `xl.*` (Excel labels) take their English from the sources and their Spanish from `es.json`.
The build stops if a key, a docx block or a heading is missing or altered, or if the docx key figures disagree with the Excel.

Editorial edits applied on top of the docx (all in `build94.py`):
- `[EXT: ...]` and `[DB + EXT: ...]` source tags removed from the running text (sources go to captions and the Sources list).
- "How to read": the "Marks" bullet is rewritten for readers (it described the editor's [EXT]/[DB] marks, Appendix B and the Excel); the sentence about Appendix C is removed from "Selection rule".
- Not published: the designer's opening note, the visual notes, Appendix A and Appendix C, the "Excel facts" column of "Who is who", the AllMoving line of Appendix B. A source listed twice (same URL) appears once (27 sources).

Spanish number style: 4-digit numbers without a separator (RAE), 5+ digits with a dot, decimal comma, "%" and "€" after the number.

Tests: `python -X utf8 -m unittest discover -s tests -v` and `node tests/e2e_i18n.mjs` (headless Chrome at 360, 390, 430 and 1280 px).

## Design system 1.1 (BRAND/SISTEMA 01/UX.UI) — what #94 takes from it
Light-touch interaction layer; the look is unchanged. IDs refer to the manual (C = component contract, DS = decision).
- **Orientation (C01, "¿dónde estoy? ¿cómo vuelvo?"):** a sticky section strip under the cover (`#snav`) marks the current section (`aria-current` + underline), scrolls itself on phones, and carries a second EN | ES switch so the language can be changed anywhere. Skip link to `<main>`; `<nav>` and `<main>` landmarks; `scroll-padding-top` so anchors are not hidden under the bar.
- **Tabular alternative (C07, DS-08/12):** every numeric chart (V02, V03, V04, V07, V09) has a collapsed "Show the data as a table" with caption, units, `scope` headers and a dash legend. Charts already keep text, hatching or shape beside colour; the timeline and lanes are text lists.
- **Keeps the reader's place (DS-06):** changing language keeps the paragraph or figure at the reading line, and an open data table stays open.
- **Targets and motion (DS-07/10):** controls are 44 px on touch; `prefers-reduced-motion` already switches reveal animations and smooth scrolling off; `overflow-x: clip` (not `hidden`) on `html` and `body` so `position: sticky` works.
- Not claimed: WCAG conformance, screen-reader audit, contrast of every pair, user testing. The browser checks only cover keyboard-independent behaviour, overflow, text size and language.

## Colour (BRAND/SISTEMA 01/COLOR — Color Intelligence Engine)
The colours of the charts are decided by the engine, not picked by hand. Order of work: variable → role → family → palette → checks → record.
```bash
node _build/color_decisions94.js          # engine + Scientific Colour Maps → _build/color94.json and _build/COLOR_DECISIONS.md
python -X utf8 _build/build94.py _build . # injects the tokens into the page (the build stops if an old colour token is still used)
```
- **Roles (COL-04):** data categorical (subject: cars · stations · price · trucks · buses; region: AP · EMEA · Americas; kind of milestone: exit · bet), data diverging with a declared centre of 0 (sign of a change), semantic UI (status), neutral (base bar, target marker, dates), brand (`--accent`, links and navigation; kept apart from data).
- **One palette per variable** so two variables never share a colour (`batlowS`, `naviaS`, `hawaiiS`); the diverging palette for change is `managua`.
- **Chart Intelligence 1.0 (BRAND/SISTEMA 01/COLOR/CHARTS), applied:** a categorical mark is *adjusted* (OKLab lightness raised, hue kept) until it reaches 3.1:1 on the three surfaces it sits on, and the original and the adjusted HEX are both recorded (CH-05) — the engine’s lists include very dark colours made for light backgrounds (e.g. batlowS `#011959`), which would otherwise be unusable or skipped. The dark pair for deviations named by the study (`berlin`) was tried first; its pale ends are too close to a status colour and to a category on this page, or fall below 4.5:1 on a chip, so the engine’s own choice (`managua`) stays and the record says why. Panel D of the cars figure is the study’s “Desviación” chart: bars around a declared, drawn zero, signs written, colour only gives the sign.
- Data colours are for marks and large numbers (3.1:1); small text (dates, labels, formulas) uses a text colour. Coloured text that does appear (change chips, status chips) reaches 4.5:1, measured in the record.
- **Not colour alone (COL-07):** values and names are written; hatching marks a state of the same variable (commercial figure, threshold, approved or planned, out of service); the timeline also changes the marker shape.
- No chart colours a continuous value, so no sequential scale is needed; missing data is a dash or ND, never a zero (COL-02).
- Vendored in `_build/vendor/`: `color-engine.js`, `scm9-catalog.js` and `SCM9-LICENSE.txt` (Scientific Colour Maps 9.0, Fabio Crameri, MIT; credit in the page footer). Tests: `tests/test_color_tokens.py`.
- Not validated: colour-vision simulation, print, and reading tests with people (listed in `COLOR_DECISIONS.md`).
