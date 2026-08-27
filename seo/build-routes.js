#!/usr/bin/env node
/**
 * seo/build-routes.js
 * ---------------------------------------------------------------
 * Gera as páginas de rota e de aeroporto a partir dos ficheiros
 * routes-XX.json, e reescreve o sitemap.
 *
 * Como correr, a partir da raiz do projeto do site:
 *
 *     node seo/build-routes.js
 *
 * Não apaga nada que não tenha gerado. Correr duas vezes dá o mesmo
 * resultado — podes correr sempre que mudares um ficheiro de dados.
 *
 * ---------------------------------------------------------------
 * PORQUÊ FICHEIROS E NÃO PÁGINAS DINÂMICAS
 *
 * O site é estático no Render. Uma página gerada no browser não é
 * lida pelo Google da mesma forma que um ficheiro HTML — e para SEO
 * a diferença ainda importa. Ficheiros reais, servidos direto.
 * ---------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEO_DIR = path.join(ROOT, 'seo');
// Dentro de seo/, e uma subpasta por país.
//
// O país entra também no endereço público, e isso resolve um
// problema real: com uma pasta por país mas endereços planos, seria
// preciso acrescentar duas regras de reescrita no Render por cada
// país aberto. Com o país no endereço, duas regras servem para
// sempre.
const OUT_TRANSFERS = path.join(ROOT, 'seo', 'transfers');
const OUT_AIRPORTS = path.join(ROOT, 'seo', 'airports');
const SITE = 'https://www.airportlink.app';

/**
 * A mesma fórmula do servidor.
 *
 * Tem de ser a mesma: um preço na página diferente do preço no
 * calculador é a forma mais rápida de perder a confiança de quem
 * chega pelo Google.
 *
 * Se mudares os valores no server.js, muda aqui também.
 */
function priceEUR(km, passengers, isPortugal) {
  const p = isPortugal
    ? { base: 40, perKm: 1.6, min: 25, markup: 1.0 }
    : { base: 20, perKm: 3.5, min: 25, markup: 1.3 };

  const multiplier =
    passengers <= 4 ? 1 :
    passengers <= 8 ? 1.7 :
    passengers <= 13 ? 2.5 : 3.2;

  const price = (p.base + km * p.perKm) * p.markup * multiplier;
  return Math.max(p.min, price);
}

const money = (v) => '€' + Math.round(v);

/**
 * O que aparece no endereço.
 *
 * O nome da cidade, não o código IATA: as pessoas pesquisam
 * "faro airport transfer to albufeira" e não "FAO to albufeira".
 * O endereço bate certo com o que elas escrevem.
 *
 * Se o slug faltar no ficheiro de dados, cai para o nome da cidade
 * sem acentos — mas vale a pena escrevê-lo, para não haver surpresas
 * com cidades de nome composto.
 */
