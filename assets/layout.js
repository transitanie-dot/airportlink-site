/**
 * layout.js — cabeçalho e rodapé partilhados
 * ---------------------------------------------------------------
 * Injeta a mesma barra e o mesmo rodapé em todas as páginas. Mudar
 * o menu passa a ser mudar este ficheiro, e não treze.
 *
 * Corre no <head> com defer, para o cabeçalho existir antes do
 * primeiro paint e a página não saltar.
 *
 * Para acrescentar uma página ao menu: uma linha em NAV ou FOOTER.
 * ---------------------------------------------------------------
 */
/**
 * Google Analytics, com consentimento.
 * ---------------------------------------------------------------
 * O GA4 põe cookies, e na União Europeia isso exige consentimento
 * ANTES de os pôr — não basta avisar que se usam.
 *
 * Por isso o script só é carregado depois de a pessoa aceitar. Um
 * banner que diz "ao continuar aceita" enquanto já mediu tudo não
 * é consentimento nenhum, e é o que a maioria dos sites faz.
 *
 * Aqui e não nas páginas: todas carregam este ficheiro, incluindo
 * as 764 geradas e o blogue. Colar a etiqueta em cada uma seria
 * 776 sítios para mudar de cada vez que a conta mudasse.
 * ---------------------------------------------------------------
 */
