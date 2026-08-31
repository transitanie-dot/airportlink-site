/**
 * O gerador do blogue.
 *
 * Corre ANTES do build-routes.js, que inclui o sitemap do blogue
 * no índice. No Render:
 *
 *   node seo/build-blog.js && node seo/build-routes.js
 *
 * Usa o mesmo mecanismo das rotas: um ficheiro por língua, hreflang
 * recíproco, e ligações internas que ficam dentro da língua.
 */

import fs from 'fs';
import path from 'path';
import { arte } from './blog-art.js';

/**
 * As rotas, lidas dos mesmos JSON que geram as páginas.
 *
 * Só nomes e contagens — nada de preços. Duplicar a tabela de
 * preços aqui criaria uma segunda fonte de verdade que divergiria
 * da primeira à primeira recalibração.
 */
/**
 * A fórmula de preço, lida do build-routes.js.
 *
 * Extraída em vez de copiada: uma cópia divergiria da original à
 * primeira recalibração, e o blogue passaria a anunciar preços que
 * as páginas de rota já não praticam.
 */
function carregarPrecos() {
  const src = fs.readFileSync(path.join(ROOT, 'seo/build-routes.js'), 'utf8');
  const nomes = ['const PT_ZONES', 'const PT_FALLBACK', 'const ES_ZONES',
                 'const ES_FALLBACK', 'const ES_FIXED', 'function priceEUR'];
  let code = '';
  for (const n of nomes) {
    const i = src.indexOf(n);
    if (i < 0) continue;
    let j = i, d = 0, dentro = false;
    while (j < src.length) {
      const c = src[j];
      if (c === '{') { d++; dentro = true; }
      if (c === '}') { d--; if (dentro && d === 0) { j++; break; } }
      j++;
    }
    code += src.slice(i, j) + (src[j] === ';' ? ';' : '') + '\n';
  }
  try {
    return new Function(code + 'return priceEUR;')();
  } catch (e) {
    console.warn('Blog: pricing unavailable, tables will be skipped.');
    return null;
  }
}

/**
 * Uma tabela de preços reais para um aeroporto.
 *
 * Os números saem da mesma fórmula que gera as páginas de rota, por
 * isso o artigo nunca anuncia um preço diferente do que a pessoa
 * encontra ao clicar.
 */
function tabela(aeroporto, lang, pref, precos) {
  if (!precos) return '';
  const [cc, slug] = aeroporto.split(':');
  const f = cc === 'PT' ? 'seo/routes-PT.json' : 'seo/routes-ES.json';
  const caminho = path.join(ROOT, f);
  if (!fs.existsSync(caminho)) return '';

  const d = JSON.parse(fs.readFileSync(caminho, 'utf8'));
  const a = d.airports.find((x) => x.slug === slug);
  if (!a) return '';

  const cslug = (d.country || '').toLowerCase().replace(/\s+/g, '-');
  const nomeAero = (a.i18n && a.i18n[lang] && a.i18n[lang].name) || a.name;

  const linhas = a.destinations.map((x) => {
    const nome = (x.i18n && x.i18n[lang] && x.i18n[lang].name) || x.name;
    const p = Math.round(precos(x.km, 1, cc, slug, x.slug));
    return `      <a class="tab-row" href="${pref}/transfers/${cslug}/${slug}-to-${x.slug}/">
        <b>${esc(nome)}</b>
        <span>${x.km} km</span>
        <span>${x.minutes} min</span>
        <em>&euro;${p}</em>
      </a>`;
  }).join('\n');

  return `  <section class="ptab">
    <div class="ptab-head">
      <p class="ptab-t">${esc(nomeAero)}</p>
      <p class="ptab-n">${esc(t(lang, 'upTo4'))}</p>
    </div>
    <div class="ptab-cols">
      <span>${esc(t(lang, 'destination'))}</span>
      <span>${esc(t(lang, 'distance'))}</span>
      <span>${esc(t(lang, 'time'))}</span>
      <span>${esc(t(lang, 'price'))}</span>
    </div>
${linhas}
    <p class="ptab-foot">${esc(t(lang, 'tableNote'))}</p>
  </section>`;
}

