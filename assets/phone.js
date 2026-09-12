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
  /**
 * Os países, por ordem alfabética.
 *
 * Estavam por relevância: Portugal, Espanha, França primeiro, e o
 * resto sem ordem nenhuma. Numa lista de oitenta, procurar
 * "Norway" a olho entre "Hong Kong" e "Taiwan" é procurar às
 * cegas.
 *
 * Alfabético é o que toda a gente espera, e é o que permite
 * saltar com o teclado.
 */
var COUNTRIES = [
    ['DZ', 'Algeria',             '213',   [9]],
    ['AR', 'Argentina',           '54',    [10]],
    ['AU', 'Australia',           '61',    [9]],
    ['AT', 'Austria',             '43',    [10, 11]],
    ['BH', 'Bahrain',             '973',   [8]],
    ['BE', 'Belgium',             '32',    [9]],
    ['BR', 'Brazil',              '55',    [10, 11]],
    ['BG', 'Bulgaria',            '359',   [9]],
    ['CA', 'Canada',              '1',     [10]],
    ['CV', 'Cape Verde',          '238',   [7]],
    ['CL', 'Chile',               '56',    [9]],
    ['CN', 'China',               '86',    [11]],
    ['CO', 'Colombia',            '57',    [10]],
    ['CR', 'Costa Rica',          '506',   [8]],
    ['HR', 'Croatia',             '385',   [9]],
    ['CY', 'Cyprus',              '357',   [8]],
    ['CZ', 'Czechia',             '420',   [9]],
    ['DK', 'Denmark',             '45',    [8]],
    ['DO', 'Dominican Republic',  '1',     [10]],
    ['EG', 'Egypt',               '20',    [10]],
    ['EE', 'Estonia',             '372',   [7, 8]],
    ['FI', 'Finland',             '358',   [9, 10]],
    ['FR', 'France',              '33',    [9]],
    ['DE', 'Germany',             '49',    [10, 11]],
    ['GR', 'Greece',              '30',    [10]],
    ['HK', 'Hong Kong',           '852',   [8]],
    ['HU', 'Hungary',             '36',    [9]],
    ['IS', 'Iceland',             '354',   [7]],
    ['IN', 'India',               '91',    [10]],
    ['ID', 'Indonesia',           '62',    [9, 10, 11]],
    ['IE', 'Ireland',             '353',   [9]],
    ['IL', 'Israel',              '972',   [9]],
    ['IT', 'Italy',               '39',    [9, 10]],
    ['JP', 'Japan',               '81',    [10]],
    ['JO', 'Jordan',              '962',   [9]],
    ['KE', 'Kenya',               '254',   [9]],
    ['KW', 'Kuwait',              '965',   [8]],
    ['LV', 'Latvia',              '371',   [8]],
    ['LT', 'Lithuania',           '370',   [8]],
    ['LU', 'Luxembourg',          '352',   [9]],
    ['MY', 'Malaysia',            '60',    [9, 10]],
    ['MV', 'Maldives',            '960',   [7]],
    ['MT', 'Malta',               '356',   [8]],
    ['MX', 'Mexico',              '52',    [10]],
    ['MA', 'Morocco',             '212',   [9]],
    ['NL', 'Netherlands',         '31',    [9]],
    ['NZ', 'New Zealand',         '64',    [8, 9]],
    ['NG', 'Nigeria',             '234',   [10]],
    ['NO', 'Norway',              '47',    [8]],
    ['OM', 'Oman',                '968',   [8]],
    ['PK', 'Pakistan',            '92',    [10]],
    ['PA', 'Panama',              '507',   [8]],
    ['PE', 'Peru',                '51',    [9]],
    ['PH', 'Philippines',         '63',    [10]],
    ['PL', 'Poland',              '48',    [9]],
    ['PT', 'Portugal',            '351',   [9]],
    ['QA', 'Qatar',               '974',   [8]],
    ['RO', 'Romania',             '40',    [9]],
    ['RU', 'Russia',              '7',     [10]],
    ['SA', 'Saudi Arabia',        '966',   [9]],
    ['RS', 'Serbia',              '381',   [9]],
    ['SG', 'Singapore',           '65',    [8]],
    ['SK', 'Slovakia',            '421',   [9]],
    ['SI', 'Slovenia',            '386',   [8]],
    ['ZA', 'South Africa',        '27',    [9]],
    ['KR', 'South Korea',         '82',    [9, 10]],
    ['ES', 'Spain',               '34',    [9]],
    ['LK', 'Sri Lanka',           '94',    [9]],
    ['SE', 'Sweden',              '46',    [9]],
    ['CH', 'Switzerland',         '41',    [9]],
    ['TW', 'Taiwan',              '886',   [9]],
    ['TH', 'Thailand',            '66',    [9]],
    ['TN', 'Tunisia',             '216',   [8]],
    ['TR', 'Turkey',              '90',    [10]],
    ['UA', 'Ukraine',             '380',   [9]],
    ['AE', 'United Arab Emirates','971',   [9]],
    ['GB', 'United Kingdom',      '44',    [10]],
    ['US', 'United States',       '1',     [10]],
    ['UY', 'Uruguay',             '598',   [8]],
    ['VN', 'Vietnam',             '84',    [9]]
  ];

  /**
   * ---------------------------------------------------------------
   * DE ONDE VEM O CLIENTE
   *
   * O campo abria sempre em Portugal. Um norueguês a reservar de
   * Oslo tinha de percorrer a lista até ao N antes de escrever o
   * número — e quem não repara escreve o número norueguês com o
   * +351 à frente, que é um número que não marca.
   *
   * Duas fontes, por esta ordem:
   *
   * 1. A REGIÃO DA LÍNGUA do browser (nb-NO, en-GB, pt-BR).
   *    É a melhor pista para um TELEFONE, e não para um sítio: um
   *    inglês em Oslo tem en-GB e um telemóvel inglês. O fuso
   *    horário diria Noruega e estaria errado.
   *
   * 2. O FUSO HORÁRIO, quando a língua não traz região — há
   *    browsers que devolvem só "en" ou "pt".
   *
   * Se as duas falharem, fica o país por omissão, como antes.
   * Nada disto bloqueia nada: é um valor inicial que a pessoa muda
   * com um toque.
   * ---------------------------------------------------------------
   */

  /**
   * Os fusos, só dos países que servimos.
   *
   * Não é a lista completa da IANA — é a que responde à pergunta
   * que temos. Um fuso que não esteja aqui cai no país por omissão,
   * que é o mesmo que acontecia antes.
   */
  var ZONES = {
    'Africa/Algiers': 'DZ', 'Africa/Cairo': 'EG', 'Africa/Casablanca': 'MA',
    'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
    'Africa/Tunis': 'TN', 'Atlantic/Cape_Verde': 'CV',
    'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO',
    'America/Chicago': 'US', 'America/Costa_Rica': 'CR', 'America/Denver': 'US',
    'America/Edmonton': 'CA', 'America/Halifax': 'CA', 'America/Lima': 'PE',
    'America/Los_Angeles': 'US', 'America/Mexico_City': 'MX',
    'America/Montevideo': 'UY', 'America/Montreal': 'CA', 'America/New_York': 'US',
    'America/Panama': 'PA', 'America/Phoenix': 'US', 'America/Santiago': 'CL',
    'America/Santo_Domingo': 'DO', 'America/Sao_Paulo': 'BR',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Winnipeg': 'CA',
    'Asia/Bahrain': 'BH', 'Asia/Bangkok': 'TH', 'Asia/Colombo': 'LK',
    'Asia/Dubai': 'AE', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Hong_Kong': 'HK',
    'Asia/Jakarta': 'ID', 'Asia/Jerusalem': 'IL', 'Asia/Karachi': 'PK',
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Kuala_Lumpur': 'MY',
    'Asia/Kuwait': 'KW', 'Asia/Amman': 'JO', 'Asia/Manila': 'PH',
    'Asia/Muscat': 'OM', 'Asia/Qatar': 'QA', 'Asia/Riyadh': 'SA',
    'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Singapore': 'SG',
    'Asia/Taipei': 'TW', 'Asia/Tokyo': 'JP', 'Asia/Istanbul': 'TR',
    'Europe/Istanbul': 'TR', 'Indian/Maldives': 'MV',
    'Atlantic/Reykjavik': 'IS', 'Atlantic/Azores': 'PT', 'Atlantic/Madeira': 'PT',
    'Australia/Adelaide': 'AU', 'Australia/Brisbane': 'AU',
    'Australia/Melbourne': 'AU', 'Australia/Perth': 'AU', 'Australia/Sydney': 'AU',
    'Europe/Amsterdam': 'NL', 'Europe/Athens': 'GR', 'Europe/Belgrade': 'RS',
    'Europe/Berlin': 'DE', 'Europe/Bratislava': 'SK', 'Europe/Brussels': 'BE',
    'Europe/Bucharest': 'RO', 'Europe/Budapest': 'HU', 'Europe/Copenhagen': 'DK',
    'Europe/Dublin': 'IE', 'Europe/Helsinki': 'FI', 'Europe/Kiev': 'UA',
    'Europe/Kyiv': 'UA', 'Europe/Lisbon': 'PT', 'Europe/Ljubljana': 'SI',
    'Europe/London': 'GB', 'Europe/Luxembourg': 'LU', 'Europe/Madrid': 'ES',
    'Europe/Malta': 'MT', 'Europe/Moscow': 'RU', 'Europe/Nicosia': 'CY',
    'Asia/Nicosia': 'CY', 'Europe/Oslo': 'NO', 'Europe/Paris': 'FR',
    'Europe/Prague': 'CZ', 'Europe/Riga': 'LV', 'Europe/Rome': 'IT',
    'Europe/Sofia': 'BG', 'Europe/Stockholm': 'SE', 'Europe/Tallinn': 'EE',
    'Europe/Vienna': 'AT', 'Europe/Vilnius': 'LT', 'Europe/Warsaw': 'PL',
    'Europe/Zagreb': 'HR', 'Europe/Zurich': 'CH', 'Pacific/Auckland': 'NZ'
  };

  function byIso(iso) {
    if (!iso) return null;
    var up = String(iso).toUpperCase();
    return COUNTRIES.find(function (c) { return c[0] === up; }) || null;
  }

  /**
   * O país de quem está a escrever, ou null se não soubermos.
   *
   * Null e não um palpite: uma adivinhação errada com ar de certeza
   * é pior do que a omissão, porque ninguém a verifica.
   */
  function detectCountry() {
    try {
      var langs = (navigator.languages && navigator.languages.length)
        ? navigator.languages
        : [navigator.language || ''];

      for (var i = 0; i < langs.length; i++) {
        // "nb-NO", "en_GB", "pt-BR" — a região são as duas letras
        // do fim. "en" sozinho não diz país nenhum e passa à frente.
        var m = String(langs[i] || '').match(/[-_]([A-Za-z]{2})(?:[-_]|$)/);
        if (m && byIso(m[1])) return m[1].toUpperCase();
      }
    } catch (e) {}

    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && ZONES[tz] && byIso(ZONES[tz])) return ZONES[tz];
    } catch (e) {}

    return null;
  }

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

    /**
     * Sem texto de exemplo dentro do campo.
     *
     * O "912 345 678" era português e ficava lá para toda a gente —
     * e um exemplo de outro país é pior do que nenhum, porque dá a
     * entender que é esse o formato esperado.
     *
     * O que faz falta — quantos dígitos tem o número deste país —
     * está na linha de ajuda por baixo, que muda com o país
     * escolhido.
     *
     * Tirado aqui e não no HTML: a página é grande e este é o
     * único sítio que manda no campo.
     */
    input.removeAttribute('placeholder');

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

    /**
     * A linha de ajuda, fora da caixa do campo.
     *
     * O .field é a classe das páginas de conta; o .f é a do
     * checkout. Sem a segunda, o closest devolvia null e a dica
     * acabava DENTRO do .phone-field — que tem altura fixa. Ela
     * transbordava e caía por cima do campo seguinte.
     */
    var hint = document.createElement('div');
    hint.className = 'phone-hint';
    (input.closest('.field') || input.closest('.f') || wrap).appendChild(hint);

    /**
     * O botão, agora só com a bandeira e o indicativo.
     *
     * O código ISO saiu: com a bandeira ao lado, "NO" e a bandeira
     * norueguesa dizem a mesma coisa duas vezes, e o que interessa
     * ao lado do número é o +47.
     *
     * No Windows, onde a bandeira aparece como as duas letras do
     * país, a linha continua a ler-se: "NO +47".
     */
    function paintButton() {
      button.innerHTML = '<span class="phone-flag">' + flag(chosen[0]) + '</span>' +
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
            /**
             * Quantos dígitos tem o número deste país.
             *
             * Quem escolhe o Brasil vê "10/11" ANTES de escrever, e
             * não depois de errar. A mesma informação está na linha
             * de ajuda por baixo do campo, mas essa só aparece
             * depois de fechar o menu — e quem está a escolher o
             * país já está a pensar no número.
             *
             * O aria-label leva a frase por extenso: a barra entre
             * os dois números lê-se mal em voz alta.
             */
            var lens = c[3].join('/');

            return '<button class="phone-row' + (c === chosen ? ' on' : '') +
              '" type="button" role="option" data-iso="' + esc(c[0]) +
              '" data-dial="' + esc(c[2]) + '"' +
              ' aria-label="' + esc(c[1]) + ', +' + esc(c[2]) + ', ' +
              esc(c[3].join(' or ')) + ' digits">' +
              '<span class="phone-flag">' + flag(c[0]) + '</span>' +
              '<span class="phone-name">' + esc(c[1]) + '</span>' +
              '<span class="phone-dial">+' + esc(c[2]) + '</span>' +
              '<span class="phone-len">' + esc(lens) + '</span></button>';
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

    /**
     * Mudar o país de fora.
     *
     * Serve para quando a página souber mais do que nós — por
     * exemplo, o país da morada de recolha que o Google devolve.
     * Não mexe no número já escrito.
     */
    function setCountry(iso) {
      var c = byIso(iso);
      if (c) pick(c[0], c[2]);
      return Boolean(c);
    }

    /**
     * O país inicial.
     *
     * Por esta ordem: o que a página pediu explicitamente, o que
     * detetámos do browser, e por fim o de omissão.
     *
     * O select não conta como escolha: ele nasce sempre no primeiro
     * <option> do HTML, e era isso que punha toda a gente em
     * Portugal.
     */
    var initial = byIso(options.country)
      || (options.detect === false ? null : byIso(detectCountry()))
      || COUNTRIES.find(function (c) { return c[2] === select.value; })
      || COUNTRIES[0];

    chosen = initial;
    select.value = initial[2];
    paintButton();
    validate();

    // O resto do código lê o select. Se a deteção o mudou, quem
    // estiver a ouvir tem de saber — senão o servidor recebe o
    // indicativo do HTML e não o que está no ecrã.
    select.dispatchEvent(new Event('change', { bubbles: true }));

    return {
      setValue: setValue,
      full: full,
      validate: validate,
      setCountry: setCountry,
      country: function () { return chosen; }
    };
  }

  global.AirportlinkPhone = {
    mount: mount,
    countries: COUNTRIES,
    flag: flag,
    detectCountry: detectCountry
  };
})(window);
