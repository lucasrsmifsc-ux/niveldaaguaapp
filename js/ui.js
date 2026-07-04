// Renderização de tela. Recebe dados prontos, devolve DOM oficial carimbado.

const $ = (sel) => document.querySelector(sel);

// nomes de cidade vêm de uma API de terceiros: escapar antes de virar HTML
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const els = {};

export function initUI() {
  els.cena = $('#cena');
  els.capivara = $('#capivara');
  els.pato = $('#pato');
  els.peixe = $('#peixe');
  els.jacare = $('#jacare');
  els.splash = $('#splash');
  els.aguaNivel = $('#aguaNivel');
  els.painel = $('#painel');
  els.boletim = $('#boletim');
  els.condicao = $('#condicaoAtual');
  els.faixa = $('#faixaProtocolo');
  els.btnMedir = $('#btnMedir');
  els.btnMedirLabel = $('#btnMedirLabel');
  els.selosChips = $('#selosChips');
  els.plantaoTxt = $('#plantaoTxt');
  els.versaoTxt = $('#versaoTxt');
  els.versaoConfigTxt = $('#versaoConfigTxt');
  els.toast = $('#toast');
  els.btnSom = $('#btnSom');
}

export function showScreen(name) {
  document.querySelectorAll('[data-screen]').forEach((s) => {
    s.hidden = s.dataset.screen !== name;
  });
}

/* ================= cena ================= */

export function setSky(state, drizzle) {
  els.cena.classList.remove('ceu--sol', 'ceu--nublado', 'ceu--chuva', 'garoa');
  els.cena.classList.add(`ceu--${state}`);
  if (drizzle) els.cena.classList.add('garoa');
}

export function setRaincoat(on) {
  els.capivara.classList.toggle('capivara--capa', on);
}

export function setMeasuring(on) {
  els.cena.classList.toggle('cena--medindo', on);
}

export function setWaterLevel(pct) {
  // pct 5..92 -> translateY +10px (raso) .. -13px (cheio)
  const y = Math.round((10 - (pct / 100) * 24) * 10) / 10;
  els.aguaNivel.style.setProperty('--nivel-agua', `${y}px`);
}

export function setCondicao(txt) {
  els.condicao.textContent = txt;
}

export function setFaixa(txt) {
  els.faixa.textContent = txt;
}

export function fishJump(topHat) {
  const p = els.peixe;
  if (p.classList.contains('peixe--pula')) return;
  p.classList.toggle('peixe--cartola', !!topHat);
  p.classList.add('peixe--pula');
  setTimeout(() => {
    els.splash.classList.add('splash--go');
    setTimeout(() => els.splash.classList.remove('splash--go'), 800);
  }, 480);
  const corpo = p.querySelector('.peixe-corpo');
  corpo.addEventListener(
    'animationend',
    () => p.classList.remove('peixe--pula', 'peixe--cartola'),
    { once: true }
  );
}

export function duckSpin() {
  els.pato.classList.add('pato--girando');
  setTimeout(() => els.pato.classList.remove('pato--girando'), 750);
}

export function duckAlmirante(on) {
  els.pato.classList.toggle('pato--almirante', on);
}

export function juremaFesta() {
  els.capivara.classList.add('capivara--festa');
  setTimeout(() => els.capivara.classList.remove('capivara--festa'), 6000);
}

export function jacareVai() {
  els.jacare.classList.add('jacare--vai');
  els.jacare.addEventListener('animationend', () => els.jacare.classList.remove('jacare--vai'), {
    once: true,
  });
}

/* ================= painel: ocioso / terminal ================= */

export function panelIdle(txt) {
  els.painel.innerHTML = `<div class="painel-ocioso">${txt} <span class="cursor">▮</span></div>`;
}

