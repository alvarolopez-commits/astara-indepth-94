'use strict';
/* Colour decisions for In Depth #94, made with the Color Intelligence Engine (Design System 1.1, BRAND/SISTEMA 01/COLOR).
   Run from the project folder:   node _build/color_decisions94.js
   Reads the surfaces from style94.css, asks vendor/color-engine.js (palettes: Scientific Colour Maps 9.0, F. Crameri, MIT) for a recommendation per
   variable, applies one rule of our own on top (a mark must reach 3:1 on every surface it sits on, WCAG 1.4.11), and writes
     _build/color94.json      tokens, the CSS block the build injects, and one auditable decision per variable (COL-10)
     _build/COLOR_DECISIONS.md the same decisions, readable
   Nothing here certifies WCAG or colour-vision accessibility: the engine says so, and so do the notes of every decision. */
const fs = require('fs'), path = require('path');
const HERE = __dirname, V = path.join(HERE, 'vendor');
const CAT = new Function(fs.readFileSync(path.join(V, 'scm9-catalog.js'), 'utf8') + ';return SCM9Catalog;')();
const CE = require(path.join(V, 'color-engine.js'));

/* ---- the surfaces that data marks sit on, read from the stylesheet ---- */
const css = fs.readFileSync(path.join(HERE, 'style94.css'), 'utf8');
const tok = n => { const m = css.match(new RegExp('--' + n + ':\\s*(#[0-9A-Fa-f]{6})')); if (!m) throw Error('token not found: ' + n); return m[1].toUpperCase(); };
const SURF = { card: tok('bg-card'), page: tok('bg'), alt: tok('bg-alt') };   // figure frame · cards and tiles inside it · alternate sections
const MARK_MIN = 3, TEXT_MIN = 4.5;                                            // WCAG 2.2: 1.4.11 non-text contrast, 1.4.3 text contrast
const NEAR = 0.065;                                                             // the engine’s own “colours too close” threshold (OKLab distance)
const ratio = (c, bg) => CE.contrast(c, bg);
const worst = c => Math.min(...Object.values(SURF).map(s => ratio(c, s)));
const r2 = x => +x.toFixed(2);
const contrastRow = c => Object.fromEntries(Object.entries(SURF).map(([k, s]) => [k, r2(ratio(c, s))]));
const dist = (a, b) => Math.hypot(...CE.oklab(a).map((v, i) => v - CE.oklab(b)[i]));
const minPair = cols => { let m = 9; for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) m = Math.min(m, dist(cols[i], cols[j])); return cols.length > 1 ? +m.toFixed(3) : null; };
const blend = (fg, bg, a) => '#' + [0, 2, 4].map(i => Math.round(parseInt(fg.slice(1 + i, 3 + i), 16) * a + parseInt(bg.slice(1 + i, 3 + i), 16) * (1 - a)).toString(16).padStart(2, '0')).join('').toUpperCase();
const generic = w => /exclusivamente mediante color/.test(w);

const decisions = [], T = {};

/* ---- 1. DATA · categorical: three nominal variables, each with its own palette so that two variables never share a colour ---- */
const POOL = {};   // categorical lists reduced to the colours that reach 3:1 on every surface (order kept)
for (const k of Object.keys(CAT.categorical)) POOL[k] = CAT.categorical[k].filter(c => worst(c) >= MARK_MIN);

function categorical(id, question, variable, domain, used) {
  const spec = { role: 'data', categories: domain, categoryDomain: domain, theme: 'dark', surface: SURF.card, form: 'bar' };
  const r = CE.recommend(spec, { ...CAT, categorical: POOL });
  let kept = 0; const skipped = [];
  for (const c of CAT.categorical[r.paletteId]) { if (kept === domain.length) break; if (worst(c) >= MARK_MIN) kept++; else skipped.push(c); }
  const colors = Object.fromEntries(domain.map((d, i) => [d, r.colors[i]]));
  for (const d of domain) T['c-' + d] = colors[d];
  delete POOL[r.paletteId];   // the next variable gets another palette
  decisions.push({
    id, role: 'data', family: r.family, question, variable, type: 'nominal, no order', categoryDomain: domain, usedIn: used,
    paletteId: r.paletteId, candidates: r.candidates, colors, contrast: Object.fromEntries(domain.map(d => [d, contrastRow(colors[d])])),
    minPairDistanceOKLab: minPair(r.colors),
    reasons: r.reasons, warnings: r.warnings.filter(w => !generic(w)),
    ownRule: `Catalogue reduced to the colours that reach ${MARK_MIN}:1 on all three surfaces (${Object.entries(SURF).map(([k, v]) => k + ' ' + v).join(', ')}); ${skipped.length} colour(s) of ${r.paletteId} skipped before reaching ${domain.length}: ${skipped.join(' ') || 'none'}.`,
    redundantCoding: 'Every category is also named in the chart (row label, legend or key); patterns mark states of the same variable.',
    status: 'proposed — pending visual validation with real users, colour-vision simulation and print',
    source: r.source, validators: r.validators,
  });
  return colors;
}
categorical('COL-DATA-SUBJECT', 'Which subject (cars, stations, price, trucks, buses) does a figure, tile or card belong to?', 'subject (nominal)',
  ['cars', 'stations', 'price', 'trucks', 'buses'], 'key-figure tiles, V02, V04, V05, V07, V09, chapter accents');
