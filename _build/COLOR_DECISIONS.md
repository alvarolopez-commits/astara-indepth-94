# Colour decisions · In Depth #94

Made with the Color Intelligence Engine 0.1.0 (Design System 1.1) and Scientific Colour Maps 9.0.0 (MIT © 2026 Fabio Crameri; Crameri, F. (2018), Scientific colour maps, Zenodo, https://doi.org/10.5281/zenodo.1243862).
Regenerate with `node _build/color_decisions94.js`, then `python -X utf8 _build/build94.py _build .`.

The engine is a heuristic recommender, **not** a WCAG or colour-vision certificate. What was measured is listed; what is pending is said.

Surfaces the marks sit on: card #292A4E · page #221E41 · alt #20274C. Marks must reach 3:1, text 4.5:1.

## Roles (COL-04)

| Role | What it codes | Tokens |
|---|---|---|
| Data · categorical | which subject / region / kind of milestone | `--c-cars` … `--c-buses`, `--c-ap` `--c-emea` `--c-am`, `--c-exit` `--c-bet` |
| Data · diverging (centre 0) | sign of a change on a year earlier | `--c-up`, `--c-down` |
| Semantic UI | status, always with text and a shape or pattern | `--s-success` `--s-warning` `--s-danger` `--s-info` `--s-neutral` |
| Neutral | hierarchy without meaning (base bar, target marker, dates) | `--n-series`, `--n-missing` |
| Brand / interaction | links, current section, language switch, accent of the Astara template | `--accent` (not an engine output: the template’s own colour, kept apart from data) |

No chart maps a continuous value to colour: magnitudes are lengths, so there is no sequential scale to choose. Missing data is a dash or ND with an explanation, never a zero (COL-02).

## COL-DATA-SUBJECT

**Question:** Which subject (cars, stations, price, trucks, buses) does a figure, tile or card belong to?

- Variable: subject (nominal) · nominal, no order
- Used in: key-figure tiles, V02, V04, V05, V07, V09, chapter accents
- Family: **categorical** · palette: **batlowS**
- Colours: cars `#FACCFA` · stations `#818232` · price `#F19D6B` · trucks `#BE9035` · buses `#FDB4B4`
- Contrast (card / page / alt): cars 9.82 / 11.34 / 10.36 · stations 3.37 / 3.89 / 3.55 · price 6.37 / 7.35 / 6.71 · trucks 4.71 / 5.44 / 4.97 · buses 8.05 / 9.3 / 8.49
- Smallest distance between two colours (OKLab): 0.095
- Engine ranking: batlowS 0.799, hawaiiS 0.779, batlowWS 0.738, naviaS 0.715
- Our rule on top: Catalogue reduced to the colours that reach 3:1 on all three surfaces (card #292A4E, page #221E41, alt #20274C); 3 colour(s) of batlowS skipped before reaching 5: #011959 #215F61 #4C724D.
- Why: Variables nominales sin orden natural → colores cualitativos, no un gradiente. Campo continuo o densidad variable → paleta continua. Se preservan los colores de SCM9; se extraen muestras sin modificar sus tonos originales.
- Not colour alone (COL-07): Every category is also named in the chart (row label, legend or key); patterns mark states of the same variable.
- Status: proposed — pending visual validation with real users, colour-vision simulation and print

## COL-DATA-REGION

**Question:** Which world region holds a share of the stations?

- Variable: region (nominal) · nominal, no order
- Used in: V03
- Family: **categorical** · palette: **naviaS**
- Colours: ap `#FCF4D9` · emea `#408A80` · am `#87C269`
- Contrast (card / page / alt): ap 12.43 / 14.35 / 13.11 · emea 3.36 / 3.88 / 3.55 · am 6.48 / 7.48 / 6.83
- Smallest distance between two colours (OKLab): 0.197
- Engine ranking: naviaS 1.084, lapazS 1.016, actonS 1, batlowWS 1
- Our rule on top: Catalogue reduced to the colours that reach 3:1 on all three surfaces (card #292A4E, page #221E41, alt #20274C); 1 colour(s) of naviaS skipped before reaching 3: #031327.
- Why: Variables nominales sin orden natural → colores cualitativos, no un gradiente. Campo continuo o densidad variable → paleta continua. Se preservan los colores de SCM9; se extraen muestras sin modificar sus tonos originales.
- Not colour alone (COL-07): Every category is also named in the chart (row label, legend or key); patterns mark states of the same variable.
- Status: proposed — pending visual validation with real users, colour-vision simulation and print

## COL-DATA-LANE

**Question:** Is a milestone an exit or a bet?

- Variable: kind of milestone (nominal) · nominal, no order
- Used in: V08
- Family: **categorical** · palette: **hawaiiS**
- Colours: exit `#AEE6FC` · bet `#B0952D`
- Contrast (card / page / alt): exit 10.11 / 11.67 / 10.66 · bet 4.68 / 5.4 / 4.93
- Smallest distance between two colours (OKLab): 0.277
- Engine ranking: hawaiiS 1.108, glasgowS 1.096, lapazS 1.072, actonS 1
- Our rule on top: Catalogue reduced to the colours that reach 3:1 on all three surfaces (card #292A4E, page #221E41, alt #20274C); 1 colour(s) of hawaiiS skipped before reaching 2: #8A0079.
- Why: Variables nominales sin orden natural → colores cualitativos, no un gradiente. Campo continuo o densidad variable → paleta continua. Se preservan los colores de SCM9; se extraen muestras sin modificar sus tonos originales.
- Not colour alone (COL-07): Every category is also named in the chart (row label, legend or key); patterns mark states of the same variable.
- Status: proposed — pending visual validation with real users, colour-vision simulation and print

## COL-SEM-STATUS

**Question:** What is the state of a milestone or a claim?

- Variable: status (done · pending · plan · not confirmed · out of service)
- Used in: V06 timeline and legend, status chips, “not confirmed” chip, out-of-service stations
- Family: **semantic** · palette: **semantic-dark**
- Colours: success `#6DE3B0` · warning `#FFD488` · danger `#FFA29B` · info `#A9C1FF` · neutral `#BFC7D7`
- Contrast (card / page / alt): success 8.64 / 9.97 / 9.11 · warning 9.79 / 11.3 / 10.32 · danger 7.09 / 8.19 / 7.48 · info 7.66 / 8.84 / 8.08 · neutral 8.05 / 9.3 / 8.49
- Mapping: done → success · pending → warning · plan → neutral · not confirmed → warning · out of service → danger · own calculation → info
- Why: Color reservado a estados de interfaz y siempre acompañado de texto/icono; el dato cuantitativo no determina el tono.
- Not colour alone (COL-07): Text on every chip; marker shape in the timeline (filled · ring · dashed ring); hatching for the out-of-service stations.
- Status: proposed — pending visual validation

## COL-NEU-SERIES

**Question:** Which marks need hierarchy but no meaning?

- Variable: none (comparison base, target marker, dates)
- Used in: first-half 2025 base bar (V02 C), target markers (V05, V09), “when” labels in What to watch
- Family: **neutral** · palette: **neutral-dark**
- Colours: series `#B8C4D7` · missing `#666F7D`
- Contrast (card / page / alt): series 7.76 / 8.96 / 8.18
- Why: Un único tono neutro basta: el color no necesita codificar categorías ni magnitudes.
- Status: proposed

## COL-DATA-CHANGE

**Question:** Did the figure rise or fall against the same period a year earlier?

- Variable: change on a year earlier (signed %) · ordered with a declared centre: 0 = no change · centre 0
- Used in: change chips (V02, V09), price cuts (V05)
- Family: **diverging** · palette: **managua**
- Colours: down `#EFB55E` · up `#78CDF0`
- Contrast (card / page / alt): down 7.45 / 8.6 / 7.86 · up 7.68 / 8.86 / 8.1
- Our rule on top: Engine first choice kept.
- Sampled at: values −90 and +90 of a −100…+100 domain (5 % from each end); the size of the change is written in the chip, colour only gives the sign
- Why: Referencia central semántica conocida → escala divergente. Selección manual explícita: managua. Campo continuo o densidad variable → paleta continua. Se preservan los colores de SCM9; se extraen muestras sin modificar sus tonos originales. Centre 0 is declared by the editor (no change): COL-03.
- Not colour alone (COL-07): The sign is written (+/−) and the size is a number; colour is never the only channel. No “green is good / red is bad”: a fall in sales and a fall in a price are not the same thing.
- Status: proposed — pending visual validation

## COL-CHECK-TEXT

**Question:** Does coloured text reach 4.5:1 on its chip and on the three surfaces?


| Text / chip | colour | tint | worst contrast | ≥ 4.5 |
|---|---|---|---|---|
| change chip up | `#78CDF0` | 0.14 | 5.64 | yes |
| change chip down | `#EFB55E` | 0.14 | 5.62 | yes |
| status chip done | `#6DE3B0` | 0.15 | 6.1 | yes |
| status chip pending | `#FFD488` | — | 9.79 | yes |
| status chip “own calculation” | `#A9C1FF` | 0.15 | 5.46 | yes |
| postponed / plan highlight | `#FFD488` | 0.07 | 8.27 | yes |
| not confirmed chip | `#FFD488` | — | 9.79 | yes |
- Status: measured: all pass

## Still to validate

- Colour-vision simulation and a print proof (COL-11); the engine does not test them.
- A read-out with real readers: can they tell the categories apart at the sizes used?
- The Astara template accent (`--accent`) against these data colours, side by side, on a phone in daylight.
