// O motor da farsa: transforma o clima real em laudo cômico.
// Fatos do dia são estáveis (dayRng); cada aperto varia o tempero (pressRng).

import * as C from './content.js';
import { makeRng, pick, pickN, dayKey, dayOfYear } from './rng.js';
import { weekdayLabel } from './weather.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const fmt = (n, dec = 1) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function tierOf(level) {
  if (level === null || level === undefined) return 'offline';
  if (level <= 0) return 'seco';
  if (level === 1) return 'leve';
  return 'forte';
}

export function skyStateOf(outlook) {
  if (!outlook) return { state: 'sol', drizzle: false, raincoat: false };
  const prob = outlook.days[0].prob;
  const state = prob >= 70 || outlook.isRainingNow ? 'chuva' : prob >= 30 ? 'nublado' : 'sol';
  return { state, drizzle: state === 'nublado' && prob >= 50, raincoat: outlook.probMax48 >= 70 };
}

export function computeResult({ outlook, source, ageHours, pressCount, cityId, turbo }) {
  const dk = dayKey();
  const dayRng = makeRng(`${dk}:${cityId}`);
  const pressRng = makeRng(`${dk}:${cityId}:${pressCount}`);

  const level = outlook ? outlook.todayLevel : null; // nível de hoje: move a água da cena
  // o veredito olha as próximas 48h — a chuva de amanhã não pode pegar o pai de surpresa
  const verdictLevel = outlook
    ? Math.max(outlook.days[0].level, outlook.days[1]?.level ?? 0)
    : null;
  const tier = tierOf(verdictLevel);

  // ---- nível "medido" (estável no dia; ±1cm por aperto = "margem de erro de um bigode") ----
  const meters = clamp(
    1.2 +
      Math.sin(dayOfYear() / 58) * 0.15 +
      (outlook?.rain48past ?? 0) * 0.008 +
      (level ?? 1) * 0.06 +
      (dayRng() - 0.5) * 0.1 +
      (pressRng() - 0.5) * 0.02,
    0.6,
    2.4
  );

  const riverPercent = clamp(18 + (level ?? 1) * 18 + dayRng() * 10 + (pressRng() - 0.5) * 6, 5, 92);

  // ---- unidade do dia ----
  const unit = C.UNITS[Math.floor(dayRng() * C.UNITS.length)];
  const unitValue = meters / unit.m;
  const dec = unitValue >= 20 ? 0 : 1;
  const rounded = Number(unitValue.toFixed(dec));
  const unitName = rounded <= 1 ? unit.s : unit.p; // "0,8 capivara", não "0,8 capivaras"
  const valueText = `${fmt(unitValue, dec)} ${unitName}`;

  // ---- veredito ----
  const verdictPool = tier === 'offline' ? C.OFFLINE_VERDICTS : C.VERDICTS[tier];
  const verdict = pick(pressRng, verdictPool);
  const signature = pick(pressRng, C.SIGNATURES);

  // ---- IPP™ (hard cap 2,5 — a agulha nunca chega na zona "LIGA PRO FILHO") ----
  let ipp;
  if (tier === 'offline') {
    ipp = { value: null, text: '?,?', caption: C.IPP_OFFLINE_CAPTION, angle: -72 };
  } else {
    const v = Math.min(2.5, 0.3 + ((outlook.probMax48 ?? 0) / 100) * 2 + dayRng() * 0.2);
    const caption = C.IPP_CAPTIONS.reduce((best, c) =>
      Math.abs(c.v - v) < Math.abs(best.v - v) ? c : best
    );
    ipp = { value: v, text: fmt(v, 1), caption: caption.txt, angle: (v / 10) * 180 - 90 };
  }

  // ---- extras ----
  const extraLines = [];
  if (turbo) extraLines.push(C.TURBO_LINE);
  const topHat = pressRng() < 0.01;
  if (topHat) extraLines.push(C.TOPHAT_LINE);
  if (pressCount === 5) extraLines.push(C.PRESS_5_LINE);
  if (pressCount === 10) extraLines.push(C.PRESS_10_LINE);
  if (outlook && outlook.probMax48 >= 90 && outlook.maxSum48 >= 25) extraLines.push(C.EXTREME_LINE);

  return {
    protocol: `${dk}/${String(pressCount).padStart(3, '0')}`,
    valueText,
    unitJoke: unit.piada,
    conversionLine: C.CONVERSION_LINE.replace('{m}', fmt(meters, 2)),
    verdict,
    signature,
    ipp,
    stamp: pick(pressRng, C.STAMPS),
    riverPercent,
    extraLines,
    topHat,
    source,
    ageHours,
    // para o compartilhar
    share: {
      valor: valueText,
      ipp: tier === 'offline' ? '?,?' : fmt(ipp.value, 1),
      caption: ipp.caption,
      veredito: verdict,
      prob: outlook ? outlook.days[0].prob : null,
      mm: outlook ? outlook.days[0].sum : null,
    },
  };
}

export function buildBoletim(outlook, source, ageHours, cityId, pressCount) {
  if (!outlook) return { rows: null, banner: C.FORECAST_OFFLINE_BANNER, footer: null };

  const rng = makeRng(`${dayKey()}:${cityId}:boletim:${pressCount}`);
  const used = { seco: [], leve: [], forte: [] };
  const tplFor = (tier) => {
    if (used[tier].length === 0) used[tier] = pickN(rng, C.FORECAST_TEMPLATES[tier], 4);
    return used[tier].pop();
  };

  const rows = outlook.days.map((d, i) => {
    const tier = tierOf(d.level);
    const wmo = C.WMO.find((w) => w.codes.includes(d.code)) ?? C.WMO[0];
    const comment = tplFor(tier === 'offline' ? 'seco' : tier)
      .replace('{prob}', d.prob)
      .replace('{mm}', fmt(d.sum, d.sum >= 10 ? 0 : 1));
    return {
      dayLabel: weekdayLabel(d.date, i),
      icon: wmo.icon,
      wmoLabel: wmo.label,
      prob: d.prob,
      mm: d.sum,
      tmax: d.tmax,
      tmin: d.tmin,
      comment,
    };
  });

  const banner =
    source === 'stale' ? C.FORECAST_STALE_BANNER.replace('{h}', ageHours) : null;

  return {
    rows,
    banner,
    footer: C.FORECAST_FOOTER.replace('{mm}', outlook.mmTotal),
  };
}

// fatos diários do rodapé/cabeçalho (estáveis o dia todo)
export function dailyBits(cityId) {
  const rng = makeRng(`${dayKey()}:${cityId ?? 'geral'}:daily`);
  return {
    plantao: pick(rng, C.CAPIVARAS_PLANTAO),
    selos: pickN(rng, C.STAMPS, 3),
    protocoloDia: dayKey().split('-').reverse().join(''),
  };
}

export function buildShareText(share, url) {
  return C.SHARE_TEXT.replace('{valor}', share.valor)
    .replace('{ipp}', share.ipp)
    .replace('{caption}', share.caption)
    .replace('{veredito}', share.veredito)
    .replace('{prob}', share.prob ?? '—')
    .replace('{mm}', share.mm != null ? fmt(share.mm, share.mm >= 10 ? 0 : 1) : '—')
    .replace('{url}', url);
}