categorical('COL-DATA-REGION', 'Which world region holds a share of the stations?', 'region (nominal)', ['ap', 'emea', 'am'], 'V03');
categorical('COL-DATA-LANE', 'Is a milestone an exit or a bet?', 'kind of milestone (nominal)', ['exit', 'bet'], 'V08');
const DATA_COLORS = Object.values(T);

/* ---- 2. SEMANTIC UI: status, always with text (and a different marker shape in the timeline) ---- */
const sem = CE.recommend({ role: 'semantic', theme: 'dark', surface: SURF.card }, CAT);
for (const [k, c] of Object.entries(sem.colors)) T['s-' + k] = c;
decisions.push({
  id: 'COL-SEM-STATUS', role: 'semantic', family: 'semantic', question: 'What is the state of a milestone or a claim?', variable: 'status (done · pending · plan · not confirmed · out of service)',
  usedIn: 'V06 timeline and legend, status chips, “not confirmed” chip, out-of-service stations',
  paletteId: sem.paletteId, colors: sem.colors, contrast: Object.fromEntries(Object.entries(sem.colors).map(([k, c]) => [k, contrastRow(c)])),
  mapping: { done: 'success', pending: 'warning', plan: 'neutral', 'not confirmed': 'warning', 'out of service': 'danger', 'own calculation': 'info' },
  reasons: sem.reasons, warnings: sem.warnings.filter(w => !generic(w)),
  redundantCoding: 'Text on every chip; marker shape in the timeline (filled · ring · dashed ring); hatching for the out-of-service stations.',
  status: 'proposed — pending visual validation', source: sem.source, validators: sem.validators,
});

/* ---- 3. NEUTRAL: base year, reference lines, dates ---- */
const neu = CE.recommend({ role: 'neutral', theme: 'dark', surface: SURF.card }, CAT);
T['n-series'] = neu.colors[0];
T['n-missing'] = CE.recommend({ role: 'data', intent: 'sequential', values: [0, 1], theme: 'dark', surface: SURF.card }, CAT).noData;
decisions.push({
  id: 'COL-NEU-SERIES', role: 'neutral', family: 'neutral', question: 'Which marks need hierarchy but no meaning?', variable: 'none (comparison base, target marker, dates)',
  usedIn: 'first-half 2025 base bar (V02 C), target markers (V05, V09), “when” labels in What to watch',
  paletteId: neu.paletteId, colors: { series: neu.colors[0], missing: T['n-missing'] }, contrast: { series: contrastRow(neu.colors[0]) },
  reasons: neu.reasons, warnings: neu.warnings, note: 'Missing data is written as a dash or ND with an explanation, never drawn as zero; the missing token exists for any future chart that needs a mark.',
  status: 'proposed', source: neu.source,
});

