#!/usr/bin/env node
/**
 * build-pages.js — as páginas fixas nas cinco línguas.
 *
 * O i18n.js traduz a página DEPOIS de ela carregar, no browser. O
 * Google lê o ficheiro como veio do servidor — em inglês, sempre.
 *
 * Por isso um espanhol que procure "traslado aeropuerto Faro" não
 * encontra a homepage: na versão que o Google indexou não há uma
 * palavra em espanhol.
 *
 * Este gerador aplica o dicionário ao HTML e escreve uma cópia por
 * língua, com o texto lá dentro. O seletor de línguas continua a
 * funcionar como está — serve quem já chegou; isto serve quem
 * ainda não.
 *
 *     node seo/build-pages.js
 *
 * Da raiz do site.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.dirname(AQUI);

const SITE = 'https://www.airportlink.app';

/**
 * As línguas que vale a pena gerar.
 *
 * As mesmas das páginas de rota. Há dezassete dicionários, mas
 * gerar dezassete versões de cada página são 221 ficheiros para
 * manter — e as outras doze línguas não têm rotas para onde
 * apontar.
 */
/**
 * As dezassete línguas do seletor.
 *
 * Eram quatro. O seletor oferecia dezoito, e carregar em japonês
 * mandava para /ja/ — que não existia. Um 404 por cada língua que
 * não fosse gerada.
 *
 * Gerar todas custa tempo de build e multiplica as páginas, mas é
 * a única forma de o seletor não mentir. E cada uma é uma página
 * indexável a mais: é assim que se aparece numa pesquisa em
 * japonês.
 */
const LANGS = [
  { code: 'es', prefix: '/es' },
  { code: 'pt', prefix: '/pt' },
  { code: 'de', prefix: '/de' },
  { code: 'fr', prefix: '/fr' },
  { code: 'it', prefix: '/it' },
  { code: 'nl', prefix: '/nl' },
  { code: 'pl', prefix: '/pl' },
  { code: 'da', prefix: '/da' },
  { code: 'ru', prefix: '/ru' },
  { code: 'ar', prefix: '/ar' },
  { code: 'zh', prefix: '/zh' },
  { code: 'ja', prefix: '/ja' },
  { code: 'th', prefix: '/th' },
  { code: 'ko', prefix: '/ko' },
  { code: 'tr', prefix: '/tr' },
  { code: 'sv', prefix: '/sv' },
  { code: 'no', prefix: '/no' }
];

/**
 * As páginas que valem tráfego de pesquisa.
 *
 * Treze páginas fixas existem; só estas três são procuradas no
 * Google. As de conta, checkout e legais não são — ninguém
 * pesquisa "termos e condições airportlink", e indexá-las em cinco
 * línguas seria diluir o site com páginas que ninguém quer.
 */
const PAGINAS = [
  { file: 'index.html', url: '/' },
  { file: 'drivers.html', url: '/drivers' },
  { file: 'travelagents.html', url: '/travelagents' }
];


function dicionario(lang) {
  const p = path.join(RAIZ, 'assets', 'i18n', lang + '.json');

  if (!fs.existsSync(p)) return null;

  return JSON.parse(fs.readFileSync(p, 'utf8'));
}


function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


/**
 * Traduzir o HTML.
 *
 * Percorre as marcas data-i18n e substitui o conteúdo. É o mesmo
 * que o i18n.js faz no browser — só que aqui fica escrito no
 * ficheiro.
 */
function traduzir(html, dict) {
  let out = html;

  /**
   * O conteúdo de cada elemento marcado.
   *
   * A expressão apanha a etiqueta de abertura com o data-i18n, o
   * conteúdo até ao fecho, e o fecho. Elementos aninhados dentro
   * de um marcado não são tocados — o i18n.js também não os toca.
   */
  out = out.replace(
    /(<(\w+)([^>]*\sdata-i18n="([\w.]+)"[^>]*)>)([\s\S]*?)(<\/\2>)/g,
    (todo, abre, tag, attrs, chave, conteudo, fecha) => {
      const t = dict[chave];

      if (t == null) return todo;

      // Se o conteúdo tem etiquetas dentro, não se toca: substituir
      // apagava-as.
      if (/<\w/.test(conteudo)) return todo;

      return abre + esc(t) + fecha;
    }
  );

  // Os placeholders.
  out = out.replace(
    /data-i18n-ph="([\w.]+)"([^>]*?)placeholder="[^"]*"/g,
    (todo, chave, meio) => {
      const t = dict[chave];
      return t == null ? todo
        : `data-i18n-ph="${chave}"${meio}placeholder="${esc(t)}"`;
    }
  );

  // E na ordem inversa, que também aparece.
  out = out.replace(
    /placeholder="[^"]*"([^>]*?)data-i18n-ph="([\w.]+)"/g,
    (todo, meio, chave) => {
      const t = dict[chave];
      return t == null ? todo
        : `placeholder="${esc(t)}"${meio}data-i18n-ph="${chave}"`;
    }
  );

  return out;
}


/**
 * O cabeçalho: lang, canonical, hreflang.
 *
 * Sem isto, as cinco versões parecem cinco páginas com o mesmo
 * conteúdo — e o Google escolhe uma e ignora as outras.
 */