function lerRotas() {
  const paises = [];
  for (const f of ['seo/routes-PT.json', 'seo/routes-ES.json']) {
    const caminho = path.join(ROOT, f);
    if (!fs.existsSync(caminho)) continue;
    const d = JSON.parse(fs.readFileSync(caminho, 'utf8'));
    paises.push({
      slug: (d.country || '').toLowerCase().replace(/\s+/g, '-'),
      nomes: d.countryI18n || { en: d.country },
      aeroportos: d.airports.map((a) => ({
        slug: a.slug,
        cidade: a.city,
        nomes: Object.fromEntries(
          Object.entries(a.i18n || {}).map(([k, v]) => [k, v.name])
        ),
        n: a.destinations.length
      }))
    });
  }
  return paises;
}

const ROOT = process.cwd();
const SITE = 'https://www.airportlink.app';

const LANGS = [
  { code: 'en', prefix: '' },
  { code: 'es', prefix: '/es' },
  { code: 'pt', prefix: '/pt' },
  { code: 'fr', prefix: '/fr' }
];

const T = {
  en: {
    "upTo4": "Up to 4 passengers, whole car",
    "destination": "Destination",
    "distance": "Distance",
    "time": "Time",
    "price": "From",
    "tableNote": "Tolls and taxes included. Free cancellation until 24 hours before pick-up.",
    "prices": "Prices",
    "coverage": "Where we drive today",
    "airports": "airports",
    "route1": "route",
    "routeN": "routes",
    "deck": "What we built",
    blog: 'Blog',
    title: 'Notes from the road',
    intro: 'What a transfer actually costs, how long it really takes, and the things nobody tells you before you land.',
    back: 'All articles',
    cta: 'Price my transfer',
    ctaLead: 'Enter where you land and where you are going. The price you see is the price you pay.',
    company: 'The company',
    routes: 'Routes in this article',
    prices: 'Prices',
    more: 'More articles',
    minRead: 'min read'
  },
  pt: {
    "upTo4": "Até 4 passageiros, carro inteiro",
    "destination": "Destino",
    "distance": "Distância",
    "time": "Tempo",
    "price": "Desde",
    "tableNote": "Portagens e impostos incluídos. Cancelamento gratuito até 24 horas antes da recolha.",
    "prices": "Preços",
    "coverage": "Onde conduzimos hoje",
    "airports": "aeroportos",
    "route1": "rota",
    "routeN": "rotas",
    "deck": "O que construímos",
    blog: 'Blogue',
    title: 'Notas de viagem',
    intro: 'Quanto custa mesmo um transfer, quanto tempo demora na realidade, e o que ninguém lhe diz antes de aterrar.',
    back: 'Todos os artigos',
    cta: 'Calcular o meu transfer',
    ctaLead: 'Diga onde aterra e para onde vai. O preço que vê é o preço que paga.',
    company: 'A empresa',
    routes: 'Rotas neste artigo',
    prices: 'Preços',
    more: 'Outros artigos',
    minRead: 'min de leitura'
  },
  es: {
    "upTo4": "Hasta 4 pasajeros, coche entero",
    "destination": "Destino",
    "distance": "Distancia",
    "time": "Tiempo",
    "price": "Desde",
    "tableNote": "Peajes e impuestos incluidos. Cancelación gratuita hasta 24 horas antes de la recogida.",
    "prices": "Precios",
    "coverage": "Dónde conducimos hoy",
    "airports": "aeropuertos",
    "route1": "ruta",
    "routeN": "rutas",
    "deck": "Lo que hemos construido",
    blog: 'Blog',
    title: 'Notas de viaje',
    intro: 'Cuánto cuesta de verdad un traslado, cuánto se tarda en realidad, y lo que nadie te cuenta antes de aterrizar.',
    back: 'Todos los artículos',
    cta: 'Calcular mi traslado',
    ctaLead: 'Dinos dónde aterrizas y a dónde vas. El precio que ves es el que pagas.',
    company: 'La empresa',
    routes: 'Rutas en este artículo',
    prices: 'Precios',
    more: 'Otros artículos',
    minRead: 'min de lectura'
  },
  fr: {
    "upTo4": "Jusqu'à 4 passagers, voiture entière",
    "destination": "Destination",
    "distance": "Distance",
    "time": "Durée",
    "price": "Dès",
    "tableNote": "Péages et taxes compris. Annulation gratuite jusqu'à 24 heures avant la prise en charge.",
    "prices": "Prix",
    "coverage": "Où nous roulons aujourd'hui",
    "airports": "aéroports",
    "route1": "trajet",
    "routeN": "trajets",
    "deck": "Ce que nous avons construit",
    blog: 'Blog',
    title: 'Carnet de route',
    intro: "Ce que coûte vraiment un transfert, le temps que cela prend réellement, et ce que personne ne vous dit avant d'atterrir.",
    back: 'Tous les articles',
    cta: 'Calculer mon transfert',
    ctaLead: "Dites-nous où vous atterrissez et où vous allez. Le prix affiché est celui que vous payez.",
    company: "L'entreprise",
    routes: 'Trajets dans cet article',
    prices: 'Prix',
    more: 'Autres articles',
    minRead: 'min de lecture'
  }
};