/* ---- 4. DATA · diverging, centre 0: sign of a change against a year earlier ---- */
const names = CAT.types.diverging;
const ranking = names.map(n => ({ id: n, score: CE.quality(n, 'diverging', 'dark', 'bar', SURF.card, CAT, 0).score })).sort((a, b) => b.score - a.score);
const spec = { role: 'data', center: 0, values: [-100, 0, 100], domain: [-100, 100], theme: 'dark', surface: SURF.card, form: 'bar', sensitivity: 'normal' };
const ends = id => { const g = CAT.palettes[id]; return { down: g[13], up: g[242] }; };            // 5 % from each extreme
const apart = (c, others) => Math.min(...others.map(o => dist(c, o)));
const rejected = []; let chosen = null;
for (const cand of ranking) {
  const e = ends(cand.id), why = [];
  if (Math.min(worst(e.down), worst(e.up)) < TEXT_MIN) why.push('end colours below 4.5:1 for text on a surface');
  const near = apart(e.down, [...DATA_COLORS, ...Object.values(sem.colors)]) < NEAR ? e.down : (apart(e.up, [...DATA_COLORS, ...Object.values(sem.colors)]) < NEAR ? e.up : null);
  if (near) why.push(`end colour ${near} is within ΔE(OKLab) ${NEAR} of a category or status colour`);
  if (why.length) rejected.push({ id: cand.id, score: +cand.score.toFixed(3), why }); else { chosen = cand; break; }
}
if (!chosen) { console.log(JSON.stringify(rejected, null, 1)); throw Error("no diverging palette passes the checks"); }
const dr = CE.recommend({ ...spec, forcePalette: chosen.id }, CAT);
const down = CE.colorFor(dr, -90), up = CE.colorFor(dr, 90);
T['c-down'] = down; T['c-up'] = up;
decisions.push({
  id: 'COL-DATA-CHANGE', role: 'data', family: 'diverging', question: 'Did the figure rise or fall against the same period a year earlier?', variable: 'change on a year earlier (signed %)',
  type: 'ordered with a declared centre: 0 = no change', center: 0, usedIn: 'change chips (V02, V09), price cuts (V05)',
  paletteId: chosen.id, engineFirstChoice: ranking[0].id, rejectedBefore: rejected,
  colors: { down, up }, contrast: { down: contrastRow(down), up: contrastRow(up) }, sampledAt: 'values −90 and +90 of a −100…+100 domain (5 % from each end); the size of the change is written in the chip, colour only gives the sign',
  reasons: [...dr.reasons, 'Centre 0 is declared by the editor (no change): COL-03.'],
  warnings: dr.warnings.filter(w => !generic(w)),
  ownRule: rejected.length ? `Engine ranking: ${ranking.slice(0, 4).map(x => x.id + ' ' + x.score.toFixed(3)).join(', ')}. Palettes before ${chosen.id} were passed over: ${rejected.map(x => x.id + ' (' + x.why.join('; ') + ')').join(' · ')}.` : 'Engine first choice kept.',
  redundantCoding: 'The sign is written (+/−) and the size is a number; colour is never the only channel. No “green is good / red is bad”: a fall in sales and a fall in a price are not the same thing.',
  status: 'proposed — pending visual validation', source: dr.source, validators: dr.validators,
});

/* ---- 5. checks of the text and chips that carry these colours (4.5:1) ---- */
const chips = [
  ['change chip up', T['c-up'], .14], ['change chip down', T['c-down'], .14], ['status chip done', T['s-success'], .15], ['status chip pending', T['s-warning'], 0],
  ['status chip “own calculation”', T['s-info'], .15], ['postponed / plan highlight', T['s-warning'], .07], ['not confirmed chip', T['s-warning'], 0],
].map(([name, c, a]) => ({ name, color: c, tint: a, worstContrast: r2(Math.min(...Object.values(SURF).map(s => ratio(c, a ? blend(c, s, a) : s)))), passes: Math.min(...Object.values(SURF).map(s => ratio(c, a ? blend(c, s, a) : s))) >= TEXT_MIN }));
decisions.push({ id: 'COL-CHECK-TEXT', role: 'check', question: 'Does coloured text reach 4.5:1 on its chip and on the three surfaces?', chips, status: chips.every(c => c.passes) ? 'measured: all pass' : 'measured: some fail — see list' });

/* ---- CSS block ---- */
const hatch = n => `--hatch-${n}:repeating-linear-gradient(135deg,var(--${n === 'danger' ? 's-danger' : 'c-' + n}) 0 3px,color-mix(in srgb,var(--${n === 'danger' ? 's-danger' : 'c-' + n}) 24%,transparent) 3px 7px);`;
const lines = [
  '/* GENERATED by _build/color_decisions94.js from the Color Intelligence Engine (Scientific Colour Maps 9.0, F. Crameri, MIT). Do not edit: see COLOR_DECISIONS.md. */',
  ':root{',
  ...Object.entries(T).map(([k, v]) => `  --${k}:${v};`),
  '  ' + ['cars', 'stations', 'price', 'trucks', 'buses', 'ap', 'emea', 'am', 'exit', 'bet', 'danger'].map(hatch).join('\n  '),
  '}',
];
const out = { version: 1, engine: CE.version, catalog: { version: CAT.version, creator: CAT.creator, license: CAT.license, citation: CAT.citation }, surfaces: SURF, rules: { markMin: MARK_MIN, textMin: TEXT_MIN }, tokens: T, css: lines.join('\n'), decisions };
fs.writeFileSync(path.join(HERE, 'color94.json'), JSON.stringify(out, null, 1), 'utf8');

