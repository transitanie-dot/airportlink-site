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

@media (max-width:640px){
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
function corpo(body, pref, lang) {
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

function postPage(post, lang, alternates) {
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
<header class="hero">
  <div class="hero-art">${arte(post.slug, post.art || 'noite', true)}</div>
  <div class="hero-veil"></div>
  <div class="hero-in">
    <span class="kicker">${esc(t(lang, post.tag || 'company'))}</span>
    <h1>${esc(c.title)}</h1>
    <p class="stamp">${esc(dataPorExtenso(post.date, lang))} &middot; ${minutos(c)} ${esc(t(lang, 'minRead'))}</p>
  </div>
</header>

<article class="art">
  <p class="lead">${esc(c.lead)}</p>
${corpo(c.body, pref, lang)}

  <div class="cta">
    <p>${esc(t(lang, 'ctaLead'))}</p>
    <a href="${pref}/#book">${esc(t(lang, 'cta'))}</a>
  </div>
</article>

<div class="tail"><a href="${pref}/blog/">&larr; ${esc(t(lang, 'back'))}</a></div>` + foot;
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
    <div class="card-art">${arte(p.slug, p.art || 'costa')}</div>
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
    <div class="feature-art">${arte(primeiro.slug, primeiro.art || 'noite', true)}</div>
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

const urls = [];
let n = 0;

for (const post of posts) {
  const langs = LANGS.filter((l) => post[l.code]);
  const alt = langs.map((l) => ({ lang: l.code, url: `${SITE}${l.prefix}/blog/${post.slug}/` }));

  for (const l of langs) {
    const dir = path.join(ROOT, l.prefix.slice(1), 'blog', post.slug);
    ensure(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), postPage(post, l.code, alt));
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
