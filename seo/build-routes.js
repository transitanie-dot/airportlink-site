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
const OUT_TRANSFERS = path.join(ROOT, 'transfers');
const OUT_AIRPORTS = path.join(ROOT, 'airports');
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
// PÁGINA DE ROTA
// ============================================================

function routePage(country, airport, dest, siblings) {
  const isPT = country.countryCode === 'PT';
  const p1 = priceEUR(dest.km, 1, isPT);
  const p5 = priceEUR(dest.km, 5, isPT);

  const url = `${SITE}/transfers/${airport.iata.toLowerCase()}-to-${dest.slug}`;
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
            item: `${SITE}/airports/${airport.iata.toLowerCase()}` },
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
      return `<a class="other" href="/transfers/${airport.iata.toLowerCase()}-to-${d.slug}">` +
        `<b>${esc(d.name)}</b><span>from ${money(price)}</span></a>`;
    }).join('\n      ');

  return head({ title, description, canonical: url, schema }) + `
  <div class="crumb">
    <a href="/">Airportlink</a> &rsaquo;
    <a href="/airports/${airport.iata.toLowerCase()}">${esc(airport.name)}</a> &rsaquo;
    ${esc(dest.name)}
  </div>

  <span class="tag">${esc(airport.iata)} &middot; ${esc(country.country)}</span>
  <h1>${esc(airport.city)} Airport to ${esc(dest.name)}</h1>
  <p class="lead">A private car waiting for you in arrivals, at a price agreed before you
  fly. ${esc(dest.km)} km, about ${esc(dest.minutes)} minutes, no meter and no surprises.</p>

  <div class="facts">
    <div class="fact hero"><div class="k">1&ndash;4 people</div><div class="v">${money(p1)}</div></div>
    <div class="fact"><div class="k">5&ndash;8 people</div><div class="v">${money(p5)}</div></div>
    <div class="fact"><div class="k">Journey</div><div class="v">${esc(dest.minutes)} min</div></div>
    <div class="fact"><div class="k">Distance</div><div class="v">${esc(dest.km)} km</div></div>
  </div>

  <div class="cta">
    <div>
      <strong>See your exact price</strong>
      <span>Enter your hotel address and the number of passengers &mdash; the price you see
      is the price you pay.</span>
    </div>
    <a class="btn" href="/#book">Get a price</a>
  </div>

  <h2>The journey</h2>
  <p>${esc(dest.about)}</p>

  <h2>Arriving at ${esc(airport.name)}</h2>
  <p>${esc(airport.about)}</p>
  ${airport.tips && airport.tips.length
    ? '<ul>' + airport.tips.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>'
    : ''}

  <h2>What is included</h2>
  <ul>
    <li><strong>A private vehicle</strong> for your group. No sharing, no other stops.</li>
    <li><strong>A fixed price</strong> with tolls and taxes in. Nothing is added at the end.</li>
    <li><strong>Flight tracking.</strong> Land late and the pick-up moves, not the price.</li>
    <li><strong>60 minutes of free waiting</strong> after the flight lands.</li>
    <li><strong>Free cancellation</strong> until 24 hours before pick-up.</li>
    <li><strong>One suitcase and one piece of hand luggage per passenger.</strong>
    More than that, tell us when you book.</li>
  </ul>

  <h2>Questions</h2>
  ${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n  <p>${esc(a)}</p>`).join('\n  ')}

  <h2>Other transfers from ${esc(airport.city)} Airport</h2>
  <div class="others">
      ${others}
  </div>
  <p style="margin-top:16px"><a href="/airports/${airport.iata.toLowerCase()}">All
  ${esc(airport.city)} Airport transfers &rsaquo;</a></p>
` + foot;
}

// ============================================================
// PÁGINA DE AEROPORTO
// ============================================================

function airportPage(country, airport) {
  const isPT = country.countryCode === 'PT';
  const url = `${SITE}/airports/${airport.iata.toLowerCase()}`;

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
          url: `${SITE}/transfers/${airport.iata.toLowerCase()}-to-${d.slug}`
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
      return `<a class="other" href="/transfers/${airport.iata.toLowerCase()}-to-${d.slug}">` +
        `<b>${esc(d.name)}</b>` +
        `<span>${esc(d.minutes)} min &middot; from ${money(price)}</span></a>`;
    }).join('\n      ');

  return head({ title, description, canonical: url, schema }) + `
  <div class="crumb"><a href="/">Airportlink</a> &rsaquo; ${esc(airport.name)}</div>

  <span class="tag">${esc(airport.iata)} &middot; ${esc(country.country)}</span>
  <h1>${esc(airport.name)} transfers</h1>
  <p class="lead">A private car from ${esc(airport.name)} to anywhere you are staying,
  at a price agreed before you fly. ${esc(airport.destinations.length)} routes below, and
  the calculator prices any address.</p>

  <div class="cta">
    <div>
      <strong>Going somewhere not on this list?</strong>
      <span>Enter the address and you have a price in seconds. We drive anywhere our
      partners cover.</span>
    </div>
    <a class="btn" href="/#book">Get a price</a>
  </div>

  <h2>The airport</h2>
  <p>${esc(airport.about)}</p>
  ${airport.tips && airport.tips.length
    ? '<ul>' + airport.tips.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>'
    : ''}

  <h2>Where people go</h2>
  <p>Prices are for one to four passengers. Larger groups travel in a van, which costs more
  but still one fixed price for the whole group.</p>
  <div class="others">
      ${rows}
  </div>
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

  for (const airport of country.airports) {
    const iata = airport.iata.toLowerCase();

    fs.writeFileSync(path.join(OUT_AIRPORTS, iata + '.html'), airportPage(country, airport));
    urls.push({ loc: `${SITE}/airports/${iata}`, priority: '0.8', freq: 'weekly' });

    for (const dest of airport.destinations) {
      const name = `${iata}-to-${dest.slug}.html`;
      fs.writeFileSync(path.join(OUT_TRANSFERS, name),
        routePage(country, airport, dest, airport.destinations));

      urls.push({ loc: `${SITE}/transfers/${iata}-to-${dest.slug}`,
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
