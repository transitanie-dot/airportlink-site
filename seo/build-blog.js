/**
 * O gerador do blogue.
 *
 * Corre depois do build-routes.js e usa o mesmo mecanismo: um
 * ficheiro por língua, hreflang recíproco entre elas, e ligações
 * internas que ficam dentro da língua.
 *
 * Um artigo só é gerado numa língua se essa língua estiver no
 * posts.json. Não é preciso que todos existam em todas.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SITE = 'https://www.airportlink.app';

const LANGS = [
  { code: 'en', prefix: '',    locale: 'en_GB' },
  { code: 'es', prefix: '/es', locale: 'es_ES' },
  { code: 'pt', prefix: '/pt', locale: 'pt_PT' },
  { code: 'fr', prefix: '/fr', locale: 'fr_FR' }
];

/** As frases fixas do blogue. O inglês está no código. */
const T = {
  pt: {
    blog: 'Blogue',
    title: 'Blogue da Airportlink',
    intro: 'Preços, rotas e como chegar do aeroporto ao sítio onde vai ficar.',
    back: '← Todos os artigos',
    cta: 'Calcular o meu transfer',
    ctaLead: 'Preço fixo, portagens incluídas, cancelamento gratuito até 24 horas antes.',
    readMore: 'Ler →',
    company: 'A empresa'
  },
  es: {
    blog: 'Blog',
    title: 'Blog de Airportlink',
    intro: 'Precios, rutas y cómo llegar del aeropuerto a donde te alojas.',
    back: '← Todos los artículos',
    cta: 'Calcular mi traslado',
    ctaLead: 'Precio fijo, peajes incluidos, cancelación gratuita hasta 24 horas antes.',
    readMore: 'Leer →',
    company: 'La empresa'
  },
  fr: {
    blog: 'Blog',
    title: 'Le blog Airportlink',
    intro: "Prix, trajets et comment rejoindre votre hébergement depuis l'aéroport.",
    back: '← Tous les articles',
    cta: 'Calculer mon transfert',
    ctaLead: "Prix fixe, péages compris, annulation gratuite jusqu'à 24 heures avant.",
    readMore: 'Lire →',
    company: "L'entreprise"
  },
  en: {
    blog: 'Blog',
    title: 'The Airportlink blog',
    intro: 'Prices, routes, and how to get from the airport to where you are staying.',
    back: '← All articles',
    cta: 'Price my transfer',
    ctaLead: 'Fixed price, tolls included, free cancellation until 24 hours before.',
    readMore: 'Read →',
    company: 'The company'
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

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** A data escrita por extenso, na língua da página. */
function dataPorExtenso(iso, lang) {
  const loc = { pt: 'pt-PT', es: 'es-ES', fr: 'fr-FR' }[lang] || 'en-GB';
  return new Date(iso + 'T12:00:00Z').toLocaleDateString(loc, {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

/**
 * O cabeçalho de uma página do blogue.
 *
 * Deliberadamente igual ao das páginas de rota: o mesmo CSS, o
 * mesmo i18n, o mesmo layout. Um blogue que parece outro site
 * confunde quem lá chega e desperdiça a marca.
 */
function head({ title, description, canonical, lang, alternates, schema, image }) {
  const hreflang = (alternates || [])
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.url}">`)
    .join('\n');
  const xdefault = (alternates || []).find((a) => a.lang === 'en');
  const og = image || `${SITE}/assets/og-square.jpg`;

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
    // A página já está escrita numa língua; o cabeçalho tem de a seguir.
    window.__PAGE_LANG = document.documentElement.lang || 'en';
  })();
</script>
${schema ? `<script type="application/ld+json">\n${JSON.stringify(schema, null, 1)}\n</script>` : ''}
<style>
.post{max-width:720px;margin:0 auto;padding:0 20px 80px}
.post-head{padding:56px 0 28px;border-bottom:1px solid var(--rule)}
.post-tag{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:var(--teal);margin-bottom:14px}
.post h1{font-family:var(--display);font-size:clamp(30px,5vw,44px);line-height:1.12;
  letter-spacing:-.02em;margin:0 0 16px}
.post-date{font-size:14px;color:var(--muted)}
.post-lead{font-size:19px;line-height:1.6;color:var(--slate);margin:26px 0 0}
.post-body{padding-top:8px}
.post-body h2{font-family:var(--display);font-size:24px;letter-spacing:-.01em;
  margin:38px 0 12px}
.post-body p{font-size:17px;line-height:1.72;margin:0 0 18px;color:var(--text)}
.post-body ul{margin:0 0 20px;padding-left:22px}
.post-body li{font-size:17px;line-height:1.7;margin-bottom:8px}
.post-quote{border-left:3px solid var(--amber);padding:4px 0 4px 20px;margin:26px 0;
  font-family:var(--display);font-size:21px;line-height:1.45;color:var(--ink)}
.post-link{display:block;padding:13px 16px;margin:0 0 8px;border:1px solid var(--rule);
  border-radius:10px;text-decoration:none;color:var(--teal);font-weight:600;font-size:16px;
  background:var(--field);transition:border-color .15s}
.post-link:hover{border-color:var(--teal)}
.post-cta{margin:44px 0 0;padding:26px;border:1px solid var(--rule);border-radius:14px;
  background:var(--sage)}
.post-cta p{margin:0 0 16px;font-size:16px;color:var(--slate)}
.post-cta a{display:inline-block;background:var(--teal);color:#fff;padding:12px 22px;
  border-radius:999px;text-decoration:none;font-weight:700;font-size:15px}
.blog-list{max-width:720px;margin:0 auto;padding:56px 20px 80px}
.blog-list h1{font-family:var(--display);font-size:clamp(28px,5vw,40px);margin:0 0 10px}
.blog-intro{font-size:18px;color:var(--muted);margin:0 0 36px}
.blog-item{display:block;padding:22px 0;border-top:1px solid var(--rule);text-decoration:none}
.blog-item h2{font-family:var(--display);font-size:21px;margin:0 0 6px;color:var(--text)}
.blog-item p{margin:0 0 8px;font-size:16px;color:var(--muted);line-height:1.6}
.blog-item span{font-size:13px;color:var(--teal);font-weight:600}
.back{display:inline-block;margin:36px 0 0;font-size:15px;color:var(--muted);
  text-decoration:none}
.back:hover{color:var(--teal)}
</style>
</head>
<body>
<main>`;
}

const foot = `
</main>
</body>
</html>
`;

/** Um bloco do corpo do artigo. */
function bloco(b, pref) {
  const [tipo, ...resto] = b;
  if (tipo === 'h2') return `  <h2>${esc(resto[0])}</h2>`;
  if (tipo === 'p') return `  <p>${esc(resto[0])}</p>`;
  if (tipo === 'quote') return `  <blockquote class="post-quote">${esc(resto[0])}</blockquote>`;
  if (tipo === 'ul') {
    return '  <ul>\n' + resto.map((x) => `    <li>${esc(x)}</li>`).join('\n') + '\n  </ul>';
  }
  if (tipo === 'link') {
    // O prefixo mantém a ligação dentro da língua do artigo.
    return `  <a class="post-link" href="${pref}${resto[0]}">${esc(resto[1])} →</a>`;
  }
  return '';
}

function postPage(post, lang, alternates) {
  const c = post[lang];
  const l = LANGS.find((x) => x.code === lang);
  const pref = l.prefix;
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
<article class="post">
  <div class="post-head">
    ${post.tag ? `<span class="post-tag">${esc(t(lang, post.tag))}</span>` : ''}
    <h1>${esc(c.title)}</h1>
    <div class="post-date">${esc(dataPorExtenso(post.date, lang))}</div>
    <p class="post-lead">${esc(c.lead)}</p>
  </div>

  <div class="post-body">
${c.body.map((b) => bloco(b, pref)).join('\n')}
  </div>

  <div class="post-cta">
    <p>${esc(t(lang, 'ctaLead'))}</p>
    <a href="${pref}/#book">${esc(t(lang, 'cta'))}</a>
  </div>

  <a class="back" href="${pref}/blog/">${esc(t(lang, 'back'))}</a>
</article>` + foot;
}

function indexPage(posts, lang, alternates) {
  const l = LANGS.find((x) => x.code === lang);
  const pref = l.prefix;
  const url = `${SITE}${pref}/blog/`;
  const meus = posts.filter((p) => p[lang]);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: t(lang, 'title'),
    url,
    inLanguage: lang,
    publisher: { '@type': 'Organization', name: 'Airportlink', url: SITE }
  };

  return head({
    title: `${t(lang, 'title')} | Airportlink`, description: t(lang, 'intro'),
    canonical: url, lang, alternates, schema
  }) + `
<div class="blog-list">
  <h1>${esc(t(lang, 'title'))}</h1>
  <p class="blog-intro">${esc(t(lang, 'intro'))}</p>

${meus.map((p) => `  <a class="blog-item" href="${pref}/blog/${p.slug}/">
    <h2>${esc(p[lang].title)}</h2>
    <p>${esc(p[lang].desc)}</p>
    <span>${esc(t(lang, 'readMore'))}</span>
  </a>`).join('\n')}
</div>` + foot;
}

// ---------- correr ----------

const dados = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo/posts.json'), 'utf8'));
const posts = dados.posts.slice().sort((a, b) => b.date.localeCompare(a.date));

const urls = [];
let n = 0;

for (const post of posts) {
  const langs = LANGS.filter((l) => post[l.code]);
  const alt = langs.map((l) => ({
    lang: l.code, url: `${SITE}${l.prefix}/blog/${post.slug}/`
  }));

  for (const l of langs) {
    const dir = path.join(ROOT, l.prefix.slice(1), 'blog', post.slug);
    ensure(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), postPage(post, l.code, alt));
    urls.push(`${SITE}${l.prefix}/blog/${post.slug}/`);
    n += 1;
  }
}

// O índice existe em todas as línguas que tenham pelo menos um artigo.
const comArtigos = LANGS.filter((l) => posts.some((p) => p[l.code]));
const altIndex = comArtigos.map((l) => ({
  lang: l.code, url: `${SITE}${l.prefix}/blog/`
}));

for (const l of comArtigos) {
  const dir = path.join(ROOT, l.prefix.slice(1), 'blog');
  ensure(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), indexPage(posts, l.code, altIndex));
  urls.push(`${SITE}${l.prefix}/blog/`);
  n += 1;
}

// O sitemap do blogue, separado para se poder acompanhar à parte
// no Search Console.
const hoje = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/1999/xhtml/sitemap"
        xmlns:x="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`.replace(/[\s\S]*/, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>
`);

ensure(path.join(ROOT, 'sitemaps'));
fs.writeFileSync(path.join(ROOT, 'sitemaps/blog.xml'), sitemap);

console.log(`Blog: ${n} pages across ${comArtigos.length} languages.`);
console.log('sitemaps/blog.xml written.');
