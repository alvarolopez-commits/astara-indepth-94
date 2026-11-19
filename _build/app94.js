const DATA = /*__DATA__*/null;
const I18N = /*__I18N__*/null;   // {en: {key: text}, es: {key: text}}, built from _build/i18n/*.json, the docx and the Excel

/* ================= language (EN | ES) =================
   Every text on the page is a key of the catalog: elements carry data-i18n="key" (and data-i18n-attr="attr:key"),
   chart code calls t(key) for html and tp(key) for plain text. A missing key falls back to English and is
   listed in window.__i18nMiss. Keys under doc.*, tbl.* and xl.* hold plain text and are escaped here. */
let LANG = 'en';
const MISS = window.__i18nMiss = new Set();
const PLAIN = /^(doc|tbl|xl)\./;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const tp = (k, a) => {
  let s = I18N[LANG][k];
  if(s === undefined){ MISS.add(k); s = I18N.en[k]; if(s === undefined) return k; }
  if(a) for(const [n, v] of Object.entries(a)) s = s.split(`{${n}}`).join(v);
  return s;
};
const t = (k, a) => PLAIN.test(k) ? esc(tp(k, a)) : tp(k, a);
const lead = s => { const i = s.indexOf(': '); return i < 0 ? esc(s) : `<b>${esc(s.slice(0, i + 1))}</b> ${esc(s.slice(i + 2))}`; };   // "Label: text" -> bold label
const dec = s => LANG === 'es' ? String(s).replace('.', ',') : String(s);                         // decimal comma in Spanish
const NB = ' ';

const $ = id => document.getElementById(id);
const fmt = v => Math.round(v).toLocaleString(LANG === 'es' ? 'es-ES' : 'en-US');                    // es-ES writes 4-digit numbers without a separator (RAE)
const pct = v => { const a = Math.abs(v); return (v < 0 ? '−' : '+') + dec(Number.isInteger(a) ? a : a.toFixed(1)) + (LANG === 'es' ? NB + '%' : '%'); };
const eur = v => LANG === 'es' ? dec(v) + NB + '€' : '€' + v;
const eurR = (a, b) => LANG === 'es' ? `${dec(a)}–${dec(b)}${NB}€` : `€${a}–${b}`;                  // €15–17  ·  15–17 €

const LAB = 'var(--lab)';   // space reserved at the end of a bar row for its value label (CSS: 92px, 70px on phones)
const at = f => `calc((100% - ${LAB})*${f})`;
const pctw = f => `${f * 100}%`;

/* gridlines behind a row of bars: [fraction, colour, width] -> one CSS background (read by .lr__bar) */
const grid = (list) => list.map(([f,c='var(--gl)',w=1]) => `linear-gradient(${c},${c}) calc((100% - var(--lab))*${f}) 0/${w}px 100% no-repeat`).join(',');
const lrow = (name, sub, bar, cls='', fl='') => `<div class="row lr ${cls}"><div class="row__m"><span class="row__mt">${name}${sub?`<small>${sub}</small>`:''}</span>${fl}</div><div class="row__bar lr__bar">${bar}</div></div>`;
const axis = (vals, X, f) => `<div class="rows__axis"><span></span><div class="rows__ticks" style="margin-right:${LAB}">${vals.map(v => `<span style="left:${X(v)*100}%">${f(v)}</span>`).join('')}</div></div>`;
const valLabel = (f, txt) => `<span class="row__v lr__v" style="left:calc((100% - ${LAB})*${f} + 10px)">${txt}</span>`;
const fill = (i, x, bg, extra='') => `<span class="row__fill" style="--i:${i};width:calc((100% - ${LAB})*${x});background:${bg};${extra}"></span>`;
const rowsBox = (T, X, aria) => `<div class="rows lr--wide" style="--grid:${grid(T.map(v => [X(v)]))}" role="img" aria-label="${esc(aria)}">`;
const chip = (kind, txt) => `<span class="chip chip--${kind}">${txt}</span>`;
/* flag tiles (deploy/flags, flag-icons 1x1, MIT): flag('cn') · flags('cn','kr') · flag('-') keeps the space of a flag where a row has none (regions) */
const flag = c => c === '-' ? '<span class="flag flag--none" aria-hidden="true"></span>' : `<span class="flag" style="background-image:url('deploy/flags/${c}.svg')" aria-hidden="true"></span>`;
const flags = (...cs) => cs.length ? `<span class="flags">${cs.map(flag).join('')}</span>` : '';
const dl = d => d == null ? '' : `<small class="dl ${d < 0 ? 'dl--dn' : 'dl--up'}">${pct(d)}</small>`;