(function cookies() {
  var GA_ID = 'G-GTP634FCKN';
  var KEY = 'airportlink-consent';
  var VERSAO = 1;

  function lido() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      // Se a versão mudar — porque passámos a usar outra coisa —
      // pergunta-se outra vez. Consentimento dado para uma coisa
      // não vale para outra.
      return v && v.v === VERSAO ? v : null;
    } catch (e) { return null; }
  }

  function guardar(aceite) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        v: VERSAO, analytics: aceite, at: new Date().toISOString()
      }));
    } catch (e) {}
  }

  function arrancarGA() {
    if (window.gtag) return;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }

  // As frases, nas línguas do site. O banner aparece antes de o
  // i18n carregar o dicionário, por isso trazem-se aqui.
  var T = {
    en: { t: 'Cookies',
          b: 'Some are needed to sign in and pay. One more tells us which pages people ' +
             'read — only if you allow it. The site works the same either way.',
          y: 'Accept all', n: 'Only essentials', p: 'Cookie policy' },
    pt: { t: 'Cookies',
          b: 'Alguns são precisos para entrar e pagar. Outro diz-nos que páginas as pessoas ' +
             'leem — só se permitir. O site funciona igual de qualquer forma.',
          y: 'Aceitar tudo', n: 'Só os essenciais', p: 'Política de cookies' },
    es: { t: 'Cookies',
          b: 'Algunas hacen falta para entrar y pagar. Otra nos dice qué páginas se leen ' +
             '— solo si lo permites. La web funciona igual en ambos casos.',
          y: 'Aceptar todo', n: 'Solo esenciales', p: 'Política de cookies' },
    fr: { t: 'Cookies',
          b: 'Certains sont nécessaires pour se connecter et payer. Un autre nous indique ' +
             'les pages lues — seulement si vous l\u2019autorisez. Le site fonctionne pareil.',
          y: 'Tout accepter', n: 'Essentiels uniquement', p: 'Politique de cookies' },
    de: { t: 'Cookies',
          b: 'Einige sind zum Anmelden und Bezahlen nötig. Ein weiteres zeigt uns, welche ' +
             'Seiten gelesen werden — nur mit Ihrer Erlaubnis. Die Seite funktioniert so oder so.',
          y: 'Alle akzeptieren', n: 'Nur notwendige', p: 'Cookie-Richtlinie' },
    it: { t: 'Cookie',
          b: 'Alcuni servono per accedere e pagare. Un altro ci dice quali pagine vengono ' +
             'lette — solo se lo permetti. Il sito funziona allo stesso modo.',
          y: 'Accetta tutto', n: 'Solo essenziali', p: 'Informativa sui cookie' },
    nl: { t: 'Cookies',
          b: 'Sommige zijn nodig om in te loggen en te betalen. Eén ander laat ons zien ' +
             'welke pagina\u2019s worden gelezen — alleen als u dat toestaat.',
          y: 'Alles accepteren', n: 'Alleen noodzakelijke', p: 'Cookiebeleid' },
    pl: { t: 'Pliki cookie',
          b: 'Niektóre są potrzebne do logowania i płatności. Jeszcze jeden mówi nam, które ' +
             'strony są czytane — tylko za Twoją zgodą.',
          y: 'Akceptuj wszystkie', n: 'Tylko niezbędne', p: 'Polityka plików cookie' }
  };

  function frases() {
    var l = (document.documentElement.lang || '').slice(0, 2).toLowerCase();
    if (T[l]) return T[l];

    try {
      var guardado = localStorage.getItem('airportlink-lang');
      if (guardado && T[guardado]) return T[guardado];
      var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
      if (T[nav]) return T[nav];
    } catch (e) {}

    return T.en;
  }

  function banner() {
    var t = frases();

    var box = document.createElement('div');
    box.className = 'ck-bar';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', t.t);

    box.innerHTML =
      '<div class="ck-in">' +
        '<div class="ck-txt"><strong>' + t.t + '</strong>' +
        '<span>' + t.b + ' <a href="/cookiepolicy">' + t.p + '</a></span></div>' +
        '<div class="ck-btns">' +
          '<button class="ck-no" type="button">' + t.n + '</button>' +
          '<button class="ck-yes" type="button">' + t.y + '</button>' +
        '</div>' +
      '</div>';

    var css = document.createElement('style');
    css.textContent =
      '.ck-bar{position:fixed;left:0;right:0;bottom:0;z-index:9000;' +
        'background:var(--surface,#FBFBF8);border-top:1px solid var(--rule,rgba(20,26,40,.12));' +
        'box-shadow:0 -8px 30px rgba(20,26,40,.10);' +
        'animation:ckUp .32s cubic-bezier(.22,.9,.3,1) both}' +
      '@keyframes ckUp{from{transform:translateY(100%)}to{transform:none}}' +
      '@media (prefers-reduced-motion:reduce){.ck-bar{animation:none}}' +
      '.ck-in{max-width:1100px;margin:0 auto;padding:16px 22px;display:flex;' +
        'align-items:center;gap:22px;flex-wrap:wrap;justify-content:space-between}' +
      '.ck-txt{flex:1 1 320px;min-width:0}' +
      '.ck-txt strong{display:block;font-size:14.5px;font-weight:600;margin-bottom:3px;' +
        'color:var(--text,#141A28)}' +
      '.ck-txt span{display:block;font-size:13px;line-height:1.55;' +
        'color:var(--muted,#606A7B)}' +
      '.ck-txt a{color:var(--teal,#0F766E)}' +
      '.ck-btns{display:flex;gap:10px;flex:0 0 auto}' +
      // Os dois botões com o mesmo peso visual. Um "recusar" em letra
      // cinzenta ao lado de um "aceitar" grande e verde não é uma
      // escolha livre, e é isso que a lei pede.
      '.ck-bar button{padding:11px 22px;border-radius:999px;font:inherit;font-size:14px;' +
        'font-weight:600;cursor:pointer;border:1px solid var(--rule-strong,rgba(20,26,40,.22));' +
        'background:transparent;color:var(--text,#141A28)}' +
      '.ck-bar button:hover{border-color:var(--teal,#0F766E)}' +
      '.ck-yes{background:var(--teal,#0F766E)!important;color:#fff!important;' +
        'border-color:var(--teal,#0F766E)!important}' +
      '@media (max-width:560px){.ck-in{padding:14px 16px}.ck-btns{width:100%}' +
        '.ck-bar button{flex:1}}';

    document.head.appendChild(css);
    document.body.appendChild(box);

    var fechar = function (aceite) {
      guardar(aceite);
      box.remove();
      if (aceite) arrancarGA();
    };

    box.querySelector('.ck-yes').addEventListener('click', function () { fechar(true); });
    box.querySelector('.ck-no').addEventListener('click', function () { fechar(false); });
  }

  var escolha = lido();

  if (escolha) {
    if (escolha.analytics) arrancarGA();
    return;
  }

  // O painel de operações e o portal de motoristas são ferramentas
  // internas com noindex. Um banner de cookies num sítio onde já se
  // fez login é ruído.
  if (document.querySelector('meta[name="robots"][content*="noindex"]')) return;

  if (document.body) banner();
  else document.addEventListener('DOMContentLoaded', banner);

  /**
   * Mudar de ideias.
   *
   * Consentimento que não se pode retirar não é consentimento. O
   * rodapé tem uma ligação para isto.
   */
  window.airportlinkCookies = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  };
})();

