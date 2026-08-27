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
   Campos em cima num cartão claro, resultado em baixo num cartão do
   mesmo tom mas com o contorno da marca. O escuro estava a competir
   com a fotografia por cima. */
.ca{margin:0 0 30px}
.ca-top{margin-bottom:14px}
.ca-top h2{font-family:var(--display);font-weight:700;font-size:clamp(20px,2.6vw,25px);
  letter-spacing:-.028em;margin:0;padding:0;border:0}

.ca-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;
  background:var(--surface);border:1px solid var(--rule);border-radius:20px;
  padding:16px;margin-bottom:10px}
.ca-f{display:flex;flex-direction:column;min-width:0;grid-column:span 2}
.ca-f.wide{grid-column:span 3}
.ca-f label{font-family:var(--mono);font-size:8.5px;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.ca-f label .hint{font-family:var(--body);font-size:10px;font-weight:400;letter-spacing:0;
  text-transform:none;opacity:.65;margin-left:5px}
.ca-in{position:relative;display:flex;align-items:center}
.ca-pin{position:absolute;left:14px;width:7px;height:7px;border-radius:999px}
.ca-pin.a{background:var(--teal)}
.ca-pin.b{background:var(--amber)}
html[data-theme="dark"] .ca-pin.a{background:var(--amber)}
html[data-theme="dark"] .ca-pin.b{background:var(--teal)}
.ca-in input,.ca-in select{height:46px;padding:0 13px;border-radius:12px;
  border:1px solid var(--rule-strong);background:var(--field);color:var(--text);
  font-family:inherit;font-size:14.5px;font-weight:500;outline:none;width:100%;
  text-overflow:ellipsis;transition:border-color .14s ease,box-shadow .14s ease}
.ca-pin ~ input{padding-left:29px}
.ca-in select{padding-right:26px;-webkit-appearance:none;appearance:none;cursor:pointer;
  font-weight:600;
  background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),
    linear-gradient(135deg,var(--muted) 50%,transparent 50%);
  background-position:calc(100% - 13px) 21px,calc(100% - 9px) 21px;
  background-size:4px 4px,4px 4px;background-repeat:no-repeat}
.ca-in input::placeholder{color:var(--muted);font-weight:400}
.ca-in input::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer}
.ca-in input:focus,.ca-in select:focus{border-color:var(--teal);
  box-shadow:0 0 0 3px rgba(15,118,110,.13)}
html[data-theme="dark"] .ca-in input:focus,html[data-theme="dark"] .ca-in select:focus{
  border-color:var(--amber);box-shadow:0 0 0 3px rgba(232,163,61,.15)}

/* O resultado. Claro, com um traço da marca à esquerda para se ler
   como resposta e não como mais um campo por preencher. */
.ca-out{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;
  background:var(--surface);border:1px solid var(--rule);border-left:3px solid var(--teal);
  border-radius:20px;padding:18px 22px}
