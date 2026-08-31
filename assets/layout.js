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
      { href: '/privacypolicy', label: 'Privacy policy', i18nKey: 'nav.privacy' }
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
            return '<a href="' + esc(l.href) + '"' + key(l) + '>' + esc(l.label) + '</a>';
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