export function termStart() {
  els.painel.innerHTML = `
    <div class="terminal">
      <div class="terminal-msg"><span id="termMsg">INICIANDO PROTOCOLO DE MEDIÇÃO...</span> <span class="cursor">▮</span></div>
      <div class="progresso"><div class="progresso-fill" id="termFill"></div></div>
      <div class="progresso-pct" id="termPct">0%</div>
    </div>`;
}

export function termMsg(txt) {
  const el = $('#termMsg');
  if (el) el.textContent = txt;
}

export function termProgress(pct, durMs) {
  const fill = $('#termFill');
  const label = $('#termPct');
  if (!fill) return;
  fill.style.transition = durMs > 0 ? `width ${durMs}ms cubic-bezier(.25,.6,.35,1)` : 'none';
  requestAnimationFrame(() => {
    fill.style.width = `${pct}%`;
  });
  if (label) label.textContent = `${Math.round(pct)}%`;
}

/* ================= laudo ================= */

function gaugeSvg(angle) {
  return `
  <svg class="ipp-gauge" viewBox="0 0 200 110" aria-hidden="true">
    <path d="M 20 100 A 80 80 0 0 1 53 35.3" fill="none" stroke="#2E7D5B" stroke-width="14"/>
    <path d="M 53 35.3 A 80 80 0 0 1 124.7 23.9" fill="none" stroke="#E0B341" stroke-width="14"/>
    <path d="M 124.7 23.9 A 80 80 0 0 1 180 100" fill="none" stroke="#FF7A00" stroke-width="14"/>
    <text x="42" y="76" font-size="7.5" font-weight="700" text-anchor="middle" fill="#2E7D5B" font-family="ui-monospace, monospace">SUAVE</text>
    <text x="100" y="42" font-size="7.5" font-weight="700" text-anchor="middle" fill="#a8811c" font-family="ui-monospace, monospace">HUM...</text>
    <text x="153" y="70" font-size="6" font-weight="700" text-anchor="middle" fill="#c25d00" font-family="ui-monospace, monospace">LIGA PRO</text>
    <text x="153" y="78" font-size="6" font-weight="700" text-anchor="middle" fill="#c25d00" font-family="ui-monospace, monospace">FILHO</text>
    <text x="20" y="109" font-size="6.5" text-anchor="middle" fill="#6B7280" font-family="ui-monospace, monospace">0</text>
    <text x="100" y="12" font-size="6.5" text-anchor="middle" fill="#6B7280" font-family="ui-monospace, monospace">5</text>
    <text x="180" y="109" font-size="6.5" text-anchor="middle" fill="#6B7280" font-family="ui-monospace, monospace">10</text>
    <line class="ipp-agulha" id="ippAgulha" x1="100" y1="100" x2="100" y2="30"
      stroke="#C0392B" stroke-width="3.2" stroke-linecap="round" style="transform: rotate(-90deg)"/>
    <circle cx="100" cy="100" r="5.5" fill="#0B3D5C"/>
    <text x="100" y="103" font-size="4" text-anchor="middle" fill="#F4F1E8" font-family="ui-monospace, monospace">IPP</text>
  </svg>`;
}

