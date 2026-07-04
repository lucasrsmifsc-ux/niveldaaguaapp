// Busca de cidade (Open-Meteo Geocoding, sem chave)

const BASE = 'https://geocoding-api.open-meteo.com/v1/search';

async function query(name, signal, countryCode) {
  const p = new URLSearchParams({ name, count: '6', language: 'pt', format: 'json' });
  if (countryCode) p.set('countryCode', countryCode);
  const res = await fetch(`${BASE}?${p}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.results ?? []; // sem resultados o campo nem existe
}

export async function searchCity(q, signal) {
  if (!q || q.trim().length < 2) return [];
  let results = await query(q.trim(), signal, 'BR');
  if (results.length === 0) results = await query(q.trim(), signal, null); // grafias exóticas
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    admin1: r.admin1 ?? r.country ?? '',
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? 'America/Sao_Paulo',
  }));
}
