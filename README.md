# Astara Intelligence · In Depth #94 — Hydrogen in transport in 2026

Fewer stations, up to €19 a kilo and bets that are narrowing. Cars, trucks, buses and stations; EN | ES.

- `index_94.html` — the published page (self-contained apart from `deploy/`). `index.html` is an identical copy written by the build.
- `deploy/` — logo and the cover photo. The cover is still the #93 photo (`img/hero93-*.webp`): to be replaced. `d3.v7.min.js`, `flags/`, `countries-110m.js` and `topojson-client.min.js` are left over from #92/#93 and are not used by #94.
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
