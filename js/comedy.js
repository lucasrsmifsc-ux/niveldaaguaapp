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

export function computeResult({ outlook, source, ageHours, pressCount, cityId, turbo, realLevel, stationOffline }) {
  const dk = dayKey();
  const dayRng = makeRng(`${dk}:${cityId}`);
  const pressRng = makeRng(`${dk}:${cityId}:${pressCount}`);

  const level = outlook ? outlook.todayLevel : null; // nível de hoje: move a água da cena
  // o veredito olha as próximas 48h — a chuva de amanhã não pode pegar o pai de surpresa
  const verdictLevel = outlook
    ? Math.max(outlook.days[0].level, outlook.days[1]?.level ?? 0)
    : null;
  const tier = tierOf(verdictLevel);

  const real = realLevel && typeof realLevel.nivel === 'number' ? realLevel : null;
  // modo sério: só quando há cota oficial E o nível real passou dela (hoje: Blumenau)
  const serio = !!(real && real.cotas && real.nivel >= real.cotas.atencao);

  // ---- nível: o REAL quando a Defesa Civil mede; senão o teatral de sempre ----
  // (consome os mesmos rngs nos dois caminhos para a unidade do dia não mudar)
  const fakeMeters = clamp(
    1.2 +
      Math.sin(dayOfYear() / 58) * 0.15 +
      (outlook?.rain48past ?? 0) * 0.008 +
      (level ?? 1) * 0.06 +
      (dayRng() - 0.5) * 0.1 +
      (pressRng() - 0.5) * 0.02,
    0.6,
    2.4
  );
  const meters = real ? real.nivel : fakeMeters;

  const fakePercent = clamp(18 + (level ?? 1) * 18 + dayRng() * 10 + (pressRng() - 0.5) * 6, 5, 92);
  const riverPercent = real
    ? real.cotas
      ? clamp(15 + (real.nivel / real.cotas.alertaMaximo) * 72, 8, 92)
      : clamp(12 + real.nivel * 9, 10, 90)
    : fakePercent;

  // ---- unidade do dia ----
  const unit = C.UNITS[Math.floor(dayRng() * C.UNITS.length)];
  const unitValue = meters / unit.m;
  const dec = unitValue >= 20 ? 0 : 1;
  const rounded = Number(unitValue.toFixed(dec));
  const unitName = rounded <= 1 ? unit.s : unit.p; // "0,8 capivara", não "0,8 capivaras"
  // em modo sério, piada dá lugar ao número oficial
  const valueText = serio ? `${fmt(meters, 2)} m (medição oficial)` : `${fmt(unitValue, dec)} ${unitName}`;
  const unitJoke = serio ? 'unidades de brincadeira suspensas até o rio baixar' : unit.piada;

  // ---- veredito ----
  // (pressRng consumido igual em todos os caminhos: a sequência não pode depender do modo)
  const verdictPool = tier === 'offline' ? C.OFFLINE_VERDICTS : C.VERDICTS[tier];
  let verdict = pick(pressRng, verdictPool);
  let signature = pick(pressRng, C.SIGNATURES);
  if (serio) {
    verdict = C.SERIO_VERDICT;
    signature = C.SERIO_SIGNATURE;
  } else if (real && tier === 'offline') {
    // "sem internet" no veredito + selo verde de medição oficial não podem coexistir
    verdict = C.REAL_OFFLINE_VERDICT;
  }

  // ---- IPP™ (hard cap 2,5 — a agulha nunca chega na zona "LIGA PRO FILHO") ----
  let ipp;
  if (serio) {
    // com o rio de verdade acima da cota, o medidor de piada sai de cena
    ipp = { value: null, text: '—', caption: C.SERIO_IPP_CAPTION, angle: -90 };
  } else if (tier === 'offline') {
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
  if (turbo && !serio) extraLines.push(C.TURBO_LINE);
  const topHat = pressRng() < 0.01;
  if (topHat && !serio) extraLines.push(C.TOPHAT_LINE);
  if (pressCount === 5 && !serio) extraLines.push(C.PRESS_5_LINE);
  if (pressCount === 10 && !serio) extraLines.push(C.PRESS_10_LINE);
  if (outlook && outlook.probMax48 >= 90 && outlook.maxSum48 >= 25 && !serio)
    extraLines.push(C.EXTREME_LINE);

  // procedência do nível (o aviso pedido: quando é de verdade, quando é teatro)
  const nivelBadge = real
    ? C.REAL_BADGE.replace('{fonte}', real.fonte)
        .replace('{estacao}', real.estacao)
        .replace(
          '{hora}',
          new Date(real.ts).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo', // hora da estação, não do aparelho de quem lê
          })
        )
    : stationOffline
      ? C.TEATRO_BADGE_FORA_DO_AR
      : C.TEATRO_BADGE;

  const serioBox = serio
    ? C.SERIO_BOX.replace(
        '{cota}',
        fmt(real.cotas.atencao, Number.isInteger(real.cotas.atencao) ? 0 : 1)
      ).replace('{url}', real.url)
    : null;

  // consumo do pressRng é incondicional; só a exibição muda por modo
  const stampPick = pick(pressRng, C.STAMPS);

  return {
    protocol: `${dk}/${String(pressCount).padStart(3, '0')}`,
    valueText,
    unitJoke,
    // em sério a linha viraria "4,20 m = 4,20 m"; suprime
    conversionLine: serio
      ? null
      : real
        ? C.CONVERSION_LINE_REAL.replace('{m}', fmt(meters, 2))
        : C.CONVERSION_LINE.replace('{m}', fmt(meters, 2)),
    verdict,
    signature,
    ipp,
    stamp: serio ? C.SERIO_STAMP : stampPick,
    riverPercent,
    extraLines,
    topHat: topHat && !serio,
    real: !!real,
    serio,
    serioBox,
    nivelBadge,
    source,
    ageHours,
    // para o compartilhar
    share: {
      valor: serio
        ? `${fmt(meters, 2)} m — OFICIAL (${real.fonte})`
        : real
          ? `${valueText} (${fmt(meters, 2)} m DE VERDADE, ${real.fonte})`
          : valueText,
      veredito: verdict,
      prob: outlook ? outlook.days[0].prob : null,
      mm: outlook ? outlook.days[0].sum : null,
      ipp: ipp.value == null ? ipp.text : fmt(ipp.value, 1), // '—' sério / '?,?' offline: sem crash
      caption: ipp.caption,
      serio,
      defesaCivilUrl: real?.url ?? null,
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
  if (share.serio) {
    // acima da cota, a mensagem encaminhável é sóbria e aponta para a fonte oficial
    return C.SHARE_TEXT_SERIO.replace('{valor}', share.valor)
      .replace('{defesaCivilUrl}', share.defesaCivilUrl ?? 'https://defesacivil.sc.gov.br')
      .replace('{prob}', share.prob ?? '—')
      .replace('{mm}', share.mm != null ? fmt(share.mm, share.mm >= 10 ? 0 : 1) : '—')
      .replace('{url}', url);
  }
  return C.SHARE_TEXT.replace('{valor}', share.valor)
    .replace('{ipp}', share.ipp)
    .replace('{caption}', share.caption)
    .replace('{veredito}', share.veredito)
    .replace('{prob}', share.prob ?? '—')
    .replace('{mm}', share.mm != null ? fmt(share.mm, share.mm >= 10 ? 0 : 1) : '—')
    .replace('{url}', url);
}