(function () {
  'use strict';

  var THEME_KEY = 'airportlink-theme';

  /**
   * O cabeçalho adapta-se ao perfil: um agente vê "Partner
   * dashboard" e não "My account".
   *
   * A pista fica no localStorage e é PURAMENTE COSMÉTICA — decide o
   * texto de um botão e mais nada. Quem pode ver o quê continua a
   * ser decidido pela RLS e pelo servidor, que validam o JWT. Mudar
   * isto na consola muda uma etiqueta, não dá acesso a nada.
   */
  var ROLE_KEY = 'airportlink-role-hint';

  function roleHint() {
    try { return localStorage.getItem(ROLE_KEY) || 'customer'; } catch (e) { return 'customer'; }
  }

  var ACCOUNT_LINK = {
    agent: { href: '/travelagents', label: 'Partner dashboard', i18nKey: 'nav.partnerDash' },
    admin: { href: '/admin', label: 'Operations', i18nKey: 'nav.operations' },
    customer: { href: '/myaccount', label: 'My account', i18nKey: 'nav.myAccount' }
  };

  /**
   * Há sessão?
   *
   * O supabase-js guarda o token no localStorage numa chave que
   * começa por 'sb-' e acaba em '-auth-token'. Procuramos por ela em
   * vez de carregar o supabase-js só para isto — o cabeçalho tem de
   * aparecer antes do primeiro paint e não pode esperar por rede.
   *
   * Cosmético: decide o texto de um botão. Quem entra numa página de
   * conta sem sessão é reencaminhado por essa página, não por aqui.
   */
  function hasSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf('sb-') === 0 && key.indexOf('-auth-token') !== -1) {
          var raw = localStorage.getItem(key);
          if (raw && raw.length > 20) return true;
        }
      }
    } catch (e) {}
    return false;
  }

  var signedIn = hasSession();

  var account = signedIn
    ? (ACCOUNT_LINK[roleHint()] || ACCOUNT_LINK.customer)
    : { href: '/login', label: 'Sign in', i18nKey: 'nav.signIn' };

  // ---------- o menu vive aqui ----------
  var NAV = [
    { href: '/',             label: 'Book a transfer', i18nKey: 'nav.book' },
    { href: '/travelagents', label: 'Travel agents', i18nKey: 'nav.agents' },
    { href: '/drivers',      label: 'Drive with us', i18nKey: 'nav.drivers' },
    { href: '/support',      label: 'Support', i18nKey: 'nav.support' }
  ];

  var FOOTER = [
    { title: 'Book', i18nKey: 'nav.bookShort', links: signedIn
      ? [
          { href: '/#book',     label: 'Get a price', i18nKey: 'nav.getPrice' },
          { href: account.href, label: account.label }
        ]
      : [
          { href: '/#book',         label: 'Get a price', i18nKey: 'nav.getPrice' },
          { href: '/login',         label: 'Sign in', i18nKey: 'nav.signIn' },
          { href: '/createaccount', label: 'Create account', i18nKey: 'nav.createAcc' }
        ]
    },
    { title: 'Partners', i18nKey: 'nav.partners', links: [
      { href: '/travelagents',                   label: 'Travel agents', i18nKey: 'nav.agents' },
      { href: '/drivers',                        label: 'Drive with us', i18nKey: 'nav.drivers' },
      { href: 'https://drivers.airportlink.app', label: 'Partner portal', i18nKey: 'nav.partnerPortal' }
    ]},
    { title: 'Help', i18nKey: 'nav.help', links: [
      { href: '/support',       label: 'Contact support', i18nKey: 'nav.contact' },
      { href: '/blog/',         label: 'Blog', i18nKey: 'nav.blog' },
      // O /forgotpassword não existe: o formulário vive dentro do
      // /login, e um link para uma página inexistente é um 404 no
      // rodapé de todas as páginas.
      { href: '/login',         label: 'Forgot password', i18nKey: 'nav.forgotPass' },
      { href: '/terms',         label: 'Terms', i18nKey: 'nav.terms' },
      { href: '/privacypolicy', label: 'Privacy policy', i18nKey: 'nav.privacy' },
      { href: '/cookiepolicy',  label: 'Cookie policy', i18nKey: 'nav.cookiePolicy' },
      // Consentimento que não se pode retirar não é consentimento.
      // O href='#' com onclick seria mais simples, mas isto mantém
      // a lista toda com a mesma forma.
      { href: '#cookies',       label: 'Cookie settings', i18nKey: 'nav.cookies' }
    ]}
  ];


  // O cabeçalho leva só o nome. O ícone é do rodapé.
  var LOGO = 'AIRPORT<b>LINK</b><span class="dot"></span>';

  /**
   * O seletor de língua, no cabeçalho.
   *
   * A lista vem do i18n.js — é lá que as línguas se acrescentam, e
   * assim não há duas listas a divergir. Com catorze, o menu tem
   * altura máxima e rola.
   */
  var GLOBE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/></svg>';

  var LANGS = (window.i18n && window.i18n.langs) || [{ code: 'en', label: 'English' }];
  var current = (window.i18n && window.i18n.lang) || 'en';

  var LANG_PICK =
    '<div class="lang-wrap">' +
      '<button class="icon-btn lang-btn" id="langBtn" type="button" ' +
        'aria-label="Language" aria-expanded="false" aria-haspopup="true">' +
        GLOBE + '<span class="lang-code">' + current + '</span>' +
      '</button>' +
      '<div class="lang-menu" id="langMenu" role="menu">' +
        LANGS.map(function (l) {
          return '<button type="button" role="menuitem" data-lang="' + l.code + '"' +
            (l.code === current ? ' aria-current="true"' : '') + '>' +
            '<span class="lang-name">' + l.label + '</span>' +
            '<span class="lang-tag">' + l.code + '</span></button>';
        }).join('') +
      '</div>' +
    '</div>';

  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  var BARS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';

  /** O atributo data-i18n, quando o item tem chave. */
  function key(i) {
    return i && i.i18nKey ? ' data-i18n="' + esc(i.i18nKey) + '"' : '';
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // A página diz qual é o seu botão principal com data-cta no <body>.
  // Sem isso, assume "Get a price" a apontar para a homepage.
  var body = document.body;
  var ctaHref = body.getAttribute('data-cta-href') || '/#book';
  var ctaLabel = body.getAttribute('data-cta-label') || 'Get a price';

  var here = window.location.pathname.replace(/\/index\.html$/, '/').replace(/(.)\/$/, '$1');
  if (!here) here = '/';

  function isHere(href) {
    var clean = href.split('#')[0].replace(/(.)\/$/, '$1');
    return clean === here;
  }

  // ---------- cabeçalho ----------
  var header = document.createElement('header');
  header.className = 'site-header';
  header.id = 'siteHeader';
  header.innerHTML =
    '<div class="header-inner">' +
      '<a class="logo" href="/" aria-label="Airportlink home">' + LOGO + '</a>' +
      '<nav class="site-nav" aria-label="Main">' +
        NAV.map(function (i) {
          return '<a href="' + esc(i.href) + '"' + (isHere(i.href) ? ' class="on"' : '') +
            key(i) + '>' + esc(i.label) + '</a>';
        }).join('') +
      '</nav>' +
      '<div class="header-right">' +
        LANG_PICK +
        '<button class="icon-btn" id="themeBtn" type="button" aria-label="Switch theme">' + MOON + '</button>' +
        '<a class="hbtn line" href="' + esc(account.href) + '"' + key(account) + '>' +
          esc(account.label) + '</a>' +
        '<a class="hbtn" href="' + esc(ctaHref) + '" data-i18n="nav.getPrice">' +
          esc(ctaLabel) + '</a>' +
        '<button class="icon-btn burger" id="burger" type="button" aria-label="Menu" ' +
          'aria-expanded="false" aria-controls="mobileMenu">' + BARS + '</button>' +
      '</div>' +
    '</div>';

  var menu = document.createElement('nav');
  menu.className = 'mobile-menu';
  menu.id = 'mobileMenu';
  menu.setAttribute('aria-label', 'Mobile');
  menu.innerHTML =
    NAV.map(function (i) {
      return '<a href="' + esc(i.href) + '"' + key(i) + '>' + esc(i.label) + '</a>';
    }).join('') +
    '<a href="' + esc(account.href) + '"' + key(account) + '>' + esc(account.label) + '</a>' +
    (signedIn ? '' : '<a href="/createaccount">Create account</a>') +
    '<a href="/privacypolicy">Privacy policy</a>' +
    '<a class="hbtn amber" href="' + esc(ctaHref) + '" data-i18n="nav.getPrice">' +
      esc(ctaLabel) + '</a>';

  var skip = document.createElement('a');
  skip.className = 'skip';
  skip.href = '#main';
  skip.textContent = 'Skip to content';
  skip.setAttribute('data-i18n', 'nav.skip');

  body.insertBefore(menu, body.firstChild);
  body.insertBefore(header, body.firstChild);
  body.insertBefore(skip, body.firstChild);

  // ---------- rodapé ----------
  var footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML =
    '<div class="wrap"><div class="footer-grid">' +
      // Sem ligação: o rodapé é onde se está no fim da página, e um
      // logótipo clicável ali leva de volta ao topo de onde já se
      // veio. No cabeçalho faz sentido; aqui não.
      '<div class="footer-brand"><span class="logo">' + LOGO + '</span>' +
      '<p data-i18n="foot.blurb">Private airport transfers with a fixed price agreed ' +
      'before you pay. Door to door, flight tracked, driven by licensed local ' +
      'companies.</p></div>' +
      FOOTER.map(function (col) {
        return '<div><h3' + (col.i18nKey ? ' data-i18n="' + esc(col.i18nKey) + '"' : '') +
          '>' + esc(col.title) + '</h3>' +
          col.links.map(function (l) {
            // O #cookies não navega: reabre o banner para se poder
            // mudar de ideias. Sem isto era uma âncora para lado
            // nenhum no rodapé de 776 páginas.
            var extra = l.href === '#cookies'
              ? ' onclick="event.preventDefault();window.airportlinkCookies&&window.airportlinkCookies()"'
              : '';
            return '<a href="' + esc(l.href) + '"' + key(l) + extra + '>' +
              esc(l.label) + '</a>';
          }).join('') + '</div>';
      }).join('') +
    '</div><div class="footer-bottom">' +
      '<span>&copy; ' + new Date().getFullYear() + ' Airportlink</span>' +
      '<span>Private transfers &middot; fixed pricing &middot; free cancellation until 24h before</span>' +
    '</div></div>';
  body.appendChild(footer);

  // ---------- comportamento ----------
  function setTheme(v) {
    document.documentElement.setAttribute('data-theme', v);
    try { localStorage.setItem(THEME_KEY, v); } catch (e) {}
  }

  // ---------- o seletor de língua ----------
  (function () {
    var btn = document.getElementById('langBtn');
    var menu = document.getElementById('langMenu');
    if (!btn || !menu) return;

    function close() {
      menu.classList.remove('on');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('on');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('[data-lang]') : null;
      if (!item) return;
      if (window.i18n) window.i18n.setLang(item.getAttribute('data-lang'));
    });

    // Clicar fora fecha, tal como Escape.
    document.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  })();

  /**
   * O cabeçalho nasce depois de o i18n já ter pintado a página, por
   * isso traduz-se a si próprio aqui — e outra vez quando o
   * dicionário chega, caso o fetch demore mais do que o desenho.
   */
  /**
   * Traduzir o que acabámos de desenhar.
   *
   * O i18n pode chegar antes ou depois de nós — o dicionário vem por
   * fetch e a ordem não é garantida. Por isso traduzimos já (caso
   * ele esteja pronto) E ficamos à escuta (caso ainda não esteja).
   * Se já tiver acontecido, o ready é verdadeiro e a primeira
   * chamada resolve.
   */
  function traduzChrome() {
    if (!window.i18n) return;
    window.i18n.apply(document.getElementById('siteHeader'));
    window.i18n.apply(document.querySelector('.site-footer'));
  }

  // onReady em vez do evento: se o dicionário já chegou antes de o
  // cabeçalho existir, o evento já disparou e nunca mais volta.
  if (window.i18n && window.i18n.onReady) {
    window.i18n.onReady(atualizaChrome);
  } else {
    document.addEventListener('i18n:ready', atualizaChrome);
  }

  function atualizaChrome() {
    traduzChrome();

    // O código da língua no botão também muda.
    var code = document.querySelector('#langBtn .lang-code');
    if (code) code.textContent = window.i18n.lang;

    document.querySelectorAll('#langMenu [data-lang]').forEach(function (b) {
      if (b.getAttribute('data-lang') === window.i18n.lang) {
        b.setAttribute('aria-current', 'true');
      } else {
        b.removeAttribute('aria-current');
      }
    });
  }

  document.getElementById('themeBtn').addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  var onScroll = function () { header.classList.toggle('stuck', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.getElementById('burger');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    // Sem isto o corpo continua a deslizar por trás do menu, e ao
    // fechar a pessoa está noutro sítio da página.
    document.body.style.overflow = open ? 'hidden' : '';
  });

  Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) burger.click();
  });
})();