html[data-theme="dark"] .ca-out{border-left-color:var(--amber)}
.ca-left{min-width:0}
.ca-veh{display:flex;align-items:center;gap:14px;min-width:0;margin-bottom:12px}
.ca-art{flex:0 0 auto;width:70px;color:var(--slate);opacity:.85}
html[data-theme="dark"] .ca-art{color:#8C97A8}
.ca-art svg{width:100%;height:auto;fill:currentColor}
.ca-art svg .w{fill:var(--surface)}
.ca-vt{min-width:0}
.ca-vt strong{display:block;font-family:var(--display);font-weight:700;font-size:15.5px;
  letter-spacing:-.02em;margin-bottom:3px}
.ca-vt span{display:block;font-size:12px;color:var(--muted);line-height:1.5}

/* As escolhas, em etiquetas. Quem desce a página não perde de vista
   para que dia e para quantas pessoas é o preço que está a ver. */
.ca-chips{display:flex;gap:7px;flex-wrap:wrap}
.chip{background:var(--surface-2);border:1px solid var(--rule);border-radius:999px;
  padding:5px 12px;font-family:var(--mono);font-size:10.5px;font-weight:600;
  letter-spacing:.02em;color:var(--muted);white-space:nowrap}

.ca-pay{text-align:right;min-width:0;flex:0 0 auto}
.ca-pay .k{display:block;font-family:var(--mono);font-size:8.5px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.ca-pay .v{display:block;font-family:var(--mono);font-size:clamp(28px,4vw,34px);
  font-weight:600;letter-spacing:-.035em;line-height:1;color:var(--teal)}
html[data-theme="dark"] .ca-pay .v{color:var(--amber)}
.ca-pay .s{display:block;font-size:11.5px;color:var(--muted);margin-top:7px}
 /* A promessa, por cima do botão. Com a data do pagamento deixa de
   ser uma frase de marketing e passa a ser um compromisso. */
.ca-later{display:block;margin-top:14px;font-size:12.5px;font-weight:600;color:var(--teal)}
html[data-theme="dark"] .ca-later{color:var(--amber)}
.ca-later.off{display:none}

/* O botão diz o que faz, e nada mais. Verde cheio: é a única ação
   da secção e não precisa de competir com nada. */
.ca-book{display:inline-flex;align-items:center;justify-content:center;height:46px;
  padding:0 26px;margin-top:9px;border-radius:13px;background:var(--teal);color:#fff;
  text-decoration:none;font-family:var(--body);font-size:15px;font-weight:600;
  letter-spacing:-.01em;white-space:nowrap;
  transition:transform .14s ease,box-shadow .14s ease;
  box-shadow:0 6px 18px rgba(15,118,110,.28)}
.ca-book:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(15,118,110,.34)}
html[data-theme="dark"] .ca-book{background:var(--amber);color:#141A28;
  box-shadow:0 6px 18px rgba(232,163,61,.26)}
html[data-theme="dark"] .ca-book:hover{box-shadow:0 10px 24px rgba(232,163,61,.32)}
.ca-book.off{display:none}
.ca-n{margin:10px 4px 0;color:var(--muted);font-size:12.5px;line-height:1.55}
.ca-n:empty{margin:0}

/* A lista do que está incluído, com um ícone por linha. Continua a
   ser uma lista, não blocos — só troca o ponto por um desenho. */
.rt ul.ticks{list-style:none;padding:0;margin:0 0 16px}
.rt ul.ticks li{display:flex;gap:12px;align-items:flex-start;padding:9px 0;
  border-bottom:1px solid var(--rule);margin:0}
.rt ul.ticks li:last-child{border-bottom:0}
.rt ul.ticks svg{width:19px;height:19px;flex:0 0 auto;margin-top:2px;color:var(--teal)}
html[data-theme="dark"] .rt ul.ticks svg{color:var(--amber)}
.rt ul.ticks span{flex:1;min-width:0}

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

@media (max-width:900px){
  .ca-grid{grid-template-columns:repeat(4,1fr)}
  .ca-f.wide{grid-column:span 4}
  .ca-f{grid-column:span 2}
  .ca-f:last-child{grid-column:span 4}
  .ca-out{grid-template-columns:1fr;gap:16px}
  .ca-pay{text-align:left;border-top:1px solid var(--rule);padding-top:16px}
  .ca-book{width:100%;justify-content:center}
}
@media (max-width:520px){
  .ca-grid{grid-template-columns:1fr 1fr}
  .ca-f,.ca-f.wide,.ca-f:last-child{grid-column:span 2}
}

/* ---------- blocos das secções de baixo ----------
   Texto corrido de seis parágrafos não se lê numa página vinda de
   uma pesquisa. Em blocos curtos, lê-se de relance. */

/* Os passos do tempo real, numerados. */
.steps{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 18px}
.step{display:flex;gap:12px;align-items:flex-start;background:var(--surface);
  border:1px solid var(--rule);border-radius:14px;padding:13px 15px}
.step .n{flex:0 0 auto;width:24px;height:24px;border-radius:8px;display:flex;
  align-items:center;justify-content:center;background:var(--teal-soft);color:var(--teal);
  font-family:var(--mono);font-size:11px;font-weight:600}
html[data-theme="dark"] .step .n{background:rgba(232,163,61,.13);color:var(--amber)}
.step strong{display:block;font-size:13.5px;font-weight:600;margin-bottom:3px}
.step span{display:block;color:var(--muted);font-size:12.5px;line-height:1.5}

/* Quando reservar, com um travessão colorido por urgência. */
.when{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 16px}
.when-i{background:var(--surface);border:1px solid var(--rule);border-radius:14px;
  padding:14px 16px;border-left:3px solid var(--rule-strong)}
.when-i.bad{border-left-color:#C0392B}
.when-i.warn{border-left-color:var(--amber)}
.when-i.ok{border-left-color:var(--teal)}
.when-i strong{display:block;font-family:var(--display);font-weight:700;font-size:14px;
  letter-spacing:-.015em;margin-bottom:4px}
.when-i span{display:block;color:var(--muted);font-size:12.5px;line-height:1.55}

/* O que só se sabe tendo lá estado. */
.local{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 8px}
.local-i{background:var(--surface);border:1px solid var(--rule);border-radius:15px;
  padding:16px 18px}
.local-i strong{display:block;font-family:var(--display);font-weight:700;font-size:14.5px;
  letter-spacing:-.018em;margin-bottom:6px}
.local-i span{display:block;color:var(--muted);font-size:13px;line-height:1.6}

@media (max-width:700px){
  .steps,.when,.local{grid-template-columns:1fr}
}

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

@media (max-width:900px){
  .ca-grid{grid-template-columns:repeat(4,1fr)}
  .ca-f.wide{grid-column:span 4}
  .ca-f{grid-column:span 2}
  .ca-f:last-child{grid-column:span 4}
  .ca-out{grid-template-columns:1fr;gap:16px}
  .ca-pay{text-align:left;border-top:1px solid rgba(255,255,255,.09);padding-top:16px}
  .ca-book{width:100%;justify-content:center}
}
@media (max-width:520px){
  .ca-grid{grid-template-columns:1fr 1fr}
  .ca-f,.ca-f.wide,.ca-f:last-child{grid-column:span 2}
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
 * A calculadora.
 *
 * O mesmo comportamento da página inicial: distância, duração,
 * veículo e preço atualizam-se enquanto a pessoa mexe nos campos.
 *
 * O Google Maps só carrega ao primeiro toque: numa página de
 * pesquisa, a maioria das visitas nunca usa a calculadora, e
 * carregá-lo a todas custaria dinheiro por visita.
 */
function calculator(airport, current, isPT, mapsKey) {
  const to = current ? current.name : '';

  return `<section class="ca" id="price">
    <div class="ca-top">
      <h2>Price your transfer</h2>
    </div>

    <div class="ca-grid">
      <div class="ca-f wide">
        <label for="cf">Pick-up</label>
        <div class="ca-in"><span class="ca-pin a"></span>
          <input id="cf" type="text" value="${esc(airport.name)}" autocomplete="off"
                 placeholder="Airport, hotel or address"></div>
      </div>

      <div class="ca-f wide">
        <label for="ct">Drop-off</label>
        <div class="ca-in"><span class="ca-pin b"></span>
          <input id="ct" type="text" value="${esc(to)}" autocomplete="off"
                 placeholder="Hotel, address or town"></div>
      </div>

      <div class="ca-f">
        <label for="cdate">Date</label>
        <div class="ca-in"><input id="cdate" type="date"></div>
      </div>

      <div class="ca-f">
        <label for="ctime">Pick-up time</label>
        <div class="ca-in"><input id="ctime" type="time" value="12:00"></div>
      </div>

      <div class="ca-f">
        <label for="cp">Passengers <span class="hint">1 to 16</span></label>
        <div class="ca-in">
          <input id="cp" type="number" min="1" max="16" step="1" value="2">
        </div>
      </div>
    </div>

    <div class="ca-out">
      <div class="ca-left">
        <div class="ca-veh">
          <div class="ca-art" id="cart"></div>
          <div class="ca-vt">
            <strong id="cw">Sedan</strong>
            <span id="cwn">Up to 4 passengers with hand luggage.</span>
          </div>
        </div>

        <!-- O que foi escolhido, repetido aqui. Sem isto, quem
             desce a página perde de vista para que dia reservou. -->
        <div class="ca-chips">
          <span class="chip" id="chDate">&mdash;</span>
          <span class="chip" id="chTime">12:00</span>
          <span class="chip" id="chPax">2 passengers</span>
          <span class="chip" id="chKm">&mdash;</span>
          <span class="chip" id="chDur">&mdash;</span>
        </div>
      </div>

      <div class="ca-pay">
        <span class="k" id="ck">Your price</span>
        <span class="v" id="cv">&mdash;</span>
        <span class="s" id="cs">Whole car &middot; tolls and taxes in</span>

        <!-- A promessa fica por cima do botão, com a data do
             pagamento. O botão diz só o que faz. -->
        <span class="ca-later off" id="cl">Book now, pay later</span>
        <a class="ca-book off" id="cb" href="/#book">Continue &rarr;</a>
      </div>
    </div>

    <p class="ca-n" id="cn"></p>
  </section>

  <script>
  (function () {
    var KEY = ${JSON.stringify(mapsKey)};
    var PT = ${JSON.stringify(isPT)};

    var $$ = function (id) { return document.getElementById(id); };
    var cf = $$('cf'), ct = $$('ct'), cp = $$('cp');
    var cdate = $$('cdate'), ctime = $$('ctime');
    var cw = $$('cw'), cwn = $$('cwn'), cart = $$('cart');
    var chDate = $$('chDate'), chTime = $$('chTime'), chPax = $$('chPax');
    var chKm = $$('chKm'), chDur = $$('chDur');
    var cv = $$('cv'), ck = $$('ck'), cs = $$('cs'), cn = $$('cn'), cb = $$('cb');
    var cl = $$('cl');
    if (!cf || !ct) return;

    // Amanhã: hoje faria metade das reservas serem para daqui a uma
    // hora sem ninguém reparar.
    var t = new Date(); t.setDate(t.getDate() + 1);
    cdate.value = t.toISOString().slice(0, 10);
    cdate.min = new Date().toISOString().slice(0, 10);

    // ---------- a mesma fórmula do site ----------
    function fare(km, pax) {
      var p = PT ? { base: 40, perKm: 1.60, min: 25, up: 1.0 }
                 : { base: 20, perKm: 3.5, min: 25, up: 1.3 };
      var mult = pax <= 4 ? 1 : pax <= 8 ? 1.7 : pax <= 13 ? 2.5 : 3.2;
      return Math.max(p.min, (p.base + km * p.perKm) * p.up * mult);
    }

    /**
     * Os veículos, de perfil.
     *
     * Preenchidos e não em traço: a esta escala, um contorno fino
     * lê-se como um rabisco. As rodas são círculos vazados para se
     * distinguirem da carroçaria sem precisar de mais uma cor.
     */
    var VEHICLES = {
      Sedan: ['Up to 4 passengers with hand luggage.',
        '<svg viewBox="0 0 132 52">' +
        '<path d="M9 40V31c0-2 1-4 3-4l9-1 10-11c2-2 4-3 7-3h25c3 0 5 1 7 3l9 11 25 3c5 1 8 4 8 8v3c0 2-2 4-4 4H13c-2 0-4-2-4-4Z"/>' +
        '<path class="w" d="M38 27 46 17c1-1 2-2 4-2h11v12H38Z"/>' +
        '<path class="w" d="M67 15h11c2 0 3 1 4 2l9 10H67V15Z"/>' +
        '<circle cx="35" cy="41" r="8"/><circle class="w" cx="35" cy="41" r="3.4"/>' +
        '<circle cx="98" cy="41" r="8"/><circle class="w" cx="98" cy="41" r="3.4"/>' +
        '</svg>'],

      Van: ['Up to 8 passengers with a suitcase each.',
        '<svg viewBox="0 0 132 52">' +
        '<path d="M8 40V16c0-3 2-5 5-5h58c2 0 4 1 5 2l19 15 22 4c5 1 8 4 8 8v2c0 2-2 4-4 4H12c-2 0-4-2-4-4Z"/>' +
        '<path class="w" d="M18 16h20v12H18V16Z"/><path class="w" d="M45 16h20v12H45V16Z"/>' +
        '<path class="w" d="M72 16h5l14 12H72V16Z"/>' +
        '<circle cx="34" cy="41" r="8.5"/><circle class="w" cx="34" cy="41" r="3.6"/>' +
        '<circle cx="99" cy="41" r="8.5"/><circle class="w" cx="99" cy="41" r="3.6"/>' +
        '</svg>'],

      Minibus: ['Up to 13 passengers with luggage.',
        '<svg viewBox="0 0 132 52">' +
        '<path d="M6 40V13c0-3 2-5 5-5h108c3 0 5 2 5 5v27c0 2-2 4-4 4H10c-2 0-4-2-4-4Z"/>' +
        '<path class="w" d="M14 14h22v12H14V14Z"/><path class="w" d="M42 14h22v12H42V14Z"/>' +
        '<path class="w" d="M70 14h22v12H70V14Z"/><path class="w" d="M98 14h18v12H98V14Z"/>' +
        '<circle cx="33" cy="41" r="8.5"/><circle class="w" cx="33" cy="41" r="3.6"/>' +
        '<circle cx="100" cy="41" r="8.5"/><circle class="w" cx="100" cy="41" r="3.6"/>' +
        '</svg>'],

      Coach: ['Up to 16 passengers with luggage.',
        '<svg viewBox="0 0 132 52">' +
        '<path d="M4 40V10c0-3 2-5 5-5h114c3 0 5 2 5 5v30c0 2-2 4-4 4H8c-2 0-4-2-4-4Z"/>' +
        '<path class="w" d="M11 11h18v11H11V11Z"/><path class="w" d="M34 11h18v11H34V11Z"/>' +
        '<path class="w" d="M57 11h18v11H57V11Z"/><path class="w" d="M80 11h18v11H80V11Z"/>' +
        '<path class="w" d="M103 11h18v11h-18V11Z"/>' +
        '<circle cx="31" cy="41" r="8.5"/><circle class="w" cx="31" cy="41" r="3.6"/>' +
        '<circle cx="101" cy="41" r="8.5"/><circle class="w" cx="101" cy="41" r="3.6"/>' +
        '</svg>']
    };

    function car(pax) {
      return pax <= 4 ? 'Sedan' : pax <= 8 ? 'Van' : pax <= 13 ? 'Minibus' : 'Coach';
    }

    function drawCar(pax) {
      var name = car(pax);
      cw.textContent = name;
      cwn.textContent = VEHICLES[name][0];
      cart.innerHTML = VEHICLES[name][1];
    }

    // ---------- travão contra abuso ----------
    var CAP_BURST = 10, CAP_TOTAL = 50;

    function quota() {
      try {
        var log = JSON.parse(sessionStorage.getItem('al-q') || '[]');
        var now = Date.now();
        if (log.length >= CAP_TOTAL) return 'total';
        if (log.filter(function (x) { return now - x < 60000; }).length >= CAP_BURST) return 'burst';
        log.push(now);
        sessionStorage.setItem('al-q', JSON.stringify(log.slice(-CAP_TOTAL)));
        return null;
      } catch (e) { return null; }
    }

    // ---------- o Google, só ao primeiro toque ----------
    var loading = false, ready = false, queue = null;

    function maps(then) {
      if (ready) return then && then();
      if (then) queue = then;
      if (loading) return;

      loading = true;
      window.alReady = function () {
        ready = true;
        [cf, ct].forEach(function (el) {
          var ac = new google.maps.places.Autocomplete(el,
            { fields: ['formatted_address', 'name'] });
          ac.addListener('place_changed', function () {
            var p = ac.getPlace();
            if (p) el.value = p.formatted_address || p.name || el.value;
            run();
          });
        });
        if (queue) { var f = queue; queue = null; f(); }
      };

      var sc = document.createElement('script');
      // language=en é obrigatório: sem ele o Google devolve a
      // duração na língua do browser, e uma página em inglês
      // acabava a dizer "40 minutos".
      sc.src = 'https://maps.googleapis.com/maps/api/js?key=' + KEY +
        '&loading=async&libraries=places&callback=alReady&language=en&region=PT';
      sc.async = true;
      document.head.appendChild(sc);
    }

    // ---------- ao vivo ----------
    var lastKey = '', timer = null, km = 0;

    /**
     * A promessa por cima do botão.
     *
     * "Book now, pay later" sozinho é uma frase de marketing. Com a
     * data, passa a ser um compromisso: a pessoa sabe exatamente
     * quando o cartão é debitado.
     */
    function laterLine() {
      if (!cdate.value) return 'Book now, pay later';

      var pick = new Date(cdate.value + 'T' + (ctime.value || '12:00'));
      var at = new Date(pick.getTime() - 48 * 36e5);

      // Menos de 48 horas: não há "depois" nenhum, e prometê-lo
      // seria mentira.
      if (isNaN(at.getTime()) || at < new Date()) return '';

      return 'Book now, pay on ' +
        at.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    }

    /** As etiquetas com o que foi escolhido. */
    function chips() {
      var pax = Number(cp.value) || 1;

      if (cdate.value) {
        var d = new Date(cdate.value + 'T12:00');
        chDate.textContent = isNaN(d) ? '\u2014'
          : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      } else {
        chDate.textContent = '\u2014';
      }

      chTime.textContent = ctime.value || '\u2014';
      chPax.textContent = pax + (pax === 1 ? ' passenger' : ' passengers');
    }

    function paint(price) {
      var pax = Number(cp.value) || 1;
      drawCar(pax);
      chips();

      if (!price) {
        cv.textContent = '\u2014';
        cs.textContent = 'Whole car \u00b7 tolls and taxes in';
        cb.classList.add('off');
        cl.classList.add('off');
        return;
      }

      cv.textContent = '\u20ac' + Math.round(price);
      cs.textContent = 'Whole car \u00b7 tolls and taxes in';

      var later = laterLine();
      cl.textContent = later;
      cl.classList.toggle('off', !later);

      cb.classList.remove('off');
      cb.href = '/?from=' + encodeURIComponent(cf.value.trim()) +
        '&to=' + encodeURIComponent(ct.value.trim()) +
        '&date=' + encodeURIComponent(cdate.value) +
        '&time=' + encodeURIComponent(ctime.value) +
        '&pax=' + pax + '#book';
    }

    function run() {
      var from = cf.value.trim(), to = ct.value.trim();
      var pax = Number(cp.value) || 1;

      if (!from || !to) {
        chKm.textContent = chDur.textContent = '\u2014';
        ck.textContent = 'Your price';
        cn.textContent = '';
        paint(0);
        return;
      }

      // Mudar passageiros, data ou hora não pede rota nova: a
      // distância é a mesma e já a temos.
      var key = from + '|' + to;
      if (key === lastKey && km) { ck.textContent = 'Your price'; paint(fare(km, pax)); return; }

      var stop = quota();
      if (stop) {
        ck.textContent = stop === 'burst' ? 'Slow down' : 'Enough for now';
        cv.textContent = '\u2014';
        cn.textContent = stop === 'burst'
          ? 'That is a lot of routes in one minute. Give it a moment.'
          : 'You have priced plenty of routes. Reload the page to start again.';
        cb.classList.add('off');
        cl.classList.add('off');
        return;
      }

      ck.textContent = 'Working it out';
      cv.textContent = '\u2026';

      maps(function () {
        new google.maps.DirectionsService().route({
          origin: from, destination: to, travelMode: google.maps.TravelMode.DRIVING
        }, function (res, status) {
          if (status !== 'OK' || !res.routes.length) {
            lastKey = ''; km = 0;
            chKm.textContent = chDur.textContent = '\u2014';
            ck.textContent = 'No route';
            cn.textContent = 'We could not find a road between those two. Check the ' +
              'spelling, or try the town name.';
            paint(0);
            return;
          }

          var leg = res.routes[0].legs[0];
          km = leg.distance.value / 1000;
          lastKey = key;

          chKm.textContent = km.toFixed(0) + ' km';
          chDur.textContent = leg.duration.text;
          ck.textContent = 'Your price';
          cn.textContent = '';
          paint(fare(km, pax));
        });
      });
    }

    // Meio segundo depois da última tecla: sem isto pedia-se uma
    // rota por cada letra escrita.
    function later() { clearTimeout(timer); timer = setTimeout(run, 550); }

    [cf, ct].forEach(function (el) {
      el.addEventListener('input', later);
      el.addEventListener('focus', function () { maps(); }, { once: true });
      el.addEventListener('focus', function () { this.select(); });
    });

    cp.addEventListener('change', run);
    cdate.addEventListener('change', function () { paint(km ? fare(km, Number(cp.value) || 1) : 0); });
    ctime.addEventListener('change', function () { paint(km ? fare(km, Number(cp.value) || 1) : 0); });

    drawCar(Number(cp.value) || 1);
    chips();

    // As etiquetas acompanham sempre, mesmo sem preço ainda.
    [cdate, ctime, cp].forEach(function (el) { el.addEventListener('change', chips); });

    // Já vem preenchido, mas espera pelo primeiro gesto: mostrar o
    // resultado logo obrigaria a carregar o Maps a toda a gente.
    var started = false;
    [cf, ct, cp, cdate, ctime].forEach(function (el) {
      el.addEventListener('focus', function () {
        if (started) return;
        started = true;
        if (cf.value.trim() && ct.value.trim()) run();
      });
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
  <p>Booking early costs the same as booking late &mdash; the price does not move. What
  moves is whether there is a car left.</p>

  <div class="when">
    ${[
      ['bad', 'A week ahead',
       `July, August, Fridays and Saturdays. The busiest arrivals of the year${
         far ? ', and a long run like this one is the first to run out' : ''}.`],
      ['bad', 'As soon as you have the flight',
       'Groups of five or more. Vans and minibuses go first, always.'],
      ['warn', 'Two or three days',
       'Landing between 23:00 and 06:00. Fewer drivers are working.'],
      ['ok', 'The day before is fine',
       'Everything else. The same morning usually works too.']
    ].map(([tone, k, v]) => `<div class="when-i ${tone}">
      <strong>${k}</strong><span>${esc(v)}</span>
    </div>`).join('')}
  </div>

  <p>Cancellation is free until 24 hours before, so booking early costs you nothing if the
  plan changes.</p>`;
}

/**
 * O tempo real, não o do mapa.
 *
 * O Google Maps diz o tempo a conduzir. O que interessa a quem
 * chega é o tempo desde a aterragem — e a diferença é o controlo de
 * passaportes e a bagagem, que costuma ser mais do que a viagem.
 */
function realTime(airport, dest) {
  const d = dest.minutes;

  return `<h2 id="timing">How long it really takes</h2>
  <p>Maps says ${d} minutes. That is the driving. Door to door from the moment you land is
  a different number, and it is the one worth planning around.</p>

  <div class="steps">
    ${[
      ['Taxi and disembark', '10&ndash;15 min'],
      ['Passport control', 'None inside Schengen. 15&ndash;45 min from outside it.'],
      ['Baggage reclaim', '10&ndash;25 min with hold luggage'],
      ['Finding your driver', '2&ndash;5 min. Your name on a sign.'],
      ['The drive', `${d} min`]
    ].map(([k, v], i) => `<div class="step">
      <span class="n">${i + 1}</span>
      <div><strong>${k}</strong><span>${v}</span></div>
    </div>`).join('')}
  </div>

  <p><strong>Realistically, ${d + 30} to ${d + 75} minutes after landing.</strong> If
  someone is waiting for you, that is the number to give them.</p>`;
}



/** O que só se sabe tendo lá estado. */
function localInfo(airport) {
  if (!airport.local || !airport.local.length) return '';

  return `<h2 id="local">Before you land</h2>
  <div class="local">
    ${airport.local.map(([t, body]) => `<div class="local-i">
      <strong>${esc(t)}</strong><span>${esc(body)}</span>
    </div>`).join('')}
  </div>`;
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
  <ul class="ticks">
    ${[
      ['M5 17h14M7 17V9l3-4h4l3 4v8M9 5v4M15 5v4',
       'A private vehicle', 'for your group. No sharing, no other stops.'],
      ['M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
       'A fixed price', 'with tolls and taxes in. Nothing is added at the end.'],
      ['M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.4-2.1 2.1-2.4-.6a.5.5 0 0 0-.5.8L5 16l1.3 2.2a.5.5 0 0 0 .8-.1l.6-2.4 2.1-2.1 4.4 3.9a.5.5 0 0 0 .8-.5Z',
       'Flight tracking.', 'Land late and the pick-up moves, not the price.'],
      ['M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
       '60 minutes of free waiting', 'after the flight lands.'],
      ['M9 14l2 2 4-5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
       'Free cancellation', 'until 24 hours before pick-up.'],
      ['M6 8h12l1 12H5L6 8ZM9 8V6a3 3 0 0 1 6 0v2',
       'One suitcase and one bag per passenger.', 'More than that, tell us when you book.']
    ].map(([d, t, rest]) => `<li>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="${d}"/></svg>
      <span><strong>${esc(t)}</strong> ${esc(rest)}</span>
    </li>`).join('')}
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

  <h2 id="faq">FAQ</h2>
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
