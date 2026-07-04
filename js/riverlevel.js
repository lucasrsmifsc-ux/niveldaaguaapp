// Nível REAL do rio, quando a Defesa Civil mede.
// Fonte 1 (ao vivo, CORS aberto): GraphQL do monitoramento estadual de SC.
// Fonte 2 (espelho de 30 em 30 min, p/ Blumenau e fallback): branch "dados" via raw.githubusercontent.
// getRealLevel NUNCA rejeita — sem estação/sem rede vira null e o teatro assume.

import { storage } from './storage.js';

const GQL_URL = 'https://monitoramento.defesacivil.sc.gov.br/graphql';
// consulta verificada na mão — seleções mais enxutas disparam o guard "Operação bloqueada"
const GQL_QUERY =
  'query { tags_data(clients: ["secretaria-de-defesa-civil"]) { qualle_meteorologia { codigo name { general } timestamp position { bacia latitude longitude } data { rio { rio_nome { value } rio_nivel { value unit { value } } rio_nivel_tendencia { value } } } } } }';

const MIRROR_URL = 'https://raw.githubusercontent.com/lucasrsmifsc-ux/niveldaaguaapp/dados/niveis.json';

const FRESH_MS = 10 * 60 * 1000; // cache do snapshot estadual
const READING_MAX_AGE_MS = 2 * 60 * 60 * 1000; // leitura estadual mais velha que 2h não vale laudo
const BLU_MAX_AGE_MS = 4 * 60 * 60 * 1000; // Blumenau é horário + espelho de 30min
const MAX_DIST_KM = 30; // estação tem que estar perto da cidade — Ilhota do Pará não herda rio de SC

const DC_SC_URL = 'https://monitoramento.defesacivil.sc.gov.br';
const BLUMENAU_POS = { lat: -26.919, lon: -49.066 };

export function slug(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "Timbó 1" -> "timbo"; "Botuverá 2" -> "botuvera"
function stationSlug(nome) {
  return slug(nome).replace(/ \d+$/, '');
}

// cap 30m: acima disso é referência de altitude/erro — e a maior cheia de Blumenau foi ~17m
function plausivel(nome, nivel) {
  return !nome.includes('(H)') && typeof nivel === 'number' && nivel >= -1 && nivel <= 30;
}

function distKm(aLat, aLon, bLat, bLon) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

async function fetchJson(url, opts = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function dcscStations() {
  const cached = storage.getDcscCache();
  if (cached && Date.now() - cached.fetchedAt < FRESH_MS) return cached.stations;
  const json = await fetchJson(GQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: GQL_QUERY }),
  });
  const sts = (json?.data?.tags_data?.qualle_meteorologia ?? [])
    .filter((s) => {
      const nome = s?.name?.general ?? '';
      return nome.startsWith('SDC-SC ') && plausivel(nome, s?.data?.rio?.rio_nivel?.value);
    })
    .map((s) => ({
      codigo: s.codigo,
      nome: s.name.general.replace(/^SDC-SC /, ''),
      nivel: Math.round(s.data.rio.rio_nivel.value * 100) / 100,
      ts: s.timestamp,
      bacia: s.position?.bacia ?? null,
      lat: s.position?.latitude ?? null,
      lon: s.position?.longitude ?? null,
    }));
  if (sts.length === 0) throw new Error('snapshot vazio');

  // a API "pisca" as coordenadas: guarda as últimas conhecidas por estação
  try {
    const mem = storage.getCoordMemory();
    for (const s of sts) {
      if (typeof s.lat === 'number' && typeof s.lon === 'number') {
        mem[s.codigo] = { lat: s.lat, lon: s.lon };
      } else if (mem[s.codigo]) {
        s.lat = mem[s.codigo].lat;
        s.lon = mem[s.codigo].lon;
      }
    }
    storage.setCoordMemory(mem);
  } catch {}

  storage.setDcscCache({ fetchedAt: Date.now(), stations: sts });
  return sts;
}

// nome igual + leitura fresca + estação GEOGRAFICAMENTE perto da cidade;
// gêmeas ("Timbó 1"/"Timbó 2") desempatam pela leitura mais recente
function matchStation(stations, citySlug, city) {
  const agora = Date.now();
  const candidatas = stations.filter(
    (s) =>
      stationSlug(s.nome) === citySlug &&
      agora - new Date(s.ts).getTime() <= READING_MAX_AGE_MS &&
      typeof s.lat === 'number' &&
      typeof s.lon === 'number' &&
      distKm(city.latitude, city.longitude, s.lat, s.lon) <= MAX_DIST_KM
  );
  if (candidatas.length === 0) return null;
  return candidatas.sort((a, b) => new Date(b.ts) - new Date(a.ts))[0];
}

async function mirror() {
  return fetchJson(`${MIRROR_URL}?cb=${Math.floor(Date.now() / 60000)}`);
}

function lembraEstacao(citySlug) {
  try {
    const mem = storage.getStationMemory();
    mem[citySlug] = true;
    storage.setStationMemory(mem);
  } catch {
    /* memória falhou? paciência — jamais derrube uma leitura boa por isso */
  }
}

// a cidade já teve leitura oficial alguma vez? (para o selo não mentir durante um apagão)
export function hasKnownStation(city) {
  return !!storage.getStationMemory()[slug(city.name)];
}

// -> { nivel, ts, estacao, fonte, url, cotas|null } | null
export async function getRealLevel(city) {
  const citySlug = slug(city.name);
  if (typeof city.latitude !== 'number' || typeof city.longitude !== 'number') return null;

  // Blumenau: nível oficial do AlertaBlu (sem CORS -> vem do espelho); confere a geografia
  if (citySlug === 'blumenau' && distKm(city.latitude, city.longitude, BLUMENAU_POS.lat, BLUMENAU_POS.lon) <= MAX_DIST_KM) {
    try {
      const m = await mirror();
      const b = m?.blumenau;
      if (b && typeof b.nivel === 'number' && Date.now() - new Date(b.ts).getTime() < BLU_MAX_AGE_MS) {
        lembraEstacao(citySlug);
        return { nivel: b.nivel, ts: b.ts, estacao: 'Blumenau (oficial)', fonte: b.fonte, url: b.url, cotas: b.cotas ?? null };
      }
    } catch {}
    return null;
  }

  // Demais cidades: monitoramento estadual ao vivo; espelho como plano B
  try {
    const hit = matchStation(await dcscStations(), citySlug, city);
    if (hit) {
      lembraEstacao(citySlug);
      return { nivel: hit.nivel, ts: hit.ts, estacao: hit.nome, fonte: 'Defesa Civil de SC — monitoramento estadual', url: DC_SC_URL, cotas: null };
    }
  } catch {}
  try {
    const m = await mirror();
    const hit = matchStation(
      (m?.estacoes ?? []).filter((s) => plausivel(s.nome, s.nivel)),
      citySlug,
      city
    );
    if (hit) {
      lembraEstacao(citySlug);
      return { nivel: hit.nivel, ts: hit.ts, estacao: hit.nome, fonte: 'Defesa Civil de SC — monitoramento estadual', url: DC_SC_URL, cotas: null };
    }
  } catch {}
  return null;
}
