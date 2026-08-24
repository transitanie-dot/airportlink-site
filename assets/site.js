/**
 * site.js — comportamento partilhado por todas as páginas
 * ---------------------------------------------------------------
 * Cabeçalho, tema, menu móvel e FAQ. Nada aqui depende de rede,
 * para a página ser utilizável mesmo que a API esteja em baixo.
 * ---------------------------------------------------------------
 */
(function () {
  'use strict';

  var THEME_KEY = 'airportlink-theme';
  var $ = function (id) { return document.getElementById(id); };
  var qsa = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // ---------- tema ----------
  // A leitura inicial acontece num script inline no <head>, antes do
  // primeiro paint. Sem isso, uma página escura pisca a branco a cada
  // navegação.
  function setTheme(value) {
    document.documentElement.setAttribute('data-theme', value);
    try { localStorage.setItem(THEME_KEY, value); } catch (e) {}
  }

  qsa('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(now);
    });
  });

  // ---------- cabeçalho ----------
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var burger = $('burger');
  var menu = $('mobileMenu');

  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      // Sem isto o corpo continua a deslizar por trás do menu, e ao
      // fechar a pessoa está noutro sítio da página.
      document.body.style.overflow = open ? 'hidden' : '';
    });

    qsa('#mobileMenu a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) burger.click();
    });
  }

  // ---------- ligação ativa ----------
  var path = window.location.pathname.replace(/\/$/, '') || '/';
  qsa('.site-nav a, #mobileMenu a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
    if (href === path) a.classList.add('on');
  });

  // ---------- FAQ ----------
  qsa('.faq-item').forEach(function (item) {
    var trigger = item.querySelector('.faq-q');
    var answer = item.querySelector('.faq-a');
    if (!trigger || !answer) return;

    trigger.setAttribute('aria-expanded', 'false');

    trigger.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      qsa('.faq-item.open').forEach(function (other) {
        other.classList.remove('open');
        var a = other.querySelector('.faq-a');
        var t = other.querySelector('.faq-q');
        if (a) a.style.maxHeight = null;
        if (t) t.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ---------- ano no rodapé ----------
  qsa('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
