/**
 * assets/phone.js — campo de telefone com bandeira e validação
 * ---------------------------------------------------------------
 * Substitui o <select> de prefixos por um seletor com bandeira,
 * pesquisa e verificação do número de dígitos esperado.
 *
 * O <select> original continua no DOM, escondido. Todo o código que
 * já lê $('phoneCode').value continua a funcionar sem saber que isto
 * existe — é o que permite acrescentar isto sem tocar no resto.
 *
 * Sobre as bandeiras: são emoji. Renderizam em Android, iOS, macOS e
 * ChromeOS, mas o Windows mostra as duas letras do país. Não é um
 * defeito a corrigir — é o Windows a não trazer a fonte. Por isso o
 * nome do país aparece sempre ao lado, e a linha lê-se bem nos dois
 * casos.
 * ---------------------------------------------------------------
 */
(function (global) {

  /** A tradução, com o inglês como rede. */
  var T = function (k, en) { return (window.i18n ? window.i18n.t(k, en) : en); };
  'use strict';

  /**
   * País, prefixo e comprimentos nacionais aceites.
   *
   * Os comprimentos vêm dos planos de numeração de cada país. Servem
   * para avisar, nunca para bloquear: um plano muda, e um campo que
   * recusa um número válido é pior do que um que aceita um inválido.
   */
  var COUNTRIES = [
    ['PT', 'Portugal',              '351', [9]],
    ['ES', 'Spain',                 '34',  [9]],
    ['FR', 'France',                '33',  [9]],
    ['GB', 'United Kingdom',        '44',  [10]],
    ['IE', 'Ireland',               '353', [9]],
    ['DE', 'Germany',               '49',  [10, 11]],
    ['IT', 'Italy',                 '39',  [9, 10]],
    ['NL', 'Netherlands',           '31',  [9]],
    ['BE', 'Belgium',               '32',  [9]],
    ['CH', 'Switzerland',           '41',  [9]],
    ['AT', 'Austria',               '43',  [10, 11]],
    ['LU', 'Luxembourg',            '352', [9]],
    ['GR', 'Greece',                '30',  [10]],
    ['CY', 'Cyprus',                '357', [8]],
    ['MT', 'Malta',                 '356', [8]],
    ['DK', 'Denmark',               '45',  [8]],
    ['SE', 'Sweden',                '46',  [9]],
    ['NO', 'Norway',                '47',  [8]],
    ['FI', 'Finland',               '358', [9, 10]],
    ['IS', 'Iceland',               '354', [7]],
    ['PL', 'Poland',                '48',  [9]],
    ['CZ', 'Czechia',               '420', [9]],
    ['SK', 'Slovakia',              '421', [9]],
    ['HU', 'Hungary',               '36',  [9]],
    ['RO', 'Romania',               '40',  [9]],
    ['BG', 'Bulgaria',              '359', [9]],
    ['HR', 'Croatia',               '385', [9]],
    ['SI', 'Slovenia',              '386', [8]],
    ['RS', 'Serbia',                '381', [9]],
    ['EE', 'Estonia',               '372', [7, 8]],
    ['LV', 'Latvia',                '371', [8]],
    ['LT', 'Lithuania',             '370', [8]],
    ['TR', 'Turkey',                '90',  [10]],
    ['UA', 'Ukraine',               '380', [9]],
    ['RU', 'Russia',                '7',   [10]],
    ['US', 'United States',         '1',   [10]],
    ['CA', 'Canada',                '1',   [10]],
    ['MX', 'Mexico',                '52',  [10]],
    ['BR', 'Brazil',                '55',  [10, 11]],
    ['AR', 'Argentina',             '54',  [10]],
    ['CL', 'Chile',                 '56',  [9]],
    ['CO', 'Colombia',              '57',  [10]],
    ['PE', 'Peru',                  '51',  [9]],
    ['UY', 'Uruguay',               '598', [8]],
    ['CR', 'Costa Rica',            '506', [8]],
    ['PA', 'Panama',                '507', [8]],
    ['DO', 'Dominican Republic',    '1',   [10]],
    ['MA', 'Morocco',               '212', [9]],
    ['TN', 'Tunisia',               '216', [8]],
    ['DZ', 'Algeria',               '213', [9]],
    ['EG', 'Egypt',                 '20',  [10]],
    ['ZA', 'South Africa',          '27',  [9]],
    ['KE', 'Kenya',                 '254', [9]],
    ['NG', 'Nigeria',               '234', [10]],
    ['CV', 'Cape Verde',            '238', [7]],
    ['AE', 'United Arab Emirates',  '971', [9]],
    ['SA', 'Saudi Arabia',          '966', [9]],
    ['QA', 'Qatar',                 '974', [8]],
    ['OM', 'Oman',                  '968', [8]],
    ['KW', 'Kuwait',                '965', [8]],
    ['BH', 'Bahrain',               '973', [8]],
    ['IL', 'Israel',                '972', [9]],
    ['JO', 'Jordan',                '962', [9]],
    ['IN', 'India',                 '91',  [10]],
    ['PK', 'Pakistan',              '92',  [10]],
    ['LK', 'Sri Lanka',             '94',  [9]],
    ['MV', 'Maldives',              '960', [7]],
    ['TH', 'Thailand',              '66',  [9]],
    ['VN', 'Vietnam',               '84',  [9]],
    ['MY', 'Malaysia',              '60',  [9, 10]],
    ['SG', 'Singapore',             '65',  [8]],
    ['ID', 'Indonesia',             '62',  [9, 10, 11]],
    ['PH', 'Philippines',           '63',  [10]],
    ['JP', 'Japan',                 '81',  [10]],
    ['KR', 'South Korea',           '82',  [9, 10]],
    ['CN', 'China',                 '86',  [11]],
    ['HK', 'Hong Kong',             '852', [8]],
    ['TW', 'Taiwan',                '886', [9]],
    ['AU', 'Australia',             '61',  [9]],
    ['NZ', 'New Zealand',           '64',  [8, 9]]
  ];

  /** A bandeira a partir do código ISO, usando os símbolos regionais. */
  function flag(iso) {
    return String.fromCodePoint.apply(null, iso.toUpperCase().split('')
      .map(function (c) { return 0x1F1E6 + c.charCodeAt(0) - 65; }));
  }

  function esc(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function digitsOf(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function mount(options) {
    var select = document.getElementById(options.select);
    var input = document.getElementById(options.input);
    if (!select || !input) return null;

    var chosen = COUNTRIES[0];

    // O select fica no DOM e continua a ser a fonte da verdade: é
    // ele que o resto do código lê.
    select.style.display = 'none';
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;

    var wrap = document.createElement('div');
    wrap.className = 'phone-field';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'phone-pick';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    wrap.appendChild(button);

    var menu = document.createElement('div');
    menu.className = 'phone-menu';
    menu.innerHTML =
      '<input class="phone-search" type="text" placeholder="Search country or code" ' +
      'autocomplete="off" spellcheck="false">' +
      '<div class="phone-list" role="listbox"></div>';
    wrap.appendChild(menu);

    var search = menu.querySelector('.phone-search');
    var list = menu.querySelector('.phone-list');

    // O campo do número passa a viver dentro do mesmo invólucro,
    // para os dois se comportarem como um só controlo.
    wrap.appendChild(input);

    var hint = document.createElement('div');
    hint.className = 'phone-hint';
    (input.closest('.field') || wrap).appendChild(hint);

    function paintButton() {
      button.innerHTML = '<span class="phone-flag">' + flag(chosen[0]) + '</span>' +
        '<span class="phone-iso">' + esc(chosen[0]) + '</span>' +
        '<span class="phone-dial">+' + esc(chosen[2]) + '</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';
      button.setAttribute('aria-label', chosen[1] + ', +' + chosen[2]);
    }

    function renderList() {
      var q = (search.value || '').toLowerCase().trim();

      var rows = COUNTRIES.filter(function (c) {
        if (!q) return true;
        return c[1].toLowerCase().indexOf(q) !== -1 ||
               c[0].toLowerCase().indexOf(q) === 0 ||
               c[2].indexOf(q.replace('+', '')) === 0;
      });

      list.innerHTML = rows.length
        ? rows.map(function (c) {
            return '<button class="phone-row' + (c === chosen ? ' on' : '') +
              '" type="button" role="option" data-iso="' + esc(c[0]) +
              '" data-dial="' + esc(c[2]) + '">' +
              '<span class="phone-flag">' + flag(c[0]) + '</span>' +
              '<span class="phone-name">' + esc(c[1]) + '</span>' +
              '<span class="phone-dial">+' + esc(c[2]) + '</span></button>';
          }).join('')
        : '<div class="phone-empty">No country matches that.</div>';

      Array.prototype.forEach.call(list.querySelectorAll('.phone-row'), function (row) {
        row.addEventListener('click', function () {
          pick(row.getAttribute('data-iso'), row.getAttribute('data-dial'));
          close();
          input.focus();
        });
      });
    }

    function pick(iso, dial) {
      var found = COUNTRIES.find(function (c) { return c[0] === iso && c[2] === dial; });
      if (!found) return;

      chosen = found;
      select.value = dial;
      // Um evento a sério, para quem estiver a ouvir o select saber
      // que mudou.
      select.dispatchEvent(new Event('change', { bubbles: true }));
      paintButton();
      validate();
    }

    function open() {
      menu.classList.add('show');
      button.setAttribute('aria-expanded', 'true');
      search.value = '';
      renderList();
      setTimeout(function () { search.focus(); }, 30);
    }

    function close() {
      menu.classList.remove('show');
      button.setAttribute('aria-expanded', 'false');
    }

    button.addEventListener('click', function () {
      menu.classList.contains('show') ? close() : open();
    });

    search.addEventListener('input', renderList);

    search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); button.focus(); }
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = list.querySelector('.phone-row');
        if (first) first.click();
      }
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });

    /**
     * Avisa, não bloqueia.
     *
     * Um plano de numeração muda e um campo que recusa um número
     * válido é pior do que um que aceita um inválido: o primeiro
     * impede a reserva, o segundo dá um telefonema.
     */
    function validate() {
      var digits = digitsOf(input.value);
      var expected = chosen[3];

      if (!digits) {
        hint.textContent = expected.length === 1
          ? chosen[1] + ' numbers have ' + expected[0] + ' digits.'
          : chosen[1] + ' numbers have ' + expected.join(' or ') + ' digits.';
        hint.className = 'phone-hint';
        wrap.classList.remove('bad', 'good');
        return true;
      }

      var ok = expected.indexOf(digits.length) !== -1;

      if (ok) {
        hint.textContent = T('ph.looksRight', 'Looks right.');
        hint.className = 'phone-hint good';
        wrap.classList.remove('bad');
        wrap.classList.add('good');
      } else {
        // Com marcadores, e não texto colado: a ordem das palavras
        // muda de língua para língua, e em alemão o país vem antes.
        hint.textContent = T('ph.wrongLength',
            '{n} digits entered. {pais} numbers usually have {esperado}.')
          .replace('{n}', digits.length)
          .replace('{pais}', chosen[1])
          .replace('{esperado}', expected.join(' ' + T('ph.or', 'or') + ' '));
        hint.className = 'phone-hint bad';
        wrap.classList.remove('good');
        wrap.classList.add('bad');
      }

      return ok;
    }

    input.addEventListener('input', function () {
      // O zero inicial é o prefixo nacional e não se marca do
      // estrangeiro. Tirá-lo em silêncio evita a chamada falhada.
      var digits = digitsOf(input.value);
      if (digits.length > 1 && digits.charAt(0) === '0') {
        digits = digits.replace(/^0+/, '');
      }
      if (digits !== digitsOf(input.value)) input.value = digits;
      validate();
    });

    input.addEventListener('blur', validate);

    /** Aceita "+351 912345678" ou "912345678" e distribui pelos dois. */
    function setValue(full) {
      var raw = String(full || '').trim();
      if (!raw) { input.value = ''; validate(); return; }

      if (raw.charAt(0) === '+') {
        var digits = digitsOf(raw);
        var byLength = COUNTRIES.slice().sort(function (a, b) {
          return b[2].length - a[2].length;
        });
        // Os prefixos mais longos primeiro: +351 tem de ganhar ao
        // +35, senão Portugal vira Chipre.
        var match = byLength.find(function (c) { return digits.indexOf(c[2]) === 0; });
        if (match) {
          pick(match[0], match[2]);
          input.value = digits.slice(match[2].length);
          validate();
          return;
        }
      }

      input.value = digitsOf(raw);
      validate();
    }

    function full() {
      var digits = digitsOf(input.value);
      return digits ? '+' + chosen[2] + ' ' + digits : '';
    }

    // Arranque: respeita o que já lá estava.
    var initial = COUNTRIES.find(function (c) { return c[2] === select.value; })
      || COUNTRIES.find(function (c) { return c[0] === (options.country || 'PT'); })
      || COUNTRIES[0];

    chosen = initial;
    select.value = initial[2];
    paintButton();
    validate();

    return { setValue: setValue, full: full, validate: validate, country: function () { return chosen; } };
  }

  global.AirportlinkPhone = { mount: mount, countries: COUNTRIES, flag: flag };
})(window);
