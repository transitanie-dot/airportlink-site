/**
 * Traduções do site.
 *
 * Cada língua vive no seu ficheiro, em /assets/i18n/xx.json, e só a
 * escolhida é descarregada. Com catorze línguas num ficheiro só, cada
 * visitante puxava as catorze — mais de 200 KB para usar uma.
 *
 * O inglês não tem ficheiro: é o que está escrito no HTML, e serve de
 * rede quando uma chave falta numa tradução. Uma página em inglês é
 * sempre melhor do que uma página a mostrar 'co.payLater'.
 *
 * COMO USAR
 *   <span data-i18n="book.continue">Continue</span>
 *   <input data-i18n-ph="co.notesPlaceholder">
 *   <button data-i18n-aria="nav.close">
 */
(function () {
  'use strict';

  var LANGS = [
    { code: 'en', label: 'English',    locale: 'en-GB' },
    { code: 'es', label: 'Espanol',    locale: 'es-ES' },
    { code: 'de', label: 'Deutsch',    locale: 'de-DE' },
    { code: 'fr', label: 'Francais',   locale: 'fr-FR' },
    { code: 'it', label: 'Italiano',   locale: 'it-IT' },
    { code: 'pt', label: 'Portugues',  locale: 'pt-PT' },
    { code: 'nl', label: 'Nederlands', locale: 'nl-NL' },
    { code: 'pl', label: 'Polski',     locale: 'pl-PL' },
    { code: 'da', label: 'Dansk',      locale: 'da-DK' },
    { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', locale: 'ru-RU' },
    { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', locale: 'ar', rtl: true },
    { code: 'zh', label: '\u4e2d\u6587', locale: 'zh-CN' },
    { code: 'ja', label: '\u65e5\u672c\u8a9e', locale: 'ja-JP' },
    { code: 'th', label: '\u0e44\u0e17\u0e22', locale: 'th-TH' },
    { code: 'ko', label: '\ud55c\uad6d\uc5b4', locale: 'ko-KR' },
    { code: 'tr', label: 'T\u00fcrk\u00e7e',    locale: 'tr-TR' },
    { code: 'sv', label: 'Svenska',    locale: 'sv-SE' },
    { code: 'no', label: 'Norsk',      locale: 'nb-NO' }
  ];

  var CODES = LANGS.map(function (l) { return l.code; });

  /**
   * A versão dos dicionários.
   *
   * Vai no endereço como ?v=..., por isso mudar este número faz o
   * browser buscar os ficheiros de novo em vez de usar a cópia
   * guardada. SEMPRE que se acrescentam ou corrigem traduções, subir
   * este número — senão as pessoas continuam a ver as antigas
   * durante dias, e não há forma de as avisar.
   */
  var DICT_VERSION = '2026-08-31-03';

  /**
   * A língua, por esta ordem: o que a pessoa escolheu, o endereço, o
   * browser. A escolha manda sempre — alguém que vive na Alemanha e
   * prefere inglês não quer ter de reescolher em cada visita.
   */
  function pick() {
    try {
      var saved = localStorage.getItem('airportlink-lang');
      if (CODES.indexOf(saved) !== -1) return saved;
    } catch (e) {}

    var path = window.location.pathname.match(/^\/([a-z]{2})\//);
    if (path && CODES.indexOf(path[1]) !== -1) return path[1];

    var q = window.location.search.match(/[?&]lang=([a-z]{2})\b/);
    if (q && CODES.indexOf(q[1]) !== -1) return q[1];

    var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return CODES.indexOf(nav) !== -1 ? nav : 'en';
  }

  var lang = pick();
  var info = LANGS.filter(function (l) { return l.code === lang; })[0] || LANGS[0];
  var dict = {};

  function t(key, fallback) {
    return dict[key] || fallback || key;
  }

  function apply(root) {
    var scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n')];
      if (v) el.textContent = v;
    });

    scope.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n-ph')];
      if (v) el.setAttribute('placeholder', v);
    });

    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n-aria')];
      if (v) el.setAttribute('aria-label', v);
    });
  }

  /**
   * O árabe escreve-se da direita para a esquerda.
   *
   * O dir="rtl" espelha a página inteira sozinho — o texto, a ordem
   * das colunas, o lado dos ícones. Só as setas de "seguinte" e
   * "anterior" precisam de ser viradas à mão, no CSS.
   */
  function setDirection() {
    var el = document.documentElement;
    el.setAttribute('lang', lang);
    el.setAttribute('dir', info.rtl ? 'rtl' : 'ltr');
  }

  function formatDate(d, opts) {
    try {
      return d.toLocaleDateString(info.locale, opts);
    } catch (e) {
      return d.toLocaleDateString('en-GB', opts);
    }
  }

  function setLang(next) {
    if (CODES.indexOf(next) === -1) return;
    try { localStorage.setItem('airportlink-lang', next); } catch (e) {}
    window.location.reload();
  }

  /** Carrega o dicionário e pinta a página. */
  function load(done) {
    if (lang === 'en' || typeof fetch !== 'function') { done(); return; }

    // O ?v= identifica esta versão. O browser guarda cada versão em
    // separado, por isso a antiga nunca é servida por engano.
    fetch('/assets/i18n/' + lang + '.json?v=' + DICT_VERSION)
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (d) { dict = d || {}; })
      .catch(function () { dict = {}; })
      .then(done, done);
  }

  /**
   * Quem quiser correr algo quando a tradução estiver pronta usa
   * isto, não o evento.
   *
   * O evento dispara uma vez e só apanha quem já estava à escuta —
   * e a ordem entre o dicionário chegar e os blocos da página
   * arrancarem não é garantida. Este método corre já se o dicionário
   * estiver pronto, e fica à espera se não estiver.
   */
  var pendentes = [];

  function onReady(fn) {
    if (typeof fn !== 'function') return;
    if (window.i18n.ready) { fn(); return; }
    pendentes.push(fn);
  }

  window.i18n = {
    lang: lang,
    langs: LANGS,
    rtl: Boolean(info.rtl),
    t: t,
    apply: apply,
    formatDate: formatDate,
    setLang: setLang,
    onReady: onReady,
    ready: false
  };

  setDirection();

  load(function () {
    window.i18n.ready = true;

    function paint() {
      apply();

      // Quem já se inscreveu, corre agora. Quem se inscrever depois
      // corre de imediato, porque o ready já é verdadeiro.
      pendentes.forEach(function (fn) {
        try { fn(); } catch (e) { console.error('[i18n]', e); }
      });
      pendentes = [];

      // O evento fica, para quem prefira escutá-lo.
      document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: lang } }));
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', paint);
    } else {
      paint();
    }
  });
})();