function cabecalho(html, lang, url) {
  let out = html;

  /**
   * A língua e a direção do documento.
   *
   * O árabe escreve-se da direita para a esquerda. O JavaScript
   * põe o dir, mas só depois de a página desenhar — e o visitante
   * vê meio segundo de texto ao contrário.
   *
   * Escrito no HTML, está certo desde o primeiro pixel.
   */
  const RTL = ['ar', 'he', 'fa', 'ur'];
  const dir = RTL.indexOf(lang) !== -1 ? ' dir="rtl"' : '';

  out = out.replace(/<html[^>]*>/, `<html lang="${lang}"${dir}>`);

  const prefixo = lang === 'en'
    ? ''
    : (LANGS.find((l) => l.code === lang) || {}).prefix || '';

  const canonical = `${SITE}${prefixo}${url === '/' ? '/' : url}`;

  // O canonical aponta para esta versão, não para a inglesa.
  out = out.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${canonical}">`
  );

  /**
   * E os alternates, para as cinco versões.
   *
   * O x-default vai para o inglês: é para quem não fala nenhuma
   * das outras.
   */
  const alt = [
    `<link rel="alternate" hreflang="en" href="${SITE}${url === '/' ? '/' : url}">`,
    ...LANGS.map((l) =>
      `<link rel="alternate" hreflang="${l.code}" href="${SITE}${l.prefix}${url === '/' ? '/' : url}">`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${url === '/' ? '/' : url}">`
  ].join('\n');

  // Tirar os que já lá estejam, para não duplicar.
  out = out.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/g, '');

  out = out.replace('</head>', alt + '\n</head>');

  /**
   * E a língua da página, para o i18n.js não a mudar.
   *
   * Sem isto, alguém que tenha inglês guardado abria /es/ e via a
   * página em inglês — a tradução do servidor seria desfeita pela
   * do browser.
   *
   * SUBSTITUI, não acrescenta. O index.html já traz esta linha com
   * "en" lá dentro. Só a acrescentar quando falta, a cópia
   * espanhola ficava a dizer que era inglesa — e o i18n.js
   * traduzia-a de volta.
   */
  const marca = '<script>window.__PAGE_LANG=' +
    JSON.stringify(lang) + ';</script>';

  // Fora, primeiro.
  out = out.replace(
    /<script>\s*window\.__PAGE_LANG\s*=\s*[^<]*<\/script>\n?/g, ''
  );

  /**
   * E no TOPO do head, antes de tudo.
   *
   * O i18n.js carrega sem defer — corre no momento em que o
   * browser o encontra. Se a marca vier depois dele, a variável
   * ainda não existe quando ele a lê, e ele usa a língua guardada
   * em vez desta.
   *
   * Era isso que fazia /es/ abrir em inglês para quem já tinha
   * visitado o site: a página vinha traduzida do servidor e o
   * browser traduzia-a de volta.
   */
  out = out.replace(/(<head[^>]*>)/, '$1\n' + marca);

  return out;
}


/**
 * Os links internos passam a apontar para a mesma língua.
 *
 * Um espanhol que abra /es/ e clique em "Motoristas" deve ir para
 * /es/drivers, não para a versão inglesa. Sem isto, a primeira
 * página é a única traduzida.
 */
function ligacoes(html, prefixo) {
  const internas = ['/', '/drivers', '/travelagents', '/support',
                    '/airports', '/transfers', '/blog'];

  return html.replace(/href="(\/[^"#?]*)"/g, (todo, href) => {
    // As que já têm prefixo de língua, e as de conta, ficam.
    if (/^\/(es|pt|de|fr)\//.test(href)) return todo;
    if (/^\/(login|myaccount|agency|checkout|success|assets|seo)/.test(href)) {
      return todo;
    }

    const bate = internas.some((i) =>
      href === i || href.startsWith(i + '/'));

    if (!bate) return todo;

    return `href="${prefixo}${href === '/' ? '/' : href}"`;
  });
}


// ============================================================
// CORRER
// ============================================================

let escritas = 0;
const falhas = [];

for (const lang of LANGS) {
  const dict = dicionario(lang.code);

  if (!dict) {
    falhas.push(`sem dicionário: ${lang.code}`);
    continue;
  }

  const pasta = path.join(RAIZ, lang.code);
  fs.mkdirSync(pasta, { recursive: true });

  for (const pag of PAGINAS) {
    const origem = path.join(RAIZ, pag.file);

    if (!fs.existsSync(origem)) {
      falhas.push(`sem ficheiro: ${pag.file}`);
      continue;
    }

    let html = fs.readFileSync(origem, 'utf8');

    html = traduzir(html, dict);
    html = cabecalho(html, lang.code, pag.url);
    html = ligacoes(html, lang.prefix);

    fs.writeFileSync(path.join(pasta, pag.file), html);
    escritas += 1;
  }
}


/**
 * E a versão inglesa ganha os hreflang.
 *
 * Sem eles, o Google não sabe que as outras existem — e os
 * hreflang têm de ser recíprocos: se o espanhol aponta para o
 * inglês e o inglês não retribui, a Google ignora os dois.
 */
for (const pag of PAGINAS) {
  const p = path.join(RAIZ, pag.file);

  if (!fs.existsSync(p)) continue;

  let html = fs.readFileSync(p, 'utf8');
  html = cabecalho(html, 'en', pag.url);

  fs.writeFileSync(p, html);
  escritas += 1;
}


/**
 * O sitemap fica com o build-routes.
 *
 * Ele já escreve o static.xml com as páginas fixas, e agora inclui
 * as traduzidas. Escrever um segundo ficheiro seria ter as mesmas
 * URLs em dois sítios — e quando um mudasse, o outro ficava a
 * mentir.
 */

console.log('');
console.log(`${escritas} páginas escritas em ${LANGS.length + 1} línguas.`);
console.log('O sitemap é escrito pelo build-routes.js.');

if (falhas.length) {
  console.log('');
  falhas.forEach((f) => console.log('  ' + f));
}

console.log('');