export function renderLaudo(result, sourceBadge, onShare) {
  const extras = result.extraLines.map((l) => `<div class="laudo-extra">${l}</div>`).join('');
  els.painel.innerHTML = `
    <div class="laudo" id="laudoCard">
      <div class="carimbo">${result.stamp}</div>
      <div class="laudo-cabecalho">LAUDO TÉCNICO DE NÍVEL FLUVIAL<br>Nº ${result.protocol} · EST. 001 — FUNDOS DE CASA</div>
      <div class="laudo-rotulo">Nível aferido</div>
      <div class="laudo-valor">${result.valueText}<br><small>(${result.unitJoke})</small></div>
      <div class="laudo-conversao">${result.conversionLine}</div>
      <div class="laudo-rotulo">Parecer técnico</div>
      <p class="laudo-veredito">${result.verdict}</p>
      <div class="laudo-assinatura">${result.signature}</div>
      <div class="ipp-titulo">ÍNDICE DE PREOCUPAÇÃO DO PAI (IPP™)</div>
      ${gaugeSvg(result.ipp.angle)}
      <div class="ipp-valor">${result.ipp.text} / 10</div>
      <div class="ipp-caption">${result.ipp.caption}</div>
      ${extras}
      ${sourceBadge ? `<div class="fonte-selo">FONTE DOS DADOS: ${sourceBadge}</div>` : ''}
      <div class="laudo-acoes">
        <button class="botao-zap" id="btnZap">COMPARTILHAR BOLETIM NO WHATSAPP</button>
      </div>
    </div>`;

  // agulha com overshoot elástico (nunca chega na zona laranja — promessa da casa)
  const agulha = $('#ippAgulha');
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      agulha.style.transform = `rotate(${result.ipp.angle}deg)`;
    })
  );

  $('#btnZap').addEventListener('click', onShare);

  return $('#laudoCard');
}

export function laudoTreme() {
  const card = $('#laudoCard');
  if (!card) return;
  card.classList.add('laudo--treme');
  const onEnd = (e) => {
    if (e.animationName !== 'tremida' || e.target !== card) return;
    card.classList.remove('laudo--treme');
    card.removeEventListener('animationend', onEnd);
  };
  card.addEventListener('animationend', onEnd);
}

/* ================= boletim ================= */

const ICONES = {
  sol: '<circle cx="15" cy="15" r="7" fill="#F2C94C"/><g stroke="#F2C94C" stroke-width="2" stroke-linecap="round"><line x1="15" y1="2" x2="15" y2="6"/><line x1="15" y1="24" x2="15" y2="28"/><line x1="2" y1="15" x2="6" y2="15"/><line x1="24" y1="15" x2="28" y2="15"/><line x1="6" y1="6" x2="8.5" y2="8.5"/><line x1="21.5" y1="21.5" x2="24" y2="24"/><line x1="6" y1="24" x2="8.5" y2="21.5"/><line x1="21.5" y1="8.5" x2="24" y2="6"/></g>',
  solnuvem: '<circle cx="11" cy="11" r="6" fill="#F2C94C"/><ellipse cx="18" cy="18" rx="9" ry="6" fill="#B9C6CF"/><ellipse cx="11" cy="20" rx="7" ry="5" fill="#CBD5DC"/>',
  nublado: '<ellipse cx="15" cy="14" rx="10" ry="6.5" fill="#9FAEB8"/><ellipse cx="10" cy="18" rx="8" ry="5.5" fill="#B9C6CF"/><ellipse cx="21" cy="18" rx="7" ry="5" fill="#8A9AA5"/>',
  neblina: '<g stroke="#9FAEB8" stroke-width="2.4" stroke-linecap="round"><line x1="4" y1="10" x2="26" y2="10"/><line x1="7" y1="15" x2="23" y2="15"/><line x1="5" y1="20" x2="25" y2="20"/></g>',
  garoa: '<ellipse cx="15" cy="11" rx="10" ry="6" fill="#9FAEB8"/><g stroke="#7FB3D5" stroke-width="2" stroke-linecap="round"><line x1="10" y1="20" x2="9" y2="24"/><line x1="16" y1="20" x2="15" y2="24"/><line x1="22" y1="20" x2="21" y2="24"/></g>',
  chuva: '<ellipse cx="15" cy="10" rx="10" ry="6" fill="#7A8791"/><g stroke="#1B6CA8" stroke-width="2.2" stroke-linecap="round"><line x1="9" y1="19" x2="7.5" y2="25"/><line x1="15" y1="19" x2="13.5" y2="25"/><line x1="21" y1="19" x2="19.5" y2="25"/><line x1="12" y1="23" x2="11" y2="27"/><line x1="18" y1="23" x2="17" y2="27"/></g>',
  temporal: '<ellipse cx="15" cy="10" rx="10" ry="6" fill="#5C6B78"/><polygon points="14,16 20,16 15,21 18,21 11,28 13.5,21.5 10.5,21.5" fill="#F2C94C"/>',
  neve: '<ellipse cx="15" cy="10" rx="10" ry="6" fill="#B9C6CF"/><g fill="#7FB3D5"><circle cx="10" cy="21" r="1.6"/><circle cx="16" cy="24" r="1.6"/><circle cx="21" cy="20" r="1.6"/></g>',
};