function t(lang, key) {
  return (T[lang] && T[lang][key]) || T.en[key] || key;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ensure(dir) { fs.mkdirSync(dir, { recursive: true }); }

function dataPorExtenso(iso, lang) {
  const loc = { pt: 'pt-PT', es: 'es-ES', fr: 'fr-FR' }[lang] || 'en-GB';
  return new Date(iso + 'T12:00:00Z').toLocaleDateString(loc, {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

/** Uma estimativa honesta do tempo de leitura. */
function minutos(c) {
  const n = (c.lead + ' ' + c.body.map((b) => b.slice(1).join(' ')).join(' '))
    .split(/\s+/).length;
  return Math.max(2, Math.round(n / 200));
}

/**
 * O CSS do blogue.
 *
 * Vive aqui e não no site.css porque só estas páginas o usam, e
 * porque o blogue tem de poder mudar sem tocar nas páginas de rota.
 * As variáveis da marca vêm do site.css, carregado antes disto.
 */
const estilo = `
/* ------------------------------------------------------------
   O papel do blogue.

   Duas camadas sobrepostas ao fundo, ambas fixas e sem capturar
   cliques: um brilho quente muito ténue no topo, e um grão fino
   por cima. O grão é uma textura SVG gerada pelo próprio browser,
   por isso não pesa um único byte de imagem.

   As opacidades são deliberadamente baixas. Grão a mais lê-se
   como sujidade, não como papel — o efeito deve notar-se se se
   procurar e desaparecer quando se lê.
   ------------------------------------------------------------ */
body{background:var(--bg)}
body::before,body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:0}

body::before{
  background:
    radial-gradient(120% 70% at 50% -10%, rgba(232,163,61,.10), transparent 60%),
    radial-gradient(90% 55% at 12% 4%, rgba(15,118,110,.06), transparent 65%);
}
/* No escuro o âmbar tem de ser mais discreto e o grão tem de
   clarear em vez de escurecer, senão o fundo empasta. */
[data-theme="dark"] body::before{
  background:
    radial-gradient(120% 70% at 50% -10%, rgba(232,163,61,.07), transparent 60%),
    radial-gradient(90% 55% at 12% 4%, rgba(79,179,159,.05), transparent 65%);
}
[data-theme="dark"] body::after{ mix-blend-mode:screen; opacity:.045 }

body::after{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
  opacity:.055;
  mix-blend-mode:multiply;
}

main{position:relative;z-index:1}

/* Nos blocos escuros o grão tem de clarear em vez de escurecer,
   senão empasta. Um segundo passe local resolve. */
.exp,.cta,.hero{position:relative;overflow:hidden}
.exp::after,.cta::after,.hero::after{content:"";position:absolute;inset:0;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n2)' opacity='.5'/%3E%3C/svg%3E");
  opacity:.07;mix-blend-mode:overlay}
.exp>*,.cta>*,.hero>*{position:relative;z-index:1}

/* O grão é textura, não informação: quem pediu menos movimento e
   quem usa contraste elevado passa sem ele. */
@media (prefers-contrast:more){ body::after{display:none} }

.wrap{max-width:1100px;margin:0 auto;padding:0 24px}

.b-head{padding:72px 0 44px;max-width:640px}
.b-head h1{font-family:var(--display);font-size:clamp(38px,6vw,62px);line-height:1.02;
  letter-spacing:-.035em;margin:0 0 18px;color:var(--ink)}
.b-head p{font-size:19px;line-height:1.6;color:var(--muted);margin:0}

.feature{display:block;text-decoration:none;color:inherit;margin:0 0 68px}
.feature-art{border-radius:18px;overflow:hidden;aspect-ratio:1200/460;background:#011B50}
.feature-art svg{width:100%;height:100%;display:block}
.feature-meta{display:flex;align-items:baseline;gap:14px;margin:26px 0 10px}
.feature h2{font-family:var(--display);font-size:clamp(26px,3.6vw,40px);line-height:1.12;
  letter-spacing:-.028em;margin:0 0 12px;color:var(--ink);max-width:17ch}
.feature p{font-size:18px;line-height:1.62;color:var(--muted);margin:0;max-width:58ch}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:44px 32px;
  padding-bottom:96px}
.card{display:block;text-decoration:none;color:inherit}
.card-art{border-radius:14px;overflow:hidden;aspect-ratio:3/2;background:#011B50;
  margin-bottom:18px}
.card-art svg{width:100%;height:100%;display:block}
.card h3{font-family:var(--display);font-size:21px;line-height:1.22;letter-spacing:-.02em;
  margin:10px 0 8px;color:var(--ink)}
.card p{font-size:15px;line-height:1.6;color:var(--muted);margin:0}

.kicker{font-size:13px;font-weight:700;color:var(--teal)}
.stamp{font-size:13px;color:var(--muted)}
.sect{font-family:var(--display);font-size:15px;color:var(--muted);margin:0 0 26px;
  padding-bottom:12px;border-bottom:1px solid var(--rule)}

/* A faixa: a imagem já traz o seu próprio texto gravado, por isso
   o título do artigo vai por baixo em vez de por cima. Sobrepor os
   dois daria dois títulos no mesmo sítio. */
.band{margin:0;background:#EAF0F4;line-height:0}
.band img{width:100%;height:auto;max-height:62vh;object-fit:cover;object-position:center}
.hero-under{padding:40px 0 0}
.hero-under h1{font-family:var(--display);font-size:clamp(32px,5vw,52px);line-height:1.06;
  letter-spacing:-.03em;margin:12px 0 0;color:var(--ink);max-width:20ch}
.hero-under .stamp{margin:16px 0 0}

.hero{position:relative;background:#011B50}
.hero-art{position:absolute;inset:0;overflow:hidden}
.hero-art svg{width:100%;height:100%;display:block}
.hero-veil{position:absolute;inset:0;
  background:linear-gradient(to bottom,rgba(1,27,80,0) 28%,rgba(1,27,80,.86) 100%)}
.hero-in{position:relative;max-width:1100px;margin:0 auto;padding:190px 24px 46px}
.hero h1{font-family:var(--display);font-size:clamp(34px,5.4vw,58px);line-height:1.05;
  letter-spacing:-.032em;margin:14px 0 0;color:#fff;max-width:17ch}
.hero .kicker{color:#F5C24B}
.hero .stamp{color:rgba(255,255,255,.74);margin:18px 0 0}

.art{max-width:680px;margin:0 auto;padding:0 24px 96px}
.lead{font-size:21px;line-height:1.58;color:var(--slate);margin:44px 0 10px;
  padding-bottom:34px;border-bottom:1px solid var(--rule)}
.art h2{font-family:var(--display);font-size:27px;line-height:1.2;letter-spacing:-.02em;
  margin:48px 0 14px;color:var(--ink)}
.art p{font-size:17.5px;line-height:1.75;margin:0 0 20px;color:var(--text)}
.art ul{margin:0 0 22px;padding-left:20px}
.art li{font-size:17.5px;line-height:1.72;margin-bottom:10px}

.pull{margin:42px -28px;padding:34px 30px;background:var(--sage);border-radius:16px}
.pull p{font-family:var(--display);font-size:23px;line-height:1.34;letter-spacing:-.015em;
  color:var(--ink);margin:0}

.routes{margin:42px 0;padding:24px 0 4px;border-top:1px solid var(--rule);
  border-bottom:1px solid var(--rule)}
.routes-t{font-size:13px;font-weight:700;color:var(--teal);margin:0 0 14px}
.route{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:14px 0;text-decoration:none;border-bottom:1px solid var(--rule)}
.route:last-child{border-bottom:0}
.route b{font-size:16.5px;color:var(--ink);font-weight:600}
.route em{font-style:normal;font-size:14.5px;color:var(--teal);flex:0 0 auto}
.route:hover b{color:var(--teal)}

.cta{margin:58px 0 0;padding:38px 34px;border-radius:18px;background:var(--ink);color:#fff}
.cta p{font-size:17px;line-height:1.6;color:rgba(255,255,255,.82);margin:0 0 24px;max-width:38ch}
.cta a{display:inline-block;background:var(--amber);color:#3A2405;padding:14px 26px;
  border-radius:999px;text-decoration:none;font-weight:700;font-size:15.5px}
.cta a:hover{background:#F0B45C}

.tail{max-width:680px;margin:0 auto;padding:0 24px 90px}
.tail a{font-size:15.5px;color:var(--muted);text-decoration:none}
.tail a:hover{color:var(--teal)}


.hero-art img{width:100%;height:100%;object-fit:cover;display:block}
.feature-art img,.card-art img{width:100%;height:100%;object-fit:cover;display:block}

.deck{padding:52px 0 38px;border-bottom:1px solid var(--rule);margin-bottom:12px}
.deck-t{font-family:var(--display);font-size:14px;font-weight:700;color:var(--teal);
  margin:0 0 16px;letter-spacing:.01em}
.lead{font-size:21.5px;line-height:1.56;color:var(--slate);margin:0}

.ptab{margin:44px -28px;padding:26px 28px 20px;background:var(--sage);border-radius:18px}
.ptab-head{display:flex;align-items:baseline;justify-content:space-between;gap:14px;
  flex-wrap:wrap;margin-bottom:18px}
.ptab-t{font-family:var(--display);font-size:19px;margin:0;color:var(--ink)}
.ptab-n{font-size:13px;color:var(--muted);margin:0}
.ptab-cols{display:grid;grid-template-columns:1fr 70px 70px 74px;gap:10px;padding:0 12px 8px;
  font-size:12px;color:var(--muted);border-bottom:1px solid rgba(20,26,40,.14)}
.ptab-cols span:not(:first-child){text-align:right}
.tab-row{display:grid;grid-template-columns:1fr 70px 70px 74px;gap:10px;align-items:baseline;
  padding:13px 12px;text-decoration:none;border-bottom:1px solid rgba(20,26,40,.08);
  border-radius:8px}
.tab-row:hover{background:rgba(255,255,255,.6)}
.tab-row b{font-size:16px;color:var(--ink);font-weight:600}
.tab-row span{font-size:13.5px;color:var(--muted);text-align:right}
.tab-row em{font-style:normal;font-size:17px;color:var(--teal);font-weight:700;text-align:right}
.ptab-foot{font-size:12.5px;color:var(--muted);margin:16px 0 0;line-height:1.5}
@media (max-width:560px){
  .ptab-cols{grid-template-columns:1fr 60px;gap:8px}
  .ptab-cols span:nth-child(2),.ptab-cols span:nth-child(3){display:none}
  .tab-row{grid-template-columns:1fr 60px}
  .tab-row span{display:none}
}

.exp{margin:46px -28px;padding:30px 28px 24px;background:var(--ink);border-radius:18px;color:#fff}
.exp-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;
  flex-wrap:wrap;margin-bottom:22px}
.exp-t{font-family:var(--display);font-size:19px;margin:0;color:#fff}
.exp-n{font-size:13.5px;color:rgba(255,255,255,.6);margin:0}
.exp-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.exp-tab{background:transparent;border:1px solid rgba(255,255,255,.22);color:rgba(255,255,255,.8);
  padding:9px 16px;border-radius:999px;font-size:14.5px;font-weight:600;cursor:pointer;
  font-family:inherit;display:inline-flex;align-items:center;gap:8px}
.exp-tab span{font-size:12px;color:rgba(255,255,255,.5);font-weight:500}
.exp-tab:hover{border-color:rgba(255,255,255,.45)}
.exp-tab.on{background:var(--amber);border-color:var(--amber);color:#3A2405}
.exp-tab.on span{color:rgba(58,36,5,.6)}
.exp-tab:focus-visible{outline:2px solid #F5C24B;outline-offset:2px}
.exp-pane{display:none;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:2px}
.exp-pane.on{display:grid}
.exp-air{display:flex;align-items:baseline;justify-content:space-between;gap:10px;
  padding:11px 14px;border-radius:9px;text-decoration:none;
  background:rgba(255,255,255,.05)}
.exp-air:hover{background:rgba(255,255,255,.11)}
.exp-air b{font-size:15px;color:#fff;font-weight:600}
.exp-air em{font-style:normal;font-size:12.5px;color:rgba(255,255,255,.55);flex:0 0 auto}

@media (max-width:640px){
  .exp{margin:34px 0;padding:24px 20px 20px}
  .deck{padding:38px 0 30px}
  .hero-in{padding:146px 20px 34px}
  .pull{margin:34px 0;padding:26px 22px}
  .b-head{padding:48px 0 32px}
  .cta{padding:30px 24px}
}
@media (prefers-reduced-motion:no-preference){
  .card-art svg,.feature-art svg{transition:transform .5s cubic-bezier(.2,.7,.3,1)}
  .card:hover .card-art svg,.feature:hover .feature-art svg{transform:scale(1.035)}
}
`;

function head({ title, description, canonical, lang, alternates, schema }) {
  const hreflang = (alternates || [])
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.url}">`)
    .join('\n');
  const xdefault = (alternates || []).find((a) => a.lang === 'en');
  const og = `${SITE}/assets/og-square.jpg`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${hreflang}${xdefault ? `\n<link rel="alternate" hreflang="x-default" href="${xdefault.url}">` : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Airportlink">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="stylesheet" href="/assets/site.css">
<script src="/assets/i18n.js"></script>
<script src="/assets/layout.js" defer></script>
<script>
  (function () {
    try {
      var th = localStorage.getItem('airportlink-theme');
      if (th === 'dark' || th === 'light') document.documentElement.setAttribute('data-theme', th);
    } catch (e) {}
    window.__PAGE_LANG = document.documentElement.lang || 'en';
  })();
</script>
${schema ? `<script type="application/ld+json">\n${JSON.stringify(schema, null, 1)}\n</script>` : ''}
<style>${estilo}</style>
</head>
<body>
<main>`;
}

const foot = `
</main>
</body>
</html>
`;

/**
 * O corpo do artigo.
 *
 * As ligações para rotas juntam-se numa faixa própria em vez de
 * ficarem soltas no meio do texto: assim lêem-se como uma lista de
 * preços e não como notas de rodapé.
 */
function corpo(body, pref, lang, paises, precos) {
  const saida = [];
  let rotas = [];

  const despeja = () => {
    if (!rotas.length) return;
    saida.push(`  <nav class="routes">
    <p class="routes-t">${esc(t(lang, 'routes'))}</p>
${rotas.map((r) => `    <a class="route" href="${pref}${r[1]}">
      <b>${esc(r[2])}</b><em>${esc(t(lang, 'prices'))}</em>
    </a>`).join('\n')}
  </nav>`);
    rotas = [];
  };

  for (const b of body) {
    const [tipo, ...resto] = b;
    if (tipo === 'link') { rotas.push(b); continue; }
    despeja();
    if (tipo === 'explorer') { saida.push(explorador(paises || [], lang, pref)); continue; }
    if (tipo === 'prices') { saida.push(tabela(resto[0], lang, pref, precos)); continue; }
    if (tipo === 'h2') saida.push(`  <h2>${esc(resto[0])}</h2>`);
    else if (tipo === 'p') saida.push(`  <p>${esc(resto[0])}</p>`);
    else if (tipo === 'quote') saida.push(`  <aside class="pull"><p>${esc(resto[0])}</p></aside>`);
    else if (tipo === 'ul') {
      saida.push('  <ul>\n' + resto.map((x) => `    <li>${esc(x)}</li>`).join('\n') + '\n  </ul>');
    }
  }
  despeja();
  return saida.join('\n');
}

/**
 * O explorador de cobertura.
 *
 * Um bloco onde a pessoa escolhe o país e vê os aeroportos com o
 * número de rotas de cada um. É o único elemento interativo do
 * artigo, de propósito: um só momento vale mais do que efeitos
 * espalhados, e este leva a pessoa às páginas que interessam.
 *
 * Sem JavaScript continua legível — os painéis existem todos no
 * HTML e o primeiro está aberto.
 */
function explorador(paises, lang, pref) {
  if (!paises.length) return '';
  const id = 'exp';

  const abas = paises.map((p, i) => `      <button class="exp-tab${i === 0 ? ' on' : ''}"
        type="button" data-alvo="${id}-${i}" aria-selected="${i === 0}">
        ${esc(p.nomes[lang] || p.nomes.en)}
        <span>${p.aeroportos.length}</span>
      </button>`).join('\n');

  const paineis = paises.map((p, i) => `    <div class="exp-pane${i === 0 ? ' on' : ''}" id="${id}-${i}">
${p.aeroportos.map((a) => `      <a class="exp-air" href="${pref}/airports/${p.slug}/${a.slug}/">
        <b>${esc(a.nomes[lang] || a.cidade)}</b>
        <em>${a.n} ${esc(t(lang, a.n === 1 ? 'route1' : 'routeN'))}</em>
      </a>`).join('\n')}
    </div>`).join('\n');

  const total = paises.reduce((s2, p) => s2 + p.aeroportos.reduce((x, a) => x + a.n, 0), 0);
  const naer = paises.reduce((s2, p) => s2 + p.aeroportos.length, 0);

  return `  <section class="exp">
    <div class="exp-head">
      <p class="exp-t">${esc(t(lang, 'coverage'))}</p>
      <p class="exp-n">${naer} ${esc(t(lang, 'airports'))} &middot; ${total} ${esc(t(lang, 'routeN'))}</p>
    </div>
    <div class="exp-tabs" role="tablist">
${abas}
    </div>
${paineis}
  </section>`;
}

function postPage(post, lang, alternates, paises, precos) {
  const c = post[lang];
  const pref = LANGS.find((x) => x.code === lang).prefix;
  const url = `${SITE}${pref}/blog/${post.slug}/`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: c.title,
        description: c.desc,
        datePublished: post.date,
        dateModified: post.date,
        inLanguage: lang,
        mainEntityOfPage: url,
        image: `${SITE}/assets/og-square.jpg`,
        author: { '@type': 'Organization', name: 'Airportlink', url: SITE },
        publisher: {
          '@type': 'Organization', name: 'Airportlink', url: SITE,
          logo: { '@type': 'ImageObject', url: `${SITE}/assets/img/logo-dark.png` }
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: t(lang, 'blog'), item: `${SITE}${pref}/blog/` },
          { '@type': 'ListItem', position: 3, name: c.title, item: url }
        ]
      }
    ]
  };

  return head({
    title: `${c.title} | Airportlink`, description: c.desc,
    canonical: url, lang, alternates, schema
  }) + `
${post.heroStyle === 'band' ? `<figure class="band">
  <img src="${post.image}" alt="" width="1400" height="788" fetchpriority="high">
</figure>
<header class="hero-under">
  <div class="wrap">
    <span class="kicker">${esc(t(lang, post.tag || 'company'))}</span>
    <h1>${esc(c.title)}</h1>
    <p class="stamp">${esc(dataPorExtenso(post.date, lang))} &middot; ${minutos(c)} ${esc(t(lang, 'minRead'))}</p>
  </div>
</header>` : `<header class="hero">
  <div class="hero-art">${post.image
    ? `<img src="${post.image}" alt="" width="1600" height="900" fetchpriority="high">`
    : arte(post.slug, post.art || 'noite', true)}</div>
  <div class="hero-veil"></div>
  <div class="hero-in">
    <span class="kicker">${esc(t(lang, post.tag || 'company'))}</span>
    <h1>${esc(c.title)}</h1>
    <p class="stamp">${esc(dataPorExtenso(post.date, lang))} &middot; ${minutos(c)} ${esc(t(lang, 'minRead'))}</p>
  </div>
</header>`}

<article class="art">
  <div class="deck">
    <p class="deck-t">${esc(c.deck || t(lang, 'deck'))}</p>
    <p class="lead">${esc(c.lead)}</p>
  </div>
${corpo(c.body, pref, lang, paises, precos)}

  <div class="cta">
    <p>${esc(t(lang, 'ctaLead'))}</p>
    <a href="${pref}/#book">${esc(t(lang, 'cta'))}</a>
  </div>
</article>

<div class="tail"><a href="${pref}/blog/">&larr; ${esc(t(lang, 'back'))}</a></div>
<script>
  // As abas do explorador. Sem isto os painéis continuam a existir
  // no HTML e o primeiro está aberto, por isso a página é legível
  // mesmo se o script não correr.
  (function () {
    var tabs = document.querySelectorAll('.exp-tab');
    if (!tabs.length) return;
    Array.prototype.forEach.call(tabs, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs, function (o) {
          o.classList.remove('on');
          o.setAttribute('aria-selected', 'false');
        });
        Array.prototype.forEach.call(document.querySelectorAll('.exp-pane'), function (p) {
          p.classList.remove('on');
        });
        b.classList.add('on');
        b.setAttribute('aria-selected', 'true');
        var alvo = document.getElementById(b.dataset.alvo);
        if (alvo) alvo.classList.add('on');
      });
    });
  })();
</script>` + foot;
}

function indexPage(posts, lang, alternates) {
  const pref = LANGS.find((x) => x.code === lang).prefix;
  const url = `${SITE}${pref}/blog/`;
  const meus = posts.filter((p) => p[lang]);
  const [primeiro, ...resto] = meus;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: t(lang, 'title'),
    url,
    inLanguage: lang,
    publisher: { '@type': 'Organization', name: 'Airportlink', url: SITE },
    blogPost: meus.map((p) => ({
      '@type': 'BlogPosting',
      headline: p[lang].title,
      url: `${SITE}${pref}/blog/${p.slug}/`,
      datePublished: p.date
    }))
  };

  const cartao = (p) => `  <a class="card" href="${pref}/blog/${p.slug}/">
    <div class="card-art">${p.image
      ? `<img src="${p.image}" alt="" width="1600" height="900" loading="lazy">`
      : arte(p.slug, p.art || 'costa')}</div>
    <span class="kicker">${esc(t(lang, p.tag || 'company'))}</span>
    <h3>${esc(p[lang].title)}</h3>
    <p>${esc(p[lang].desc)}</p>
  </a>`;

  return head({
    title: `${t(lang, 'title')} | Airportlink`, description: t(lang, 'intro'),
    canonical: url, lang, alternates, schema
  }) + `
<div class="wrap">
  <div class="b-head">
    <h1>${esc(t(lang, 'title'))}</h1>
    <p>${esc(t(lang, 'intro'))}</p>
  </div>

${primeiro ? `  <a class="feature" href="${pref}/blog/${primeiro.slug}/">
    <div class="feature-art">${primeiro.image
      ? `<img src="${primeiro.image}" alt="" width="1600" height="900" loading="lazy">`
      : arte(primeiro.slug, primeiro.art || 'noite', true)}</div>
    <div class="feature-meta">
      <span class="kicker">${esc(t(lang, primeiro.tag || 'company'))}</span>
      <span class="stamp">${esc(dataPorExtenso(primeiro.date, lang))}</span>
    </div>
    <h2>${esc(primeiro[lang].title)}</h2>
    <p>${esc(primeiro[lang].desc)}</p>
  </a>` : ''}

${resto.length ? `  <p class="sect">${esc(t(lang, 'more'))}</p>
  <div class="grid">
${resto.map(cartao).join('\n')}
  </div>` : '<div style="height:70px"></div>'}
</div>` + foot;
}

// ---------- correr ----------

const dados = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo/posts.json'), 'utf8'));
const posts = dados.posts.slice().sort((a, b) => b.date.localeCompare(a.date));
const paises = lerRotas();
const precos = carregarPrecos();

const urls = [];
let n = 0;

for (const post of posts) {
  const langs = LANGS.filter((l) => post[l.code]);
  const alt = langs.map((l) => ({ lang: l.code, url: `${SITE}${l.prefix}/blog/${post.slug}/` }));

  for (const l of langs) {
    const dir = path.join(ROOT, l.prefix.slice(1), 'blog', post.slug);
    ensure(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), postPage(post, l.code, alt, paises, precos));
    urls.push(`${SITE}${l.prefix}/blog/${post.slug}/`);
    n += 1;
  }
}

const comArtigos = LANGS.filter((l) => posts.some((p) => p[l.code]));
const altIndex = comArtigos.map((l) => ({ lang: l.code, url: `${SITE}${l.prefix}/blog/` }));

for (const l of comArtigos) {
  const dir = path.join(ROOT, l.prefix.slice(1), 'blog');
  ensure(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), indexPage(posts, l.code, altIndex));
  urls.push(`${SITE}${l.prefix}/blog/`);
  n += 1;
}

const hoje = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>
`;

ensure(path.join(ROOT, 'sitemaps'));
fs.writeFileSync(path.join(ROOT, 'sitemaps/blog.xml'), sitemap);

console.log(`Blog: ${n} pages across ${comArtigos.length} languages.`);
console.log('sitemaps/blog.xml written.');
