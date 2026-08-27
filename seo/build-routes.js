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
// Na RAIZ, com uma subpasta por país.
//
// Estiveram dentro de seo/ e o endereço público dependia de uma
// regra de reescrita no Render. A regra nunca funcionou de forma
// fiável, e uma página que só abre se uma configuração estiver
// certa é uma página que um dia deixa de abrir.
//
// Aqui o caminho do ficheiro É o endereço:
//   transfers/portugal/faro-to-albufeira.html
//   /transfers/portugal/faro-to-albufeira.html
//
// Não é preciso regra nenhuma. A pasta seo/ fica com o gerador e os
// dados, que é para o que serve.
const OUT_TRANSFERS = path.join(ROOT, 'transfers');
const OUT_AIRPORTS = path.join(ROOT, 'airports');
const SITE = 'https://www.airportlink.app';

// A mesma chave que o index.html usa. É pública por natureza — vive
// no browser — e a protecção faz-se no painel do Google, limitando-a
// ao domínio airportlink.app.
const MAPS_KEY = 'AIzaSyBWH1TXxWhFmFo7fMB8NXE4swU2idCc_0M';

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
.hero{position:relative;border-radius:22px;overflow:hidden;margin:0 0 24px;
  background:linear-gradient(140deg,var(--ink),#2A3348 60%,var(--teal));
  height:clamp(150px,20vw,230px)}
/* O site.css tem img{max-width:100%} e isso encolhia a foto dentro
   do bloco, deixando o fundo à vista em cima e em baixo. Preencher
   o contentor por inteiro resolve. */
.hero img{position:absolute;inset:0;width:100%;height:100%;max-width:none;
  object-fit:cover;object-position:center 45%}
.hero .veil{position:absolute;inset:0;
  background:linear-gradient(to top,rgba(12,16,26,.88),rgba(12,16,26,.2) 65%,transparent)}
.hero .on{position:absolute;left:0;right:0;bottom:0;padding:20px 22px}
.hero .on .tag{color:var(--amber);margin-bottom:6px}
.hero .on h1{color:#fff;margin:0;font-size:clamp(24px,3.4vw,34px)}

/* ---------- a calculadora ----------
   Compacta, como as barras de pesquisa de voos: campos de 46px, sem
   caixas dentro de caixas, tudo numa linha. */
.ca{margin:0 0 28px}
.ca-box{display:grid;grid-template-columns:1fr 34px 1fr 88px auto;gap:8px;
  align-items:end;margin-bottom:10px}
.ca-f{display:flex;flex-direction:column;min-width:0}
.ca-f label{font-family:var(--mono);font-size:8.5px;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.ca-f input,.ca-f select{height:46px;padding:0 13px;border-radius:12px;
  border:1px solid var(--rule-strong);background:var(--field);color:var(--text);
  font-family:inherit;font-size:14.5px;font-weight:500;outline:none;width:100%;
  text-overflow:ellipsis;transition:border-color .14s ease,box-shadow .14s ease}
.ca-f input::placeholder{color:var(--muted);font-weight:400}
.ca-f input:focus,.ca-f select:focus{border-color:var(--teal);
  box-shadow:0 0 0 3px rgba(15,118,110,.14)}
html[data-theme="dark"] .ca-f input:focus,html[data-theme="dark"] .ca-f select:focus{
  border-color:var(--amber);box-shadow:0 0 0 3px rgba(232,163,61,.16)}
.ca-f select{-webkit-appearance:none;appearance:none;cursor:pointer;padding-right:28px;
  background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),
    linear-gradient(135deg,var(--muted) 50%,transparent 50%);
  background-position:calc(100% - 14px) 21px,calc(100% - 10px) 21px;
  background-size:4px 4px,4px 4px;background-repeat:no-repeat}

.ca-swap{height:46px;width:34px;border:1px solid var(--rule);border-radius:12px;
  background:var(--surface);color:var(--muted);cursor:pointer;display:flex;
  align-items:center;justify-content:center;transition:color .14s ease,border-color .14s ease}
.ca-swap:hover{color:var(--teal);border-color:var(--teal)}
html[data-theme="dark"] .ca-swap:hover{color:var(--amber);border-color:var(--amber)}
.ca-swap svg{width:15px;height:15px}

.ca-go{height:46px;padding:0 24px;border:0;border-radius:12px;background:var(--ink);
  color:#fff;cursor:pointer;font-family:var(--mono);font-size:11.5px;font-weight:600;
  letter-spacing:.09em;text-transform:uppercase;white-space:nowrap;
  transition:background .14s ease}
.ca-go:hover{background:var(--teal)}
html[data-theme="dark"] .ca-go{background:var(--amber);color:#141A28}
html[data-theme="dark"] .ca-go:hover{background:#F0B95C}

/* O resultado. Uma linha, não um cartaz. */
.ca-res{display:flex;align-items:center;justify-content:space-between;gap:18px;
  flex-wrap:wrap;background:var(--surface);border:1px solid var(--rule);
  border-radius:14px;padding:14px 18px}
.ca-out{min-width:0;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.ca-out .k{font-family:var(--mono);font-size:8.5px;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);width:100%}
.ca-out .v{font-family:var(--mono);font-size:27px;font-weight:600;letter-spacing:-.03em;
  line-height:1.1}
.ca-out .s{font-size:12.5px;color:var(--muted);line-height:1.5}
.ca-book{flex:0 0 auto;display:inline-flex;align-items:center;height:44px;padding:0 22px;
  border-radius:12px;background:var(--teal);color:#fff;text-decoration:none;
  font-family:var(--mono);font-size:11.5px;font-weight:600;letter-spacing:.08em;
  text-transform:uppercase;white-space:nowrap;transition:transform .14s ease}
.ca-book:hover{transform:translateY(-1px)}
html[data-theme="dark"] .ca-book{background:var(--amber);color:#141A28}
.ca-book.off{display:none}
.ca-n{margin:10px 4px 0;color:var(--muted);font-size:12px;line-height:1.55}

/* A lista de sugestões do Google, com o aspeto do site. */
.pac-container{border-radius:12px;border:1px solid var(--rule-strong);
  box-shadow:0 12px 30px rgba(20,26,40,.16);font-family:var(--body);margin-top:4px;
  background:var(--surface)}
.pac-item{padding:9px 13px;border-top:1px solid var(--rule);font-size:13.5px;
  color:var(--muted);cursor:pointer}
.pac-item:first-child{border-top:0}
.pac-item:hover,.pac-item-selected{background:var(--surface-2)}
.pac-item-query{font-size:14px;color:var(--text)}
.pac-icon{display:none}
.hdpi .pac-logo:after,.pac-logo:after{margin:3px 8px}

@media (max-width:820px){
  .ca-box{grid-template-columns:1fr 1fr;gap:8px}
  .ca-f:first-child,.ca-f:nth-child(3){grid-column:span 2}
  .ca-swap{display:none}
  .ca-go{grid-column:span 1}
}

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
      `alt="${esc(airport.city)}" width="1600" height="600" loading="eager" ` +
      `fetchpriority="high">${inner}</div>`
    : `<div class="hero">${inner}</div>`;
}



/**
 * A calculadora, a sério.
 *
 * Morada livre nos dois campos, com sugestões do Google, distância
 * real da rota e preço calculado com a mesma fórmula do site. Não há
 * preços fixos por rota: há o preço daquela morada.
 *
 * O Google Maps só carrega quando alguém toca num campo. Numa página
 * que vive de pesquisa, a maioria das visitas nunca chega a usar a
 * calculadora — carregar o mapa a todos custaria dinheiro por cada
 * visita e atrasaria a página para toda a gente.
 */
function calculator(airport, current, isPT, mapsKey) {
  const to = current ? current.name : '';

  return `<section class="ca" id="price">
    <div class="ca-box">
      <div class="ca-f">
        <label for="cf">From</label>
        <input id="cf" type="text" value="${esc(airport.name)}" autocomplete="off"
               placeholder="Airport, hotel or address">
      </div>

      <button class="ca-swap" id="swap" type="button" aria-label="Swap pick-up and drop-off">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M7 20l-3-3M17 20V4M17 4l3 3"/></svg>
      </button>

      <div class="ca-f">
        <label for="ct">To</label>
        <input id="ct" type="text" value="${esc(to)}" autocomplete="off"
               placeholder="Hotel, address or town">
      </div>

      <div class="ca-f">
        <label for="cp">Passengers</label>
        <select id="cp">
          ${[1,2,3,4,5,6,7,8,9,10,12,14,16].map((n) =>
            `<option value="${n}"${n === 2 ? ' selected' : ''}>${n}</option>`).join('')}
        </select>
      </div>

      <button class="ca-go" id="cg" type="button">Get price</button>
    </div>

    <div class="ca-res" id="cr">
      <div class="ca-out">
        <span class="k" id="ck">Your price</span>
        <span class="v" id="cv">&mdash;</span>
        <span class="s" id="cs">Enter your drop-off and press Get price</span>
      </div>
      <a class="ca-book off" id="cb" href="/#book">Book now, pay later</a>
    </div>

    <p class="ca-n">No card today. We charge it 48 hours before you travel, and you can
    cancel free up to 24 hours before pick-up.</p>
  </section>

  <script>
  (function () {
    var KEY = ${JSON.stringify(mapsKey)};
    var PT = ${JSON.stringify(isPT)};

    var cf = document.getElementById('cf');
    var ct = document.getElementById('ct');
    var cp = document.getElementById('cp');
    var cg = document.getElementById('cg');
    var cv = document.getElementById('cv');
    var ck = document.getElementById('ck');
    var cs = document.getElementById('cs');
    var cb = document.getElementById('cb');
    if (!cf || !ct) return;

    // ---------- a mesma fórmula do site ----------
    //
    // Se mudares os valores no server.js, muda aqui e no index.html.
    function fare(km, pax) {
      var p = PT ? { base: 40, perKm: 1.60, min: 25, up: 1.0 }
                 : { base: 20, perKm: 3.5, min: 25, up: 1.3 };

      var mult = pax <= 4 ? 1 : pax <= 8 ? 1.7 : pax <= 13 ? 2.5 : 3.2;
      return Math.max(p.min, (p.base + km * p.perKm) * p.up * mult);
    }

    function car(pax) {
      return pax <= 4 ? 'Sedan' : pax <= 8 ? 'Van' : pax <= 13 ? 'Minibus' : 'Coach';
    }

    // ---------- o Google, só quando fizer falta ----------
    var loading = false, ready = false, waiting = null;

    function loadMaps(then) {
      if (ready) return then && then();
      if (then) waiting = then;
      if (loading) return;

      loading = true;
      window.alCalcReady = function () {
        ready = true;
        attach();
        if (waiting) { var f = waiting; waiting = null; f(); }
      };

      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + KEY +
        '&loading=async&libraries=places&callback=alCalcReady&language=en';
      s.async = true;
      document.head.appendChild(s);
    }

    function attach() {
      if (!window.google || !google.maps || !google.maps.places) return;
      [cf, ct].forEach(function (el) {
        var ac = new google.maps.places.Autocomplete(el, { fields: ['formatted_address', 'name'] });
        ac.addListener('place_changed', function () {
          var p = ac.getPlace();
          if (p && (p.formatted_address || p.name)) el.value = p.formatted_address || p.name;
        });
      });
    }

    // Ao tocar num campo, o mapa começa a carregar em segundo plano.
    // Quando a pessoa acabar de escrever já está pronto.
    [cf, ct].forEach(function (el) {
      el.addEventListener('focus', function () { loadMaps(); }, { once: true });
    });

    // ---------- o preço ----------
    function show(k, v, s2, book) {
      ck.textContent = k;
      cv.textContent = v;
      cs.textContent = s2;
      cb.classList.toggle('off', !book);
    }

    function quote() {
      var from = cf.value.trim();
      var to = ct.value.trim();
      var pax = Number(cp.value) || 1;

      if (!from || !to) {
        show('Your price', '\u2014', 'Fill in both ends first', false);
        (from ? ct : cf).focus();
        return;
      }

      show('Working it out', '\u2026', 'Measuring the route', false);

      loadMaps(function () {
        new google.maps.DirectionsService().route({
          origin: from, destination: to,
          travelMode: google.maps.TravelMode.DRIVING
        }, function (res, status) {
          if (status !== 'OK' || !res.routes.length) {
            show('No route', '\u2014',
              'We could not find a road between those two. Check the spelling, or try the ' +
              'town name.', false);
            return;
          }

          var leg = res.routes[0].legs[0];
          var km = leg.distance.value / 1000;
          var price = Math.round(fare(km, pax));

          show('Your price', '\u20ac' + price,
            car(pax) + ' \u00b7 ' + km.toFixed(0) + ' km \u00b7 ' + leg.duration.text +
            ' \u00b7 whole car', true);

          cb.href = '/?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to) +
            '&pax=' + pax + '#book';
        });
      });
    }

    cg.addEventListener('click', quote);
    cp.addEventListener('change', function () { if (cb.href.indexOf('to=') > -1) quote(); });

    [cf, ct].forEach(function (el) {
      el.addEventListener('focus', function () { this.select(); });
      el.addEventListener('keydown', function (e) {
        // O Enter enquanto a lista de sugestões está aberta escolhe a
        // sugestão; só o segundo Enter é que pede o preço.
        if (e.key === 'Enter') {
          e.preventDefault();
          setTimeout(quote, 120);
        }
      });
    });

    document.getElementById('swap').addEventListener('click', function () {
      var t = cf.value; cf.value = ct.value; ct.value = t;
      if (cb.href.indexOf('to=') > -1) quote();
    });
  })();
  </script>`;
}

/**
 * Quanto tempo antes reservar.
 *
 * Ninguém no setor responde a isto, e é das primeiras coisas que
 * alguém pensa ao planear. Uma pergunta com resposta útil e sem
 * concorrência é exatamente o que faz uma página ser encontrada.
 */
function whenToBook(dest) {
  const far = dest.km > 60;

  return `<h2 id="when">When to book</h2>
  <p>You can book up to 30 minutes before pick-up, and there is no discount for booking
  early &mdash; the price is the same in March or the night before. But availability is not.</p>
  <ul>
    <li><strong>July and August, Fridays and Saturdays.</strong> These are the busiest
    arrivals of the year. A week ahead is comfortable; the day before often is not,
    ${far ? 'especially for a run this long' : 'especially for larger groups'}.</li>
    <li><strong>Groups of five or more.</strong> Vans are the first thing to run out.
    Book these as soon as you have the flight.</li>
    <li><strong>Arrivals between 23:00 and 06:00.</strong> Fewer drivers are working, so
    the window is tighter. Two or three days ahead.</li>
    <li><strong>Everything else.</strong> A day ahead is usually fine, and the same
    morning often works.</li>
  </ul>
  <p>Cancellation is free until 24 hours before, so booking early costs you nothing if
  the plan changes.</p>`;
}

/**
 * O tempo real, não o do mapa.
 *
 * O Google Maps diz o tempo a conduzir. O que interessa a quem
 * chega é o tempo desde a aterragem — e a diferença é o controlo de
 * passaportes e a bagagem, que costuma ser mais do que a viagem.
 */
function realTime(airport, dest) {
  const drive = dest.minutes;

  return `<h2 id="timing">How long it really takes</h2>
  <p>Maps will tell you ${drive} minutes, and that is the driving. Door to door from the
  moment your wheels touch the runway is a different number, and it is worth planning
  around the right one.</p>
  <ul>
    <li><strong>Taxiing and disembarking:</strong> 10 to 15 minutes.</li>
    <li><strong>Passport control:</strong> nothing inside the Schengen area; 15 to 45
    minutes arriving from outside it, and the upper end is real in summer.</li>
    <li><strong>Baggage reclaim:</strong> 10 to 25 minutes with hold luggage, none with
    hand luggage only.</li>
    <li><strong>Finding your driver:</strong> 2 to 5 minutes. They have your name on a
    sign and your phone number.</li>
    <li><strong>The drive:</strong> ${drive} minutes.</li>
  </ul>
  <p>So a realistic door-to-door figure is <strong>${drive + 30} to ${drive + 75}
  minutes</strong> after landing. If someone is expecting you, that is the number to give
  them &mdash; not the ${drive}.</p>`;
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
      return `<a class="other" href="/transfers/${cslug}/${slug}-to-${d.slug}/">` +
        `<b>${esc(d.name)}</b><span>from ${money(price)}</span></a>`;
    }).join('\n      ');

  return head({ title, description, canonical: url, schema }) + `
  <div class="crumb">
    <a href="/">Airportlink</a> &rsaquo;
    <a href="/airports/${cslug}/${slug}/">${esc(airport.name)}</a> &rsaquo;
    ${esc(dest.name)}
  </div>

  ${hero(airport, `${airport.iata} · ${country.country}`,
         `${airport.city} Airport to ${dest.name}`)}


  ${calculator(airport, dest, isPT, MAPS_KEY)}

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

  <h2 id="journey">The journey</h2>
  <p>${esc(dest.about)}</p>

  <h2>Arriving at ${esc(airport.name)}</h2>
  <p>${esc(airport.about)}</p>
  ${airport.tips && airport.tips.length
    ? '<ul>' + airport.tips.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>'
    : ''}

  ${realTime(airport, dest)}

  ${whenToBook(dest)}

  ${localInfo(airport)}

  <h2 id="faq">Questions</h2>
  ${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n  <p>${esc(a)}</p>`).join('\n  ')}

  <h2 id="more">Other transfers from ${esc(airport.city)} Airport</h2>
  <div class="others">
      ${others}
  </div>
  <p style="margin-top:16px"><a href="/airports/${cslug}/${slug}/">All
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
      return `<a class="other" href="/transfers/${cslug}/${slug}-to-${d.slug}/">` +
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
      return `<a class="other" href="/airports/${cslug}/${s2}/">` +
        `<b>${esc(a.name)}</b><span>from ${money(from)}</span></a>`;
    }).join('\n      ');

  return head({ title, description, canonical: url, schema }) + `
  <div class="crumb"><a href="/">Airportlink</a> &rsaquo; ${esc(airport.name)}</div>

  ${hero(airport, `${airport.iata} \u00b7 ${country.country}`,
         `${airport.name} transfers`)}


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

    // Cada página é uma PASTA com um index.html lá dentro.
    //
    // É o que dá um endereço limpo sem depender de regra nenhuma:
    // qualquer servidor, ao receber um pedido para uma pasta, serve
    // o index.html que lá estiver. É a convenção mais antiga da web
    // e não há nada para configurar.
    //
    //   airports/portugal/faro/index.html
    //   /airports/portugal/faro
    ensure(path.join(airportsDir, slug));
    fs.writeFileSync(path.join(airportsDir, slug, 'index.html'),
      airportPage(country, airport));
    urls.push({ loc: `${SITE}/airports/${cslug}/${slug}`, priority: '0.8', freq: 'weekly' });

    for (const dest of airport.destinations) {
      const folder = path.join(transfersDir, `${slug}-to-${dest.slug}`);
      ensure(folder);
      fs.writeFileSync(path.join(folder, 'index.html'),
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