function icone(tipo) {
  return `<svg class="boletim-icone" viewBox="0 0 30 30" aria-hidden="true">${ICONES[tipo] ?? ICONES.sol}</svg>`;
}

export function renderBoletim(data) {
  if (!data) {
    els.boletim.innerHTML = '';
    return;
  }
  let corpo = '';
  if (data.banner) corpo += `<div class="boletim-banner">${data.banner}</div>`;
  if (data.rows) {
    corpo += data.rows
      .map(
        (r) => `
      <div class="boletim-linha">
        <div class="boletim-topo-linha">
          <span class="boletim-dia">${r.dayLabel}</span>
          ${icone(r.icon)}
          <span class="boletim-prob">${r.prob}%</span>
          <span class="boletim-detalhes">${r.wmoLabel}<br>~${String(r.mm).replace('.', ',')} mm · ${r.tmin}°/${r.tmax}°C</span>
        </div>
        <p class="boletim-coment">${r.comment}</p>
      </div>`
      )
      .join('');
    corpo += `<div class="boletim-rodape">${data.footer}</div>`;
  }
  corpo += `<div class="boletim-nota">*oficialmente elaborado por uma capivara</div>`;
  els.boletim.innerHTML = `
    <div class="boletim-card">
      <div class="boletim-titulo">BOLETIM METEOROLÓGICO OFICIAL*</div>
      ${corpo}
    </div>`;
}

/* ================= rodapé / gerais ================= */

export function renderFooter(bits, versaoTxt) {
  els.selosChips.innerHTML = bits.selos.map((s) => `<span class="selo-chip">${s}</span>`).join('');
  els.plantaoTxt.textContent = `Capivara de plantão hoje: ${bits.plantao}`;
  els.versaoTxt.textContent = versaoTxt;
  if (els.versaoConfigTxt) els.versaoConfigTxt.textContent = versaoTxt;
}

export function setVersao(txt) {
  els.versaoTxt.textContent = txt;
  if (els.versaoConfigTxt) els.versaoConfigTxt.textContent = txt;
}

export function setBtnMedir({ disabled, label }) {
  if (disabled !== undefined) els.btnMedir.disabled = disabled;
  if (label) els.btnMedirLabel.textContent = label;
}

let toastTimer = null;
export function toast(txt, ms = 3500) {
  els.toast.textContent = txt;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, ms);
}

export function soundIcon(on) {
  els.btnSom.querySelector('.som-ondas').style.display = on ? '' : 'none';
  els.btnSom.querySelector('.som-mudo').style.display = on ? 'none' : '';
}

/* ================= busca de cidade ================= */

export function renderCityList(ul, results, semResultadoTxt, onPick) {
  if (results === null) {
    ul.hidden = true;
    ul.innerHTML = '';
    return;
  }
  if (results.length === 0) {
    ul.innerHTML = `<li class="sem-resultado">${semResultadoTxt}</li>`;
    ul.hidden = false;
    return;
  }
  ul.innerHTML = results
    .map((r, i) => `<li data-i="${i}">${esc(r.name)} – ${esc(r.admin1)}</li>`)
    .join('');
  ul.hidden = false;
  ul.querySelectorAll('li[data-i]').forEach((li) => {
    li.addEventListener('click', () => onPick(results[Number(li.dataset.i)]));
  });
}