/* dates as the Excel writes them ("2026-03-26", "2026-09 (IAA)", "2026 (H2)", "From the end of 2026", ...) -> "26 Mar 2026" / "26 mar 2026" */
const MON = {en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], es:['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']};
const dMon = (y,m) => `${MON[LANG][m-1]} ${y}`;
function fdate(raw){
  let m;
  if((m = raw.match(/^(.+) \/ (.+)$/))) return tp('date.reported', {a:fdate(m[1]), b:fdate(m[2])});
  if((m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return `${+m[3]} ${MON[LANG][+m[2]-1]} ${m[1]}`;
  if((m = raw.match(/^(\d{4})-(\d{2}) \(end\)$/))) return tp('date.endOf', {d:dMon(m[1],+m[2])});
  if((m = raw.match(/^(\d{4})-(\d{2}) \(IAA\)$/))) return `${dMon(m[1],+m[2])} (IAA)`;
  if((m = raw.match(/^(\d{4})-(\d{2})$/))) return dMon(m[1],+m[2]);
  if((m = raw.match(/^(\d{4}) \(H2\)$/))) return tp('date.h2', {y:m[1]});
  if((m = raw.match(/^From the end of (\d{4})$/))) return tp('date.fromEnd', {y:m[1]});
  if(/^\d{4}$/.test(raw)) return raw;
  MISS.add('date:' + raw); return raw;
}

/* a range on a linear scale with an optional target marker (V05 China, V09 price): [lo, hi], target, max, ticks */
function rangeBar(lo, hi, target, max, ticks, unit, aria){
  const p = v => pctw(v / max);
  return `<div class="rng" role="img" aria-label="${esc(aria)}"><div class="rng__lab"><span style="left:${p(lo)}">${dec(lo)}</span><span style="left:${p(hi)}">${dec(hi)}</span></div>`+
    `<div class="rng__track"><span class="rng__bar" style="left:${p(lo)};width:${pctw((hi-lo)/max)}"></span><span class="rng__tgt" style="left:${p(target)}"></span></div>`+
    `<div class="rng__ticks">${ticks.map(v => `<span style="left:${p(v)}">${dec(v)}</span>`).join('')}</div>`+
    `<div class="rng__key"><span class="rng__k1"><i></i>${t('chart.rng.today')}</span><span class="rng__k2"><i></i>${t('chart.rng.target', {v:dec(target)})}</span></div></div>`;
}

const SK = {cn:['chart.stc.cn.name','chart.stc.cn.def'], jp:['chart.stc.jp.name','chart.stc.jp.def'], de0:['chart.stc.de0.name','chart.stc.de0.def'], de:['chart.stc.de.name','chart.stc.de.def'], ca:['chart.stc.ca.name','chart.stc.ca.def']};

/* ================= V02 — fuel cell cars: three panels ================= */
function renderCars(){
  const C = DATA.cars;
  const row = (i, d, X, bg, sub, label, fl) => lrow(t(d.label), sub, fill(i, X(d.v), bg) + valLabel(X(d.v), fmt(d.v) + dl(d.delta)), label || '', fl || '');
  const FA = {A1:'cn', A2:'kr', A3:'-', A4:'jp', A5:'-'};
  // A: 2025 by market (the China figure is "commercial" in the source) and B: 2025 by brand share one scale
  const X8 = v => v / 8000, T8 = [0, 2000, 4000, 6000, 8000], f8 = v => fmt(v);
  $('v02a').innerHTML = rowsBox(T8, X8, tp('chart.car.ariaA') + ' ' + C.A.map(d => `${tp(d.label)} ${fmt(d.v)}`).join('; ')) +
    C.A.map((d,i) => row(i, d, X8, d.commercial ? 'var(--hatch-cars)' : 'var(--c-cars)', d.commercial ? t('chart.car.commercial') : '', '', flag(FA[d.id]))).join('') + '</div>' + axis(T8, X8, f8);
  $('v02b').innerHTML = rowsBox(T8, X8, tp('chart.car.ariaB') + ' ' + C.B.map(d => `${tp(d.label)} ${fmt(d.v)}${d.delta == null ? '' : ' ' + pct(d.delta)}`).join('; ')) +
    C.B.map((d,i) => row(i, d, X8, 'var(--c-cars)', '')).join('') + '</div>' + axis(T8, X8, f8);
  // C: first half of 2026 against the first half of 2025
  const X5 = v => v / 5000, T5 = [0, 1000, 2000, 3000, 4000, 5000];
  $('v02c').innerHTML = rowsBox(T5, X5, tp('chart.car.ariaC') + ' ' + C.C.map(d => `${tp(d.label)} ${fmt(d.v)}${d.delta == null ? '' : ' ' + pct(d.delta)}`).join('; ')) +
    C.C.map((d,i) => row(i, d, X5, i === 0 ? 'var(--n-series)' : (d.id === 'C5' ? 'var(--hatch-cars)' : 'var(--c-cars)'), d.id === 'C5' ? t('chart.car.commercial') : '', i === 1 ? 'row--sep' : '')).join('') + '</div>' + axis(T5, X5, f8);
}

/* ================= V03 — world stations at the end of 2024 ================= */
function renderStW(){
  const W = DATA.stw, COL = {AP:'var(--c-ap)', EMEA:'var(--c-emea)', AM:'var(--c-am)'};
  const bar = W.blocks.map(b => `<span class="stk__s" style="flex:${b.v};background:${COL[b.id]}"></span>`).join('');
  const key = W.blocks.map(b => `<div class="stk__k"><i style="background:${COL[b.id]}"></i><b>${fmt(b.v)}</b><span>${t(b.label)}</span>${b.id === 'AP' ? `<small>${t('chart.stw.apShare')}</small>` : ''}</div>`).join('');
  $('v03').innerHTML = `<div class="stk" role="img" aria-label="${esc(tp('chart.stw.aria', {n:fmt(W.total)}))} ${W.blocks.map(b => `${esc(tp(b.label))} ${fmt(b.v)}`).join('; ')}">`+
    `<div class="stk__tot"><b>${fmt(W.total)}</b><span>${t('chart.stw.total')}</span></div><div class="stk__bar">${bar}</div><div class="stk__keys">${key}</div></div>`+
    `<div class="stk__five"><b>${dec(W.share5)}${LANG === 'es' ? NB + '%' : '%'}</b>${flags('cn', 'kr', 'jp', 'fr', 'de')}<span>${t('chart.stw.five')}</span></div>`;
}

/* ================= V04 — stations by country: every bar carries its own date and definition ================= */
function renderStC(){
  const S = DATA.stc, X = v => v / 600, T = [0, 150, 300, 450, 600];
  const FS = {cn:'cn', jp:'jp', de0:'de', de:'de', ca:'us'};   // California: the flag of the United States
  const R = [{k:'cn', v:S.cn}, {k:'jp', v:S.jp}, {k:'de0', v:S.de_before, thr:true}, {k:'de', v:S.de}, {k:'ca', v:S.ca, out:S.ca_out}];
  let h = rowsBox(T, X, tp('chart.stc.aria') + ' ' + R.map(r => `${tp(SK[r.k][0])} ${r.thr ? tp('chart.stc.moreThan') + ' ' : ''}${fmt(r.v)}${r.out ? ', ' + tp('chart.stc.outAria', {n:r.out}) : ''}`).join('; '));
  R.forEach((r,i) => {
    let bar = fill(i, X(r.v), r.thr ? 'var(--hatch-stations)' : 'var(--c-stations)');
    if(r.out) bar += `<span class="lr__seg" style="left:${at(X(r.v))};width:calc((100% - ${LAB})*${X(r.out)})"></span>`;
    bar += valLabel(X(r.v + (r.out || 0)), (r.thr ? tp('chart.stc.moreThan') + NB : '') + fmt(r.v) + (r.out ? `<small>+${r.out} ${t('chart.stc.out')}</small>` : ''));
    h += lrow(t(SK[r.k][0]), t(SK[r.k][1]), bar, '', flag(FS[r.k]));
  });
  $('v04').innerHTML = h + '</div>' + axis(T, X, v => fmt(v));
  $('v04-leg').innerHTML = `<span><i class="sq" style="background:var(--c-stations)"></i>${t('chart.stc.legOpen')}</span><span><i class="sq" style="background:var(--hatch-stations)"></i>${t('chart.stc.legThr')}</span><span><i class="sq" style="background:var(--hatch-danger)"></i>${t('chart.stc.legOut')}</span>`;
}

/* ================= V05 — the price of a kilo ================= */
function renderPrices(){
  const P = DATA.prices, X20 = v => v / 20;
  const pay = (i, label, sub, v, bg) => lrow(label, sub, fill(i, X20(v), bg) + valLabel(X20(v), eur(v)));
  const de = `<div class="pcard__big"><b>${eur(P.de_max)}</b><span>${t('chart.price.de.bigLabel')}</span></div>`+
    `<div class="pcard__bars"><div class="rows lr--narrow" style="--grid:${grid([[X20(0)],[X20(5)],[X20(10)],[X20(15)],[X20(20)]])}" role="img" aria-label="${esc(tp('chart.price.de.aria', {max:P.de_max, truck:P.de_truck}))}">`+
      pay(0, t('chart.price.de.max'), t('chart.price.de.maxSub'), P.de_max, 'var(--c-price)') + pay(1, t('chart.price.de.truck'), t('chart.price.de.truckSub'), P.de_truck, 'var(--c-trucks)') + `</div></div>`+
    `<p class="pcard__note">${t('chart.price.de.grossNet')}</p>`+
    `<div class="pcard__cuts"><div class="pcard__h">${t('chart.price.de.cutsTitle')}</div>`+
      `<div class="cut"><b>−${dec(P.cut5)}${LANG === 'es' ? NB + '%' : '%'}</b><span>${t('chart.price.de.cut5')}</span></div>`+
      `<div class="cut"><b>−${P.cut15[0]} ${tp('chart.price.to')} −${P.cut15[1]}${LANG === 'es' ? NB + '%' : '%'}</b><span>${t('chart.price.de.cut15')}</span></div>`+
      `<p class="pcard__note">${t('chart.price.de.cutsNote')}</p></div>`;
  const cn = `<div class="pcard__big"><b>${dec(P.cn[0])}–${dec(P.cn[1])}</b><span>${t('chart.price.cn.bigLabel')}</span></div>` + rangeBar(P.cn[0], P.cn[1], P.cn_target, 80, [0, 20, 40, 60, 80], 'yuan', tp('chart.price.cn.aria', {lo:P.cn[0], hi:P.cn[1], tgt:P.cn_target})) + `<p class="pcard__note">${t('chart.price.cn.note')}</p>`;
  const own = `<div class="pcard__big pcard__big--calc"><b>${eurR(Math.round(P.cost100[0]), Math.round(P.cost100[1]))}</b><span>${t('chart.price.own.bigLabel')}</span></div>`+
    `<div class="calc"><span class="calc__f">${dec(P.kg100[0])}–${dec(P.kg100[1])} kg/100 km</span><span class="calc__op">×</span><span class="calc__f">${eur(P.de_max)}/kg</span><span class="calc__op">=</span><span class="calc__r">${eurR(P.cost100[0], P.cost100[1])}</span></div>`+
    `<p class="pcard__note">${t('chart.price.own.note')}</p>`;
  const doe = `<ul class="doe">${[[P.doe[0], 'usdkg', 'chart.price.doe.t0'], [P.doe[1], 'usdkg', 'chart.price.doe.t1'], [P.doe[2], 'usdkg', 'chart.price.doe.t2'], [P.doe[3], 'usdkw', 'chart.price.doe.t3']].map(([v, u, k]) =>
    `<li><span class="doe__v">${v}<small>${u === 'usdkg' ? tp('chart.price.doe.u.usdkg') : tp('chart.price.doe.u.usdkw')}</small></span><span class="doe__t">${t(k)}</span></li>`).join('')}</ul><p class="pcard__note">${t('chart.price.doe.note')}</p>`;
  const card = (cls, title, sub, body, tag, fl = '') => `<article class="pcard ${cls}"><div class="pcard__top"><div class="pcard__title">${fl}${title}</div>${tag ? chip(tag[0], tag[1]) : ''}</div><div class="pcard__sub">${sub}</div>${body}</article>`;
  $('v05').innerHTML = `<div class="pcards">`+
    card('pcard--de', t('chart.price.de.title'), t('chart.price.de.sub'), de, null, flags('de')) +
    card('pcard--cn', t('chart.price.cn.title'), t('chart.price.cn.sub'), cn, null, flags('cn')) +
    card('pcard--own', t('chart.price.own.title'), t('chart.price.own.sub'), own, ['calc', t('chart.price.own.tag')]) +
    card('pcard--doe', t('chart.price.doe.title'), t('chart.price.doe.sub'), doe, ['tgt', t('chart.tag.target')], flags('us')) + `</div>`;
}

/* ================= V06 — trucks: what is done, what is postponed ================= */
function renderTrucks(){
  const ST = {done:'chart.tr.status.done', pending:'chart.tr.status.pending', plan:'chart.tr.status.plan'}, FL = {postponed:'chart.tr.flag.postponed', plan100:'chart.tr.flag.plan100'};
  let y = null, h = '';
  DATA.trucks.forEach((d, i) => {
    const yr = d.date.match(/\d{4}/)[0];
    if(yr !== y){ y = yr; h += `<li class="tl__y" aria-hidden="true"><span>${yr}</span></li>`; }
    h += `<li class="tl__i tl__i--${d.status}${d.flag ? ' tl__i--' + d.flag : ''}" style="--i:${i}"><span class="tl__d">${esc(fdate(d.date))}</span><span class="tl__m"><i></i></span>`+
      `<div class="tl__b"><div class="tl__t">${t(d.m)}</div><div class="tl__c">${chip(d.status, t(ST[d.status]))}${d.flag ? `<span class="tl__flag">${t(FL[d.flag])}</span>` : ''}</div></div></li>`;
  });
  $('v06').innerHTML = `<ol class="tl" aria-label="${esc(tp('chart.tr.aria'))}">${h}</ol>`;
  $('v06-leg').innerHTML = ['done', 'pending', 'plan'].map(s => `<span><i class="tl__lg tl__lg--${s}"></i><em>${t(ST[s])}</em></span>`).join('');
}

/* ================= V07 — fuel cell buses in the US ================= */
function renderBuses(){
  const B = DATA.buses, X = v => v / 160, T = [0, 40, 80, 120, 160];
  let h = rowsBox(T, X, tp('chart.bus.aria') + ' ' + B.map(b => `${tp(b.agency)}: ${b.svc} ${tp('chart.bus.svc')}${b.plan ? ', ' + b.plan + ' ' + tp('chart.bus.plan') : ''}`).join('; '));
  B.forEach((b, i) => {
    let bar = fill(i, X(b.svc), 'var(--c-buses)');
    if(b.plan) bar += `<span class="lr__seg lr__seg--plan" style="left:${at(X(b.svc))};width:calc((100% - ${LAB})*${X(b.plan)})"></span>`;
    bar += valLabel(X(b.svc + (b.plan || 0)), `${b.svc}${b.plan ? `<small>+${b.plan}</small>` : ''}`);
    h += lrow(t(b.agency), esc(tp(b.detail)), bar);
  });
  $('v07').innerHTML = h + '</div>' + axis(T, X, v => v);
  $('v07-grant').innerHTML = `<b>${t('xl.bus.grant')}</b> · ${t('chart.bus.grantLine', {v:dec(DATA.grant.usd_m)})}`;
}

/* ================= V08 — who leaves, who bets: two lanes ================= */
function renderExits(){
  const EF = {E01:['us'], E02:['pl'], E03:['jp','us'], E04:['gb'], E05:['de'], E06:['jp'], E07:['kr'], E08:['kr','fr'], E09:['no'], E10:['dk'], E11:['de']};   // country of the company or government
  const lane = (k) => DATA.exits.filter(e => e.lane === k).map(e =>
    `<li class="ln__i"><span class="ln__d">${esc(fdate(e.date))}</span><div class="ln__b"><b>${flags(...EF[e.id])}${t(e.co)}</b><span>${t(e.what)}</span>${e.unconfirmed ? `<em class="ln__nc">${t('chart.ex.unconfirmed')}</em>` : ''}</div></li>`).join('');
  $('v08').innerHTML = `<div class="lanes" role="group" aria-label="${esc(tp('chart.ex.aria'))}">`+
    `<section class="ln ln--exit"><h4 class="ln__h"><i></i>${t('chart.ex.exit')}</h4><ol class="ln__l">${lane('exit')}</ol></section>`+
    `<section class="ln ln--bet"><h4 class="ln__h"><i></i>${t('chart.ex.bet')}</h4><ol class="ln__l">${lane('bet')}</ol></section></div>`;
}

/* ================= V09 — China: target and reality ================= */
function renderChina(){
  const C = DATA.china, P = DATA.prices;
  const XA = v => v / 100000, TA = [0, 25000, 50000, 75000, 100000];
  const tgt = rowsBox(TA, XA, tp('chart.cn.aria1', {t:fmt(C.target), s:fmt(C.sold)})) +
    lrow(t('chart.cn.target'), t('chart.cn.targetSub'), fill(0, XA(C.target), 'var(--hatch-cars)', 'outline:1px dashed var(--c-cars);outline-offset:-1px;') + valLabel(XA(C.target), fmt(C.target))) +
    lrow(t('chart.cn.sold'), t('chart.cn.soldSub'), fill(1, XA(C.sold), 'var(--c-cars)') + valLabel(XA(C.sold), fmt(C.sold))) + '</div>' + axis(TA, XA, v => v ? fmt(v) : '0');
  const XB = v => v / 1000, TB = [0, 250, 500, 750, 1000];
  const h1 = rowsBox(TB, XB, tp('chart.cn.aria2', {a:C.caam, b:C.sne})) +
    lrow(t('chart.cn.caam'), t('chart.cn.caamSub'), fill(0, XB(C.caam), 'var(--c-cars)') + valLabel(XB(C.caam), fmt(C.caam) + dl(C.caam_delta))) +
    lrow(t('chart.cn.sne'), t('chart.cn.sneSub'), fill(1, XB(C.sne), 'var(--hatch-cars)') + valLabel(XB(C.sne), fmt(C.sne) + dl(C.sne_delta))) + '</div>' + axis(TB, XB, v => fmt(v));
  const card = (cls, title, sub, body) => `<article class="pcard ${cls}"><div class="pcard__top"><div class="pcard__title">${flags('cn')}${title}</div></div><div class="pcard__sub">${sub}</div>${body}</article>`;
  $('v09').innerHTML = `<div class="pcards">`+
    card('pcard--tgt', t('chart.cn.c1.title'), t('chart.cn.c1.sub'), tgt) +
    card('pcard--h1', t('chart.cn.c2.title'), t('chart.cn.c2.sub'), h1 + `<p class="pcard__note">${t('chart.cn.c2.note')}</p>`) +
    card('pcard--st', t('chart.cn.c3.title'), t('chart.cn.c3.sub'), `<div class="pcard__big"><b>${fmt(C.stations)}</b><span>${t('chart.cn.c3.big')}</span></div><p class="pcard__note">${t('chart.cn.c3.note')}</p>`) +
    card('pcard--pr', t('chart.cn.c4.title'), t('chart.cn.c4.sub'), "" + `<div class="pcard__big"><b>${dec(C.price[0])}–${dec(C.price[1])}</b><span>${t('chart.price.cn.bigLabel')}</span></div>` + rangeBar(C.price[0], C.price[1], C.price_target, 80, [0, 20, 40, 60, 80], 'yuan', tp('chart.price.cn.aria', {lo:C.price[0], hi:C.price[1], tgt:C.price_target})) + `<p class="pcard__note">${t('chart.price.cn.note')}</p>`) + `</div>`;
}


/* ================= data tables: the same figures as text (design system 1.1, C07: a tabular alternative for every chart) ================= */
const DASH = '—';
function dtab(id, caption, head, rows, num = [], note = ''){
  const el = $(id), was = el.querySelector('details') && el.querySelector('details').open;     // an open table stays open when the language changes
  const cell = (c, i) => i === 0 ? `<th scope="row">${c}</th>` : `<td${num.includes(i) ? ' class="n"' : ''}>${c}</td>`;
  const body = rows.map(r => typeof r === 'string' ? `<tr class="dtab__g"><th scope="colgroup" colspan="${head.length}">${r}</th></tr>` : `<tr>${r.map(cell).join('')}</tr>`).join('');
  el.innerHTML = `<details class="dtab"${was ? ' open' : ''}><summary>${t('dtab.summary')}</summary><div class="dtab__w"><table><caption>${caption}</caption>`+
    `<thead><tr>${head.map((h, i) => `<th scope="col"${num.includes(i) ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>${note ? `<p class="dtab__n">${note}</p>` : ''}</div></details>`;
}
function renderTables(){
  const C = DATA.cars, W = DATA.stw, S = DATA.stc, B = DATA.buses, N = DATA.china, P = DATA.prices;
  const crow = d => [t(d.label), fmt(d.v), d.delta == null ? DASH : pct(d.delta), (d.commercial || d.id === 'C5') ? t('chart.car.commercial') : ''];
  dtab('t-cars', t('dtab.cars.caption'), [t('dtab.h.item'), t('dtab.h.sold'), t('dtab.h.change'), t('dtab.h.note')],
    [t('dtab.grp.A'), ...C.A.map(crow), t('dtab.grp.B'), ...C.B.map(crow), t('dtab.grp.C'), ...C.C.map(crow)], [1, 2], t('dtab.dash'));
  dtab('t-stw', t('dtab.stw.caption'), [t('dtab.h.region'), t('dtab.h.stations')],
    [...W.blocks.map(b => [t(b.label), fmt(b.v)]), [t('dtab.stw.total'), fmt(W.total)]], [1], t('dtab.stw.note', {p:dec(W.share5)}));
  const R = [['cn', S.cn], ['jp', S.jp], ['de0', S.de_before, true], ['de', S.de], ['ca', S.ca, false, S.ca_out]];
  dtab('t-stc', t('dtab.stc.caption'), [t('dtab.h.country'), t('dtab.h.def'), t('dtab.h.stations'), t('dtab.h.note')],
    R.map(([k, v, thr, out]) => [t(SK[k][0]), t(SK[k][1]), (thr ? t('chart.stc.moreThan') + NB : '') + fmt(v), out ? t('chart.stc.outAria', {n:out}) : '']), [2]);
  dtab('t-bus', t('dtab.bus.caption'), [t('dtab.h.agency'), t('chart.bus.legSvc'), t('chart.bus.legPlan'), t('dtab.h.detail')],
    B.map(b => [t(b.agency), b.svc, b.plan == null ? DASH : b.plan, esc(tp(b.detail))]), [1, 2], `${t('dtab.bus.dash')} ${t('xl.bus.grant')}: ${t('chart.bus.grantLine', {v:dec(DATA.grant.usd_m)})}.`);
  const u = k => ' ' + tp(k);
  dtab('t-cn', t('dtab.cn.caption'), [t('dtab.h.measure'), t('dtab.h.value'), t('dtab.h.def')], [
    [t('chart.cn.target'), fmt(N.target) + u('dtab.u.vehicles'), t('chart.cn.targetSub')],
    [t('chart.cn.sold'), fmt(N.sold) + u('dtab.u.vehicles'), t('chart.cn.soldSub')],
    [t('chart.cn.caam'), fmt(N.caam) + u('dtab.u.units') + ' (' + pct(N.caam_delta) + ')', t('chart.cn.caamSub')],
    [t('chart.cn.sne'), fmt(N.sne) + u('dtab.u.units') + ' (' + pct(N.sne_delta) + ')', t('chart.cn.sneSub')],
    [t('chart.cn.c3.title'), fmt(N.stations) + u('dtab.u.stations'), t('chart.cn.c3.sub')],
    [t('chart.cn.c4.title'), `${dec(N.price[0])}–${dec(N.price[1])}` + u('dtab.u.yuan'), t('chart.cn.c4.sub')],
    [t('chart.rng.target', {v:dec(N.price_target)}), '< ' + dec(N.price_target) + u('dtab.u.yuan'), t('chart.tag.target')]], [1]);
}

/* ================= render, language switch ================= */
function renderAll(){
  renderCars(); renderStW(); renderStC(); renderPrices(); renderTrucks(); renderBuses(); renderExits(); renderChina(); renderTables();
}
function applyText(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    el.innerHTML = el.dataset.i18nFmt === 'lead' ? lead(tp(k)) : t(k, el.dataset.i18nArgs ? JSON.parse(el.dataset.i18nArgs) : undefined);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => el.dataset.i18nAttr.split(';').forEach(p => { const [a, k] = p.split(':'); el.setAttribute(a, tp(k)); }));
}
function holdPlace(){      // the element at the reading line, and how far it is from the top; charts are redrawn, so a chart is held by its figure
  const el = document.elementFromPoint(Math.round(innerWidth / 2), 140); if(!el) return null;
  const fig = el.closest('figure'), a = fig || el.closest('p,h2,h3,h4,li,section');
  return a ? {a, top:a.getBoundingClientRect().top} : null;
}
function restorePlace(h){
  if(!h) return;
  const html = document.documentElement, prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto'; window.scrollBy(0, h.a.getBoundingClientRect().top - h.top); html.style.scrollBehavior = prev;
}
function setLang(l, remember = true){
  const place = remember ? holdPlace() : null;
  LANG = l === 'es' ? 'es' : 'en';
  document.documentElement.lang = LANG;
  document.title = tp('meta.title');
  const md = document.querySelector('meta[name="description"]');
  if(md) md.content = tp('meta.description');
  applyText();
  renderAll();
  document.querySelectorAll('.lang__b').forEach(b => { const on = b.dataset.lang === LANG; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
  restorePlace(place);
  if(remember){
    try{ localStorage.setItem('lang', LANG); }catch(e){}
    try{ const u = new URL(location.href); if(LANG === 'es') u.searchParams.set('lang','es'); else u.searchParams.delete('lang'); history.replaceState(null, '', u); }catch(e){}
  }
}

/* ================= boot ================= */
let startLang = 'en';
try{ const q = new URLSearchParams(location.search).get('lang'); const s = localStorage.getItem('lang'); startLang = (q === 'es' || q === 'en') ? q : (s === 'es' ? 'es' : 'en'); }catch(e){}
document.querySelectorAll('.lang__b').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
setLang(startLang, false);

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce || !('IntersectionObserver' in window)){ document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible')); }
else{
  const obs = new IntersectionObserver(e => { e.forEach(x => { if(x.isIntersecting){ x.target.classList.add('visible'); obs.unobserve(x.target); } }); }, {threshold:0.06});
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ================= section navigation: where am I? (design system 1.1, C01) ================= */
(function(){
  const strip = $('snav'), links = [...strip.querySelectorAll('a')], secs = links.map(a => document.querySelector(a.getAttribute('href')));
  let cur = -2, ticking = false;
  function spy(){
    ticking = false;
    const line = innerHeight * .35; let i = -1;
    secs.forEach((s, k) => { if(s.getBoundingClientRect().top <= line) i = k; });
    if(i === cur) return;
    cur = i;
    links.forEach((a, k) => k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
    if(i >= 0 && strip.scrollWidth > strip.clientWidth){      // phones: bring the current item into view inside the strip (never scrolls the page)
      const a = links[i]; strip.scrollTo({left:Math.max(0, a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2), behavior:reduce ? 'auto' : 'smooth'});
    }
  }
  addEventListener('scroll', () => { if(!ticking){ ticking = true; requestAnimationFrame(spy); } }, {passive:true});
  addEventListener('resize', spy);
  spy();
})();