/* ---- readable record ---- */
const md = [
  '# Colour decisions · In Depth #94', '',
  `Made with the Color Intelligence Engine ${CE.version} (Design System 1.1) and Scientific Colour Maps ${CAT.version} (${CAT.license}; ${CAT.citation}).`,
  'Regenerate with `node _build/color_decisions94.js`, then `python -X utf8 _build/build94.py _build .`.', '',
  'The engine is a heuristic recommender, **not** a WCAG or colour-vision certificate. What was measured is listed; what is pending is said.', '',
  `Surfaces the marks sit on: ${Object.entries(SURF).map(([k, v]) => `${k} ${v}`).join(' · ')}. Marks must reach ${MARK_MIN}:1, text ${TEXT_MIN}:1.`, '',
  '## Roles (COL-04)', '',
  '| Role | What it codes | Tokens |', '|---|---|---|',
  '| Data · categorical | which subject / region / kind of milestone | `--c-cars` … `--c-buses`, `--c-ap` `--c-emea` `--c-am`, `--c-exit` `--c-bet` |',
  '| Data · diverging (centre 0) | sign of a change on a year earlier | `--c-up`, `--c-down` |',
  '| Semantic UI | status, always with text and a shape or pattern | `--s-success` `--s-warning` `--s-danger` `--s-info` `--s-neutral` |',
  '| Neutral | hierarchy without meaning (base bar, target marker, dates) | `--n-series`, `--n-missing` |',
  '| Brand / interaction | links, current section, language switch, accent of the Astara template | `--accent` (not an engine output: the template’s own colour, kept apart from data) |', '',
  'No chart maps a continuous value to colour: magnitudes are lengths, so there is no sequential scale to choose. Missing data is a dash or ND with an explanation, never a zero (COL-02).', '',
];
for (const d of decisions) {
  md.push(`## ${d.id}`, '', `**Question:** ${d.question}`, '');
  if (d.variable) md.push(`- Variable: ${d.variable}${d.type ? ' · ' + d.type : ''}${d.center !== undefined ? ' · centre ' + d.center : ''}`);
  if (d.usedIn) md.push(`- Used in: ${d.usedIn}`);
  if (d.family && d.role !== 'check') md.push(`- Family: **${d.family}** · palette: **${d.paletteId}**${d.engineFirstChoice && d.engineFirstChoice !== d.paletteId ? ` (engine’s first choice was ${d.engineFirstChoice})` : ''}`);
  if (d.colors) md.push(`- Colours: ${Object.entries(d.colors).map(([k, v]) => `${k} \`${v}\``).join(' · ')}`);
  if (d.contrast) md.push(`- Contrast (card / page / alt): ${Object.entries(d.contrast).map(([k, v]) => `${k} ${v.card} / ${v.page} / ${v.alt}`).join(' · ')}`);
  if (d.minPairDistanceOKLab !== undefined) md.push(`- Smallest distance between two colours (OKLab): ${d.minPairDistanceOKLab}`);
  if (d.candidates) md.push(`- Engine ranking: ${d.candidates.map(c => c.id + ' ' + c.score).join(', ')}`);
  if (d.ownRule) md.push(`- Our rule on top: ${d.ownRule}`);
  if (d.mapping) md.push(`- Mapping: ${Object.entries(d.mapping).map(([k, v]) => k + ' → ' + v).join(' · ')}`);
  if (d.sampledAt) md.push(`- Sampled at: ${d.sampledAt}`);
  if (d.reasons) md.push(`- Why: ${d.reasons.join(' ')}`);
  if (d.warnings && d.warnings.length) md.push(`- Engine warnings: ${d.warnings.join(' | ')}`);
  if (d.redundantCoding) md.push(`- Not colour alone (COL-07): ${d.redundantCoding}`);
  if (d.chips) { md.push('', '| Text / chip | colour | tint | worst contrast | ≥ 4.5 |', '|---|---|---|---|---|', ...d.chips.map(c => `| ${c.name} | \`${c.color}\` | ${c.tint || '—'} | ${c.worstContrast} | ${c.passes ? 'yes' : '**no**'} |`)); }
  md.push(`- Status: ${d.status}`, '');
}
md.push('## Still to validate', '', '- Colour-vision simulation and a print proof (COL-11); the engine does not test them.', '- A read-out with real readers: can they tell the categories apart at the sizes used?', '- The Astara template accent (`--accent`) against these data colours, side by side, on a phone in daylight.', '');
fs.writeFileSync(path.join(HERE, 'COLOR_DECISIONS.md'), md.join('\n'), 'utf8');
console.log('tokens:', Object.keys(T).length, '| decisions:', decisions.length, '| chips pass:', chips.every(c => c.passes));
for (const d of decisions.filter(d => d.paletteId)) console.log(' ', d.id, d.family, d.paletteId, JSON.stringify(d.colors));
if (!chips.every(c => c.passes)) console.log(' chips that do not reach 4.5:1:', chips.filter(c => !c.passes).map(c => `${c.name} ${c.worstContrast}`).join(' · '));