/** O país no endereço: 'Portugal' vira 'portugal'. */
function countrySlug(country) {
  return String(country.country)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugOf(airport) {
  if (airport.slug) return airport.slug;

  return String(airport.city || airport.iata)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function esc(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const today = new Date().toISOString().slice(0, 10);

// ============================================================
// O MOLDE
// ============================================================

function head({ title, description, canonical, schema }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#E8EBE7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1219" media="(prefers-color-scheme: dark)">
<script>
  (function () {
    try {
      var t = localStorage.getItem('airportlink-theme');
      if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    } catch (e) {}
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/site.css">
<script src="/assets/layout.js" defer></script>
<script type="application/ld+json">
${JSON.stringify(schema, null, 1)}
</script>
<style>
.rt{max-width:820px;margin:0 auto;padding:44px 20px 20px}
.rt .tag{color:var(--teal);display:block;margin-bottom:12px}
html[data-theme="dark"] .rt .tag{color:var(--amber)}
.rt h1{font-family:var(--display);font-weight:800;font-size:clamp(28px,4.4vw,42px);
  letter-spacing:-.038em;line-height:1.08;margin:0 0 14px}
.rt .lead{font-size:17.5px;line-height:1.7;color:var(--muted);margin:0 0 28px;max-width:62ch}
.rt h2{font-family:var(--display);font-weight:700;font-size:21px;letter-spacing:-.025em;
  margin:40px 0 12px;padding-top:26px;border-top:1px solid var(--rule)}
.rt h3{font-family:var(--display);font-weight:700;font-size:16px;letter-spacing:-.015em;margin:24px 0 7px}
.rt p{margin:0 0 15px;font-size:15.5px;line-height:1.75;color:var(--slate)}
html[data-theme="dark"] .rt p{color:#C3CBD8}
.rt ul{margin:0 0 16px;padding-left:20px}
.rt li{font-size:15.5px;line-height:1.75;color:var(--slate);margin-bottom:7px}
html[data-theme="dark"] .rt li{color:#C3CBD8}
.rt a{color:var(--teal)}
html[data-theme="dark"] .rt a{color:var(--amber)}
.rt strong{color:var(--text)}

.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 30px}
.fact{background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:17px 19px}
.fact .k{font-family:var(--mono);font-size:9.5px;font-weight:600;letter-spacing:.11em;
  text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.fact .v{font-family:var(--mono);font-size:22px;font-weight:600;letter-spacing:-.02em}
.fact.hero{background:var(--ink);border-color:transparent;color:#fff}
.fact.hero .k{color:var(--amber)}
.fact.hero .v{color:#fff}

.cta{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;
  background:var(--surface);border:1px solid var(--rule);border-radius:22px;
  padding:24px;margin:32px 0}
.cta strong{display:block;font-family:var(--display);font-weight:700;font-size:18px;
  letter-spacing:-.02em;margin-bottom:5px}
.cta span{color:var(--muted);font-size:13.5px;line-height:1.6}
.cta .btn{flex:0 0 auto;display:inline-flex;align-items:center;height:50px;padding:0 26px;
  border-radius:14px;background:var(--teal);color:#fff;text-decoration:none;
  font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase}
html[data-theme="dark"] .cta .btn{background:var(--amber);color:#141A28}

.others{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0 0}
.other{display:flex;justify-content:space-between;gap:12px;align-items:baseline;
  padding:14px 17px;border:1px solid var(--rule);border-radius:15px;text-decoration:none;
  color:var(--text);transition:border-color .15s ease}
.other:hover{border-color:var(--teal)}
.other b{font-weight:600;font-size:14.5px}
.other span{font-family:var(--mono);font-size:12.5px;color:var(--muted);flex:0 0 auto}

/* Imagem da cidade. Sem ficheiro, fica um gradiente — a página
   nunca mostra um quadrado partido. */
.hero{position:relative;border-radius:24px;overflow:hidden;margin:0 0 26px;
  background:linear-gradient(140deg,var(--ink),#2A3348 60%,var(--teal))}
.hero img{display:block;width:100%;height:clamp(190px,26vw,300px);object-fit:cover}
.hero .veil{position:absolute;inset:0;
  background:linear-gradient(to top,rgba(12,16,26,.86),rgba(12,16,26,.25) 60%,transparent)}
.hero .on{position:absolute;left:0;right:0;bottom:0;padding:24px}
.hero .on .tag{color:var(--amber)}
.hero .on h1{color:#fff;margin:0}
.hero.blank{height:clamp(190px,26vw,300px)}

/* Navegação dentro da página, colada ao topo. */
.jump{position:sticky;top:0;z-index:20;margin:0 -20px 26px;padding:11px 20px;
  background:color-mix(in srgb,var(--surface) 92%,transparent);
  border-bottom:1px solid var(--rule);overflow-x:auto;white-space:nowrap;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.jump a{display:inline-block;padding:7px 14px;margin-right:5px;border-radius:999px;
  font-size:12.5px;font-weight:600;color:var(--muted);text-decoration:none}
.jump a:hover{color:var(--text);background:var(--surface-2)}
.jump a.now{background:var(--ink);color:#fff}
html[data-theme="dark"] .jump a.now{background:var(--amber);color:#141A28}

/* Calculador. Os preços estão na página, não vêm da rede: a
   resposta é instantânea e funciona sem JavaScript pesado. */
.calc{background:var(--surface);border:1px solid var(--rule);border-radius:22px;
  padding:24px;margin:0 0 30px}
.calc h2{margin:0 0 6px;padding:0;border:0}
.calc .note{color:var(--muted);font-size:13.5px;line-height:1.6;margin:0 0 18px}
.pax{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.pax button{border:1px solid var(--rule-strong);background:var(--field);border-radius:13px;
  padding:11px 16px;cursor:pointer;font-size:13.5px;color:var(--text);text-align:left}
.pax button:hover{border-color:var(--teal)}
.pax button.on{border-color:var(--teal);background:var(--teal-soft)}
html[data-theme="dark"] .pax button.on{border-color:var(--amber);
  background:rgba(232,163,61,.12)}
.pax button b{display:block;font-family:var(--display);font-weight:700;font-size:14.5px}
.pax button span{color:var(--muted);font-size:11.5px}
.quote{display:flex;align-items:center;justify-content:space-between;gap:20px;
  flex-wrap:wrap;background:var(--ink);color:#fff;border-radius:18px;padding:20px 22px}
.quote .k{font-family:var(--mono);font-size:9.5px;font-weight:600;letter-spacing:.11em;
  text-transform:uppercase;color:var(--amber);margin-bottom:5px}
.quote .v{font-family:var(--mono);font-size:32px;font-weight:600;letter-spacing:-.03em;
  line-height:1}
.quote small{display:block;color:#9AA5B6;font-size:12px;margin-top:6px}
.quote .btn{flex:0 0 auto;display:inline-flex;align-items:center;height:48px;padding:0 24px;
  border-radius:13px;background:var(--amber);color:#141A28;text-decoration:none;
  font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.09em;
  text-transform:uppercase}

/* Morada exata. O preço da porta faz-se no calculador da página
   inicial, que já tem o mapa — aqui só se recolhe o destino. */
.addr{margin-top:20px;padding-top:20px;border-top:1px solid var(--rule)}
.addr label{display:block;font-family:var(--mono);font-size:10px;font-weight:600;
  letter-spacing:.11em;text-transform:uppercase;color:var(--muted);margin-bottom:9px}
.addr-row{display:flex;gap:9px}
.addr-row input{flex:1;min-width:0;height:50px;padding:0 15px;border-radius:13px;
  border:1px solid var(--rule-strong);background:var(--field);color:var(--text);
  font-family:inherit;font-size:15px;outline:none}
.addr-row input:focus{border-color:var(--teal)}
.addr-row button{flex:0 0 auto;height:50px;padding:0 22px;border:0;border-radius:13px;
  background:var(--ink);color:#fff;cursor:pointer;font-family:var(--mono);font-size:11.5px;
  font-weight:600;letter-spacing:.09em;text-transform:uppercase}
html[data-theme="dark"] .addr-row button{background:#E9EDF3;color:#141A28}
.addr-note{margin:10px 0 0;color:var(--muted);font-size:12.5px;line-height:1.55}
@media (max-width:520px){.addr-row{flex-direction:column}.addr-row button{width:100%}}

/* Comparação com as alternativas. */
.cmp{width:100%;border-collapse:collapse;font-size:13.5px;margin:0 0 10px}
.cmp th{text-align:left;font-family:var(--mono);font-size:9.5px;font-weight:600;
  letter-spacing:.11em;text-transform:uppercase;color:var(--muted);
  padding:0 14px 10px 0;border-bottom:1px solid var(--rule)}
.cmp td{padding:14px 14px 14px 0;border-bottom:1px solid var(--rule);
  vertical-align:top;line-height:1.6;color:var(--slate)}
html[data-theme="dark"] .cmp td{color:#C3CBD8}
.cmp tr.us td{background:var(--teal-soft);color:var(--text);font-weight:500}
html[data-theme="dark"] .cmp tr.us td{background:rgba(232,163,61,.1)}
.cmp tr.us td:first-child{border-top-left-radius:12px;border-bottom-left-radius:12px;
  padding-left:14px}
.cmp tr.us td:last-child{border-top-right-radius:12px;border-bottom-right-radius:12px}
.cmp .mode{font-weight:600;color:var(--text)}
.cmp .pick{display:inline-block;margin-left:8px;font-family:var(--mono);font-size:8.5px;
  font-weight:600;letter-spacing:.1em;text-transform:uppercase;background:var(--teal);
  color:#fff;border-radius:999px;padding:3px 8px;vertical-align:middle}
html[data-theme="dark"] .cmp .pick{background:var(--amber);color:#141A28}
.cmp-wrap{overflow-x:auto;margin:0 -4px}
@media (max-width:700px){.cmp{min-width:640px}}

.updated{font-family:var(--mono);font-size:10.5px;color:var(--muted);margin:0 0 22px}

.crumb{font-family:var(--mono);font-size:11px;letter-spacing:.05em;color:var(--muted);
  margin-bottom:18px}
.crumb a{color:var(--muted);text-decoration:none}
.crumb a:hover{color:var(--teal)}

@media (max-width:760px){
  .facts{grid-template-columns:1fr 1fr}
  .others{grid-template-columns:1fr}
}
</style>
</head>
<body data-cta-href="/#book" data-cta-label="Get a price">

<main id="main">
<article class="rt">`;
}

const foot = `</article>
</main>
</body>
</html>
`;

// ============================================================
// BLOCOS REUTILIZÁVEIS
// ============================================================

/** A imagem da cidade, ou um gradiente quando ela não existe. */
function hero(airport, tag, title) {
  const inner = `<div class="veil"></div><div class="on">` +
    `<span class="tag">${esc(tag)}</span><h1>${esc(title)}</h1></div>`;

  return airport.image
    ? `<div class="hero"><img src="/assets/img/cities/${esc(airport.image)}.webp" ` +
      `alt="${esc(airport.city)}" width="820" height="300" loading="eager">${inner}</div>`
    : `<div class="hero blank">${inner}</div>`;
}

function jumpNav(items) {
  return '<nav class="jump" aria-label="On this page">' +
    items.map(([id, label], i) =>
      `<a href="#${id}"${i === 0 ? ' class="now"' : ''}>${esc(label)}</a>`).join('') +
    '</nav>';
}

/**
 * O calculador.
 *
 * Os preços são calculados AQUI, ao gerar a página, e ficam no HTML.
 * A resposta é instantânea e não depende da API estar acordada — o
 * Render adormece os serviços gratuitos, e um preço que demora dez
 * segundos a aparecer perde a venda.
 */
function calculator(km, isPT, currency, from, to) {
  const tiers = [
    [4, 'Up to 4', 'Sedan · 3 bags'],
    [8, '5 to 8', 'Van · 8 bags'],
    [13, '9 to 13', 'Minibus'],
    [16, '14 to 16', 'Coach']
  ].map(([pax, label, sub]) => ({
    pax, label, sub, price: Math.round(priceEUR(km, pax, isPT))
  }));

  return `<section class="calc" id="price">
    <h2>What it costs</h2>
    <p class="note">One fixed price for the whole car, not per person. Tolls, taxes and
    60 minutes of airport waiting are in. Nothing is added at the end.</p>

    <div class="pax" role="group" aria-label="Number of passengers">
      ${tiers.map((t, i) => `<button type="button" data-price="${t.price}"${
        i === 0 ? ' class="on"' : ''} data-pax="${t.pax}"><b>${esc(t.label)}</b><span>${esc(t.sub)}</span></button>`).join('')}
    </div>

    <div class="quote">
      <div>
        <div class="k">Fixed price</div>
        <div class="v" id="q">${currency === 'EUR' ? '€' : ''}${tiers[0].price}</div>
        <small>Free cancellation up to 24 hours before pick-up</small>
      </div>
      <a class="btn" id="go" href="/?from=${encodeURIComponent(from)}&amp;to=${
        encodeURIComponent(to)}&amp;pax=1#book">Book this transfer</a>
    </div>

    <div class="addr">
      <label for="hotel">Going to a specific hotel or address?</label>
      <div class="addr-row">
        <input id="hotel" type="text" autocomplete="off"
               placeholder="Hotel name or street in ${esc(to)}">
        <button type="button" id="exact">Price it</button>
      </div>
      <p class="addr-note">The price above covers ${esc(to)}. A specific address is priced
      to the door on the next page &mdash; usually the same, sometimes a few euros either way.</p>
    </div>
  </section>

  <script>
  (function () {
    // Sem rede: os valores já vieram no HTML.
    var box = document.querySelector('.pax');
    var out = document.getElementById('q');
    if (!box || !out) return;

    var pax = 1;

    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-price]');
      if (!b) return;

      box.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      out.textContent = '\u20ac' + b.getAttribute('data-price');
      pax = Number(b.getAttribute('data-pax')) || 1;
      link();
    });

    /**
     * O botão leva a rota consigo.
     *
     * A morada exata é calculada no calculador da página inicial,
     * que já tem o mapa e a ligação ao servidor. Repetir essa
     * lógica aqui seria manter o mesmo preço em dois sítios — e
     * mais cedo ou mais tarde eles divergiam.
     */
    var go = document.getElementById('go');
    var hotel = document.getElementById('hotel');

    function link() {
      if (!go) return;
      var to = (hotel && hotel.value.trim()) || ${JSON.stringify(to)};
      go.href = '/?from=' + encodeURIComponent(${JSON.stringify(from)}) +
        '&to=' + encodeURIComponent(to) + '&pax=' + pax + '#book';
    }

    if (hotel) {
      hotel.addEventListener('input', link);
      hotel.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); link(); go.click(); }
      });
    }

    var exact = document.getElementById('exact');
    if (exact) exact.addEventListener('click', function () { link(); go.click(); });
  })();
  </script>`;
}

/** As alternativas, com a nossa marcada. */
function comparison(airport, cheapest, dest) {
  if (!airport.compare || !airport.compare.length) return '';

  const where = dest ? dest.name : `${airport.city} city centre`;
  const time = dest ? `${dest.minutes} min` : '';

  return `<h2 id="compare">Getting there without us</h2>
  <p>Every option, with what it actually costs and where it hurts. We think the transfer
  wins for most people arriving with luggage — but not for everyone, and the table says why.</p>
  <div class="cmp-wrap"><table class="cmp">
    <thead><tr><th>How</th><th>Time</th><th>Cost</th><th>Good</th><th>Not so good</th></tr></thead>
    <tbody>
      ${airport.compare.map(([mode, t, cost, good, bad]) =>
        `<tr><td class="mode">${esc(mode)}</td><td>${esc(t)}</td><td>${esc(cost)}</td>` +
        `<td>${esc(good)}</td><td>${esc(bad)}</td></tr>`).join('')}
      <tr class="us">
        <td class="mode">Airportlink<span class="pick">Our take</span></td>
        <td>${esc(time || 'Direct')}</td>
        <td>${money(cheapest)} fixed</td>
        <td>Driver waiting with your name, one price for the whole car, flight tracked,
        free cancellation.</td>
        <td>You have to book it before you fly.</td>
      </tr>
    </tbody>
  </table></div>
  <p style="font-size:13px;color:var(--muted)">Public transport fares and taxi estimates are
  for reference and change. Our price is the one you pay.</p>`;
}

/** O que só se sabe tendo lá estado. */
function localInfo(airport) {
  if (!airport.local || !airport.local.length) return '';

  return `<h2 id="local">Before you land</h2>
  ${airport.local.map(([t, body]) =>
    `<h3>${esc(t)}</h3>\n  <p>${esc(body)}</p>`).join('\n  ')}`;
}

// ============================================================
// PÁGINA DE ROTA
// ============================================================

function routePage(country, airport, dest, siblings) {
  const isPT = country.countryCode === 'PT';
  const p1 = priceEUR(dest.km, 1, isPT);
  const p5 = priceEUR(dest.km, 5, isPT);

  const slug = slugOf(airport);
  const cslug = countrySlug(country);
  const url = `${SITE}/transfers/${cslug}/${slug}-to-${dest.slug}`;
  const title = `${airport.city} Airport to ${dest.name} Transfer | From ${money(p1)} | Airportlink`;
  const description =
    `Private transfer from ${airport.name} to ${dest.name}: ${dest.minutes} minutes, ` +
    `${dest.km} km, from ${money(p1)} for up to 4 people. Fixed price, flight tracked, ` +
    `free cancellation up to 24 hours before.`;

  const faq = [
    [`How long does it take to get from ${airport.city} Airport to ${dest.name}?`,
     `About ${dest.minutes} minutes for the ${dest.km} km, outside peak traffic. ` +
     `Your driver knows the route and follows the flight, so a delayed landing moves the ` +
     `pick-up rather than costing you the transfer.`],
    [`How much is a transfer from ${airport.city} Airport to ${dest.name}?`,
     `From ${money(p1)} for up to four passengers, and ${money(p5)} for a group of five ` +
     `to eight in a van. The price is fixed when you book — tolls and taxes included, ` +
     `nothing added at the end.`],
    [`What happens if my flight is late?`,
     `We track the flight number you give us. The driver waits and adjusts to the actual ` +
     `landing time, with 60 minutes of free waiting after the plane touches down.`],
    [`Where do I meet the driver at ${airport.city} Airport?`,
     `In the arrivals hall after you clear customs. The day before your trip we send you ` +
     `the driver's name, phone number and vehicle, and they contact you with the exact spot.`],
    [`Can I cancel?`,
     `Free up to 24 hours before pick-up, refunded in full and automatically. On many ` +
     `routes you can also book without paying and we only charge the card 48 hours before ` +
     `you travel.`]
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': url + '#service',
        name: `Airport transfer from ${airport.name} to ${dest.name}`,
        serviceType: 'Airport transfer',
        provider: { '@type': 'Organization', name: 'Airportlink', url: SITE + '/' },
        areaServed: { '@type': 'Place', name: `${dest.name}, ${country.country}` },
        offers: {
          '@type': 'Offer',
          price: Math.round(p1),
          priceCurrency: country.currency,
          availability: 'https://schema.org/InStock',
          url
        }
      },
      {
        '@type': 'FAQPage',
        '@id': url + '#faq',
        mainEntity: faq.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: airport.name,
            item: `${SITE}/airports/${cslug}/${slug}` },
          { '@type': 'ListItem', position: 3, name: dest.name, item: url }
        ]
      }
    ]
  };

  const others = siblings
    .filter((d) => d.slug !== dest.slug)
    .slice(0, 6)
    .map((d) => {
      const price = priceEUR(d.km, 1, isPT);
      return `<a class="other" href="/transfers/${cslug}/${slug}-to-${d.slug}">` +
        `<b>${esc(d.name)}</b><span>from ${money(price)}</span></a>`;
    }).join('\n      ');

  return head({ title, description, canonical: url, schema }) + `
  <div class="crumb">
    <a href="/">Airportlink</a> &rsaquo;
    <a href="/airports/${cslug}/${slug}">${esc(airport.name)}</a> &rsaquo;
    ${esc(dest.name)}
  </div>

  ${hero(airport, `${airport.iata} · ${country.country}`,
         `${airport.city} Airport to ${dest.name}`)}

  ${jumpNav([['price', 'Price'], ['journey', 'The journey'], ['compare', 'Compare'],
             ['local', 'Before you land'], ['included', 'What is included'],
             ['faq', 'Questions'], ['more', 'Other routes']])}

  <p class="updated">Checked ${today}</p>

  <p class="lead">A private car waiting for you in arrivals, at a price agreed before you
  fly. ${esc(dest.km)} km, about ${esc(dest.minutes)} minutes, no meter and no surprises.</p>

  <div class="facts">
    <div class="fact hero"><div class="k">From</div><div class="v">${money(p1)}</div></div>
    <div class="fact"><div class="k">Journey</div><div class="v">${esc(dest.minutes)} min</div></div>
    <div class="fact"><div class="k">Distance</div><div class="v">${esc(dest.km)} km</div></div>
    <div class="fact"><div class="k">Free wait</div><div class="v">60 min</div></div>
  </div>

  ${calculator(dest.km, isPT, country.currency, airport.name, dest.name)}

  <h2 id="journey">The journey</h2>
  <p>${esc(dest.about)}</p>

  <h2>Arriving at ${esc(airport.name)}</h2>
  <p>${esc(airport.about)}</p>
  ${airport.tips && airport.tips.length
    ? '<ul>' + airport.tips.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>'
    : ''}

  ${comparison(airport, p1, dest)}

  ${localInfo(airport)}

  <h2 id="included">What is included</h2>
  <ul>
    <li><strong>A private vehicle</strong> for your group. No sharing, no other stops.</li>
    <li><strong>A fixed price</strong> with tolls and taxes in. Nothing is added at the end.</li>
    <li><strong>Flight tracking.</strong> Land late and the pick-up moves, not the price.</li>
    <li><strong>60 minutes of free waiting</strong> after the flight lands.</li>
    <li><strong>Free cancellation</strong> until 24 hours before pick-up.</li>
    <li><strong>One suitcase and one piece of hand luggage per passenger.</strong>
    More than that, tell us when you book.</li>
  </ul>

  <h2 id="faq">Questions</h2>
  ${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n  <p>${esc(a)}</p>`).join('\n  ')}

  <h2 id="more">Other transfers from ${esc(airport.city)} Airport</h2>
  <div class="others">
      ${others}
  </div>
  <p style="margin-top:16px"><a href="/airports/${cslug}/${slug}">All
  ${esc(airport.city)} Airport transfers &rsaquo;</a></p>
` + foot;
}

// ============================================================
// PÁGINA DE AEROPORTO
// ============================================================

function airportPage(country, airport) {
  const isPT = country.countryCode === 'PT';
  const slug = slugOf(airport);
  const cslug = countrySlug(country);
  const url = `${SITE}/airports/${cslug}/${slug}`;

  const cheapest = Math.min(...airport.destinations.map((d) => priceEUR(d.km, 1, isPT)));

  const title = `${airport.city} Airport Transfers (${airport.iata}) | From ${money(cheapest)} | Airportlink`;
  const description =
    `Private transfers from ${airport.name} to ${airport.destinations.length} destinations, ` +
    `from ${money(cheapest)}. Fixed prices, flight tracking and a driver waiting in arrivals.`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Airport',
        '@id': url + '#airport',
        name: airport.official || airport.name,
        iataCode: airport.iata,
        address: { '@type': 'PostalAddress', addressLocality: airport.city,
                   addressCountry: country.countryCode }
      },
      {
        '@type': 'ItemList',
        '@id': url + '#routes',
        name: `Transfers from ${airport.name}`,
        itemListElement: airport.destinations.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${airport.city} Airport to ${d.name}`,
          url: `${SITE}/transfers/${cslug}/${slug}-to-${d.slug}`
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: airport.name, item: url }
        ]
      }
    ]
  };

  const rows = airport.destinations
    .slice()
    .sort((a, b) => a.km - b.km)
    .map((d) => {
      const price = priceEUR(d.km, 1, isPT);
      return `<a class="other" href="/transfers/${cslug}/${slug}-to-${d.slug}">` +
        `<b>${esc(d.name)}</b>` +
        `<span>${esc(d.minutes)} min &middot; from ${money(price)}</span></a>`;
    }).join('\n      ');

  // Os outros aeroportos do mesmo país, para o Google perceber a
  // estrutura e para quem chegou ao aeroporto errado.
  const siblings = country.airports
    .filter((a) => a.iata !== airport.iata)
    .map((a) => {
      const s2 = slugOf(a);
      const from = Math.min(...a.destinations.map((d) => priceEUR(d.km, 1, isPT)));
      return `<a class="other" href="/airports/${cslug}/${s2}">` +
        `<b>${esc(a.name)}</b><span>from ${money(from)}</span></a>`;
    }).join('\n      ');

  return head({ title, description, canonical: url, schema }) + `
  <div class="crumb"><a href="/">Airportlink</a> &rsaquo; ${esc(airport.name)}</div>

  ${hero(airport, `${airport.iata} \u00b7 ${country.country}`,
         `${airport.name} transfers`)}

  ${jumpNav([['routes', 'Routes and prices'], ['compare', 'Compare'],
             ['local', 'Before you land'], ['airport', 'The airport']])}

  <p class="updated">Checked ${today}</p>

  <p class="lead">A private car from ${esc(airport.name)} to anywhere you are staying,
  at a price agreed before you fly. ${esc(airport.destinations.length)} routes below, and
  the calculator on the home page prices any address.</p>

  <h2 id="routes">Where people go</h2>
  <p>Prices are for one to four passengers, for the whole car. Larger groups travel in a van
  or minibus, which costs more but is still one fixed price for the group.</p>
  <div class="others">
      ${rows}
  </div>

  <div class="cta">
    <div>
      <strong>Going somewhere not on this list?</strong>
      <span>Enter the address and you have a price in seconds. We drive anywhere our
      partners cover.</span>
    </div>
    <a class="btn" href="/#book">Get a price</a>
  </div>

  ${comparison(airport, cheapest, null)}

  ${localInfo(airport)}

  <h2 id="airport">The airport</h2>
  <p>${esc(airport.about)}</p>
  ${airport.tips && airport.tips.length
    ? '<ul>' + airport.tips.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>'
    : ''}

  ${siblings ? `<h2>Other airports in ${esc(country.country)}</h2>
  <div class="others">
      ${siblings}
  </div>` : ''}
` + foot;
}

// ============================================================
// GERAR
// ============================================================

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const files = fs.readdirSync(SEO_DIR).filter((f) => /^routes-[A-Z]{2}\.json$/.test(f));

if (!files.length) {
  console.error('No routes-XX.json found in seo/. Nothing to do.');
  process.exit(1);
}

ensure(OUT_TRANSFERS);
ensure(OUT_AIRPORTS);

const urls = [];
let routeCount = 0;

for (const file of files) {
  const country = JSON.parse(fs.readFileSync(path.join(SEO_DIR, file), 'utf8'));

  const cslug = countrySlug(country);

  // Uma pasta por país, dos dois lados.
  const transfersDir = path.join(OUT_TRANSFERS, cslug);
  const airportsDir = path.join(OUT_AIRPORTS, cslug);
  ensure(transfersDir);
  ensure(airportsDir);

  for (const airport of country.airports) {
    const slug = slugOf(airport);

    fs.writeFileSync(path.join(airportsDir, slug + '.html'), airportPage(country, airport));
    urls.push({ loc: `${SITE}/airports/${cslug}/${slug}`, priority: '0.8', freq: 'weekly' });

    for (const dest of airport.destinations) {
      const name = `${slug}-to-${dest.slug}.html`;
      fs.writeFileSync(path.join(transfersDir, name),
        routePage(country, airport, dest, airport.destinations));

      urls.push({ loc: `${SITE}/transfers/${cslug}/${slug}-to-${dest.slug}`,
                  priority: '0.7', freq: 'monthly' });
      routeCount += 1;
    }
  }

  console.log(`${country.country}: ${country.airports.length} airports, ` +
              `${country.airports.reduce((t, a) => t + a.destinations.length, 0)} routes`);
}

// ---------- sitemap ----------
//
// As páginas fixas ficam no topo, as geradas por baixo. Reescrito
// por inteiro a cada geração: manter à mão com centenas de linhas
// era garantir que mais cedo ou mais tarde ficava desatualizado.

const fixed = [
  { loc: SITE + '/', priority: '1.0', freq: 'weekly' },
  { loc: SITE + '/travelagents', priority: '0.9', freq: 'monthly' },
  { loc: SITE + '/drivers', priority: '0.9', freq: 'monthly' },
  { loc: SITE + '/support', priority: '0.5', freq: 'monthly' },
  { loc: SITE + '/terms', priority: '0.3', freq: 'yearly' },
  { loc: SITE + '/privacypolicy', priority: '0.3', freq: 'yearly' }
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Gerado por seo/build-routes.js. Não editar à mão. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${fixed.concat(urls).map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

console.log(`\n${routeCount} route pages, ${urls.length - routeCount} airport pages.`);
console.log(`sitemap.xml rewritten with ${fixed.length + urls.length} URLs.`);
console.log('\nNext: commit and push. Then submit the sitemap in Search Console.');
