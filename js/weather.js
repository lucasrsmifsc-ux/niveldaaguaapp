// Ponte com o mundo real: Open-Meteo (gratuita, sem chave).
// getWeather NUNCA rejeita — no pior caso vira modo comédia pura.

import { storage } from './storage.js';
import { dayKey } from './rng.js';

const FRESH_MS = 45 * 60 * 1000; // cache fresco: segura apertos repetidos sem martelar a API
const STALE_MS = 24 * 60 * 60 * 1000; // cache velho ainda serve, com selo de idade
const FETCH_TIMEOUT_MS = 8000;

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

function forecastUrl(lat, lon) {
  const p = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily:
      'precipitation_sum,precipitation_probability_max,precipitation_hours,weather_code,temperature_2m_max,temperature_2m_min',
    current: 'precipitation,rain,weather_code,temperature_2m',
    timezone: 'auto',
    forecast_days: '4',
    past_days: '2', // chuva das últimas 48h alimenta o "motor de nível" da farsa
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

// prob em %, sum em mm -> nível 0..3
export function bucketDay(prob, sum, code) {
  if ((prob >= 70 && sum >= 20) || code === 95 || code === 96 || code === 99) return 3; // TEMPORAL
  if (prob >= 50 && sum >= 5) return 2; // CHUVA
  if (prob >= 30 || sum >= 1) return 1; // GAROA
  return 0; // SECO
}

export function deriveOutlook(json) {
  const d = json.daily;
  if (!d || !Array.isArray(d.time) || d.time.length < 4) return null;
  // ancora "hoje" pela data local, não pelo comprimento do array:
  // cache de ontem à noite não pode amanhecer rotulado de HOJE
  const todayIdx = d.time.indexOf(dayKey());
  if (todayIdx === -1) return null;

  const days = [];
  for (let i = todayIdx; i < todayIdx + 4 && i < d.time.length; i++) {
    const prob = d.precipitation_probability_max?.[i] ?? 0;
    const sum = d.precipitation_sum?.[i] ?? 0;
    const code = d.weather_code?.[i] ?? 0;
    days.push({
      date: d.time[i],
      prob: Math.round(prob ?? 0),
      sum: Math.round((sum ?? 0) * 10) / 10,
      code,
      tmax: Math.round(d.temperature_2m_max?.[i] ?? 0),
      tmin: Math.round(d.temperature_2m_min?.[i] ?? 0),
      level: bucketDay(prob ?? 0, sum ?? 0, code),
    });
  }

  let rain48past = 0;
  for (let i = 0; i < todayIdx; i++) rain48past += d.precipitation_sum?.[i] ?? 0;

  const cur = json.current || {};
  const isRainingNow =
    (cur.rain ?? 0) > 0 || (cur.precipitation ?? 0) > 0.1 || RAIN_CODES.has(cur.weather_code);

  const maxLevel = Math.max(...days.map((x) => x.level));
  return {
    days,
    todayLevel: days[0].level,
    maxLevel,
    worstDayIndex: days.findIndex((x) => x.level === maxLevel),
    probMax48: Math.max(days[0].prob, days[1]?.prob ?? 0),
    maxSum48: Math.max(days[0].sum, days[1]?.sum ?? 0),
    mmTotal: Math.round(days.reduce((a, x) => a + x.sum, 0)),
    rain48past: Math.round(rain48past * 10) / 10,
    isRainingNow,
    currentTemp: cur.temperature_2m != null ? Math.round(cur.temperature_2m) : null,
  };
}

async function fetchForecast(city) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(forecastUrl(city.latitude, city.longitude), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// -> { outlook, source: 'live' | 'stale' | 'none', ageHours }
export async function getWeather(city) {
  const cached = storage.getWeatherCache();
  const cacheOk = cached && cached.cityId === city.id && cached.json;
  const age = cacheOk ? Date.now() - cached.fetchedAt : Infinity;

  if (cacheOk && age < FRESH_MS) {
    const outlook = deriveOutlook(cached.json);
    if (outlook) return { outlook, source: 'live', ageHours: 0 };
  }

  try {
    const json = await fetchForecast(city);
    const outlook = deriveOutlook(json);
    if (!outlook) throw new Error('resposta sem daily');
    storage.setWeatherCache({ fetchedAt: Date.now(), cityId: city.id, json });
    return { outlook, source: 'live', ageHours: 0 };
  } catch {
    if (cacheOk && age < STALE_MS) {
      const outlook = deriveOutlook(cached.json);
      if (outlook) return { outlook, source: 'stale', ageHours: Math.max(1, Math.round(age / 3600000)) };
    }
    return { outlook: null, source: 'none', ageHours: null };
  }
}

export function weekdayLabel(isoDate, index) {
  if (index === 0) return 'HOJE';
  if (index === 1) return 'AMANHÃ';
  // T12:00:00 evita o clássico off-by-one da meia-noite UTC
  return new Date(isoDate + 'T12:00:00')
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '')
    .toUpperCase();
}
