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

  // ---------- o menu vive aqui ----------
  var NAV = [
    { href: '/',             label: 'Book a transfer' },
    { href: '/travelagents', label: 'Travel agents' },
    { href: '/drivers',      label: 'Drive with us' },
    { href: '/support',      label: 'Support' }
  ];

  var FOOTER = [
    { title: 'Book', links: [
      { href: '/#book',         label: 'Get a price' },
      { href: '/myaccount',     label: 'My trips' },
      { href: '/login',         label: 'Sign in' },
      { href: '/createaccount', label: 'Create account' }
    ]},
    { title: 'Partners', links: [
      { href: '/travelagents',                   label: 'Travel agents' },
      { href: '/drivers',                        label: 'Drive with us' },
      { href: 'https://drivers.airportlink.app', label: 'Partner portal' }
    ]},
    { title: 'Help', links: [
      { href: '/support',        label: 'Contact support' },
      { href: '/forgotpassword', label: 'Forgot password' },
      { href: '/privacypolicy',  label: 'Privacy policy' }
    ]}
  ];

  var LOGO = 'AIRPORT<b>LINK</b><span class="dot"></span>';

  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  var BARS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';

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
          return '<a href="' + esc(i.href) + '"' + (isHere(i.href) ? ' class="on"' : '') + '>' +
            esc(i.label) + '</a>';
        }).join('') +
      '</nav>' +
      '<div class="header-right">' +
        '<button class="icon-btn" id="themeBtn" type="button" aria-label="Switch theme">' + MOON + '</button>' +
        '<a class="hbtn line" href="/myaccount">My account</a>' +
        '<a class="hbtn" href="' + esc(ctaHref) + '">' + esc(ctaLabel) + '</a>' +
        '<button class="icon-btn burger" id="burger" type="button" aria-label="Menu" ' +
          'aria-expanded="false" aria-controls="mobileMenu">' + BARS + '</button>' +
      '</div>' +
    '</div>';

  var menu = document.createElement('nav');
  menu.className = 'mobile-menu';
  menu.id = 'mobileMenu';
  menu.setAttribute('aria-label', 'Mobile');
  menu.innerHTML =
    NAV.map(function (i) { return '<a href="' + esc(i.href) + '">' + esc(i.label) + '</a>'; }).join('') +
    '<a href="/myaccount">My account</a>' +
    '<a href="/privacypolicy">Privacy policy</a>' +
    '<a class="hbtn amber" href="' + esc(ctaHref) + '">' + esc(ctaLabel) + '</a>';

  var skip = document.createElement('a');
  skip.className = 'skip';
  skip.href = '#main';
  skip.textContent = 'Skip to content';

  body.insertBefore(menu, body.firstChild);
  body.insertBefore(header, body.firstChild);
  body.insertBefore(skip, body.firstChild);

  // ---------- rodapé ----------
  var footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML =
    '<div class="wrap"><div class="footer-grid">' +
      '<div class="footer-brand"><a class="logo" href="/">AIRPORT<b>LINK</b></a>' +
      '<p>Private airport transfers with a fixed price agreed before you pay. ' +
      'Door to door, flight tracked, driven by licensed local companies.</p></div>' +
      FOOTER.map(function (col) {
        return '<div><h3>' + esc(col.title) + '</h3>' +
          col.links.map(function (l) {
            return '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>';
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
