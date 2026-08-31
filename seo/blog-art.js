/**
 * A arte de cada artigo.
 *
 * Não temos fotografias, e as de banco de imagens dariam ao blogue
 * o ar de qualquer outro site de viagens. Em vez disso desenhamos
 * aquilo que a empresa realmente vende: o percurso.
 *
 * Cada peça é uma linha entre dois pontos sobre camadas de terreno.
 * A forma do terreno vem de uma semente calculada a partir do slug,
 * por isso cada artigo tem a sua e mantém-se igual entre builds.
 *
 * Quando houver fotografias reais, isto substitui-se: a marcação
 * do artigo já está preparada para receber uma <img> no mesmo sítio.
 */

/** Um gerador de números previsível, para a arte não mudar a cada build. */
function semente(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) {
    h ^= txt.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

/**
 * As paletas.
 *
 * Cada uma evoca um tipo de percurso em vez de decorar: a costa é
 * azul-esverdeada, o interior é seco e âmbar, a ilha é turquesa.
 * Um artigo escolhe a sua no posts.json.
 */
const PALETAS = {
  costa:    { ceu: '#0B2B3A', t1: '#0F766E', t2: '#12897F', t3: '#1AA396', linha: '#F5C24B', ponto: '#FFFFFF' },
  interior: { ceu: '#1B1408', t1: '#8A5A12', t2: '#A97220', t3: '#C68C2C', linha: '#4FD1C5', ponto: '#FFFFFF' },
  ilha:     { ceu: '#04203F', t1: '#0E6E8C', t2: '#1287A8', t3: '#17A2C4', linha: '#F5A65B', ponto: '#FFFFFF' },
  noite:    { ceu: '#011B50', t1: '#0F766E', t2: '#146B78', t3: '#1B7F8C', linha: '#FDA02B', ponto: '#FFFFFF' }
};

/**
 * Uma camada de terreno: uma curva suave que atravessa a largura.
 * Vai ficando mais alta e mais clara à medida que se aproxima da
 * frente, como acontece a olhar para uma serra.
 */
function camada(rnd, W, H, base, amp, cor, opacidade) {
  const pontos = 6;
  let d = `M0 ${H} L0 ${base}`;
  for (let i = 0; i <= pontos; i++) {
    const x = (W / pontos) * i;
    const y = base - (rnd() * amp) - amp * 0.15;
    const xAnterior = (W / pontos) * (i - 1);
    if (i === 0) d += ` L${x} ${y}`;
    else {
      const cx = (xAnterior + x) / 2;
      d += ` Q${cx} ${y - rnd() * amp * 0.4} ${x} ${y}`;
    }
  }
  d += ` L${W} ${H} Z`;
  return `<path d="${d}" fill="${cor}" opacity="${opacidade}"/>`;
}

/**
 * A peça completa.
 *
 * `larga` faz a versão do topo do artigo, mais baixa e panorâmica;
 * sem ela sai a versão do cartão do índice, mais quadrada.
 */
export function arte(slug, paleta = 'costa', larga = false) {
  const p = PALETAS[paleta] || PALETAS.costa;
  const rnd = semente(slug + paleta);
  const W = 1200;
  const H = larga ? 460 : 620;

  const partes = [];

  // O céu: um degradê vertical, mais claro junto ao horizonte.
  partes.push(`<defs>
    <linearGradient id="ceu-${slug}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.ceu}"/>
      <stop offset="1" stop-color="${p.t1}" stop-opacity=".55"/>
    </linearGradient>
    <linearGradient id="rota-${slug}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${p.linha}" stop-opacity=".2"/>
      <stop offset=".5" stop-color="${p.linha}"/>
      <stop offset="1" stop-color="${p.linha}" stop-opacity=".2"/>
    </linearGradient>
  </defs>`);
  partes.push(`<rect width="${W}" height="${H}" fill="url(#ceu-${slug})"/>`);

  // Um sol baixo, deslocado para um lado. Não é decoração: dá ao
  // desenho um ponto de luz e uma hora do dia.
  const solX = W * (0.18 + rnd() * 0.5);
  const solY = H * (larga ? 0.42 : 0.36);
  partes.push(`<circle cx="${solX.toFixed(0)}" cy="${solY.toFixed(0)}" r="${(H * 0.09).toFixed(0)}"
    fill="${p.linha}" opacity=".16"/>`);
  partes.push(`<circle cx="${solX.toFixed(0)}" cy="${solY.toFixed(0)}" r="${(H * 0.045).toFixed(0)}"
    fill="${p.linha}" opacity=".5"/>`);

  // Três camadas de terreno, da mais distante à mais próxima.
  const baseP = H * (larga ? 0.58 : 0.52);
  partes.push(camada(rnd, W, H, baseP, H * 0.13, p.t1, 0.55));
  partes.push(camada(rnd, W, H, baseP + H * 0.13, H * 0.11, p.t2, 0.75));
  partes.push(camada(rnd, W, H, baseP + H * 0.26, H * 0.09, p.t3, 0.92));

  // A rota: um arco entre dois pontos, por cima de tudo. É o
  // elemento que dá sentido ao desenho e o liga ao produto.
  const y0 = H * (larga ? 0.72 : 0.68);
  const x0 = W * 0.12;
  const x1 = W * 0.88;
  const y1 = y0 - H * (0.04 + rnd() * 0.06);
  const arco = y0 - H * (0.16 + rnd() * 0.08);

  partes.push(`<path d="M${x0} ${y0} Q${W / 2} ${arco} ${x1} ${y1}"
    fill="none" stroke="url(#rota-${slug})" stroke-width="3"
    stroke-dasharray="9 7" stroke-linecap="round"/>`);

  // Os dois extremos: de onde parte e onde chega.
  for (const [cx, cy] of [[x0, y0], [x1, y1]]) {
    partes.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="11"
      fill="${p.ceu}" opacity=".7"/>`);
    partes.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="5.5"
      fill="${p.ponto}"/>`);
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
${partes.join('\n')}
</svg>`;
}

export { PALETAS };
