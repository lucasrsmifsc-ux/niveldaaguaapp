// Robô coletor da Estação: roda no GitHub Actions a cada 30 min.
// Junta o nível oficial de Blumenau (AlertaBlu, sem CORS) e um espelho
// das estações da Defesa Civil de SC num niveis.json servido pela branch "dados".
// O app usa o GraphQL estadual direto (tem CORS); o espelho é fallback + Blumenau.

import { writeFileSync } from 'node:fs';

const GQL_URL = 'https://monitoramento.defesacivil.sc.gov.br/graphql';
// consulta verificada na mão — seleções muito enxutas disparam o guard "Operação bloqueada"
const GQL_QUERY =
  'query { tags_data(clients: ["secretaria-de-defesa-civil"]) { qualle_meteorologia { codigo name { general } timestamp position { bacia latitude longitude } data { rio { rio_nome { value } rio_nivel { value unit { value } } rio_nivel_tendencia { value } } } } } }';

const ALERTABLU_URL = 'https://defesacivil.blumenau.sc.gov.br/static/data/nivel_oficial.json';

async function fetchJson(url, opts = {}, timeoutMs = 20000) {
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

async function coletaBlumenau() {
  const json = await fetchJson(`${ALERTABLU_URL}?a=${Date.now()}`); // cachebuster obrigatório (Expires +30d)
  const niveis = json.niveis ?? [];
  const ultimo = niveis[niveis.length - 1];
  if (!ultimo || typeof ultimo.nivel !== 'number') throw new Error('AlertaBlu sem leituras');
  const cotas = {};
  for (const c of json.condicoes ?? []) cotas[c.condicao] = c.nivel;
  return {
    nivel: Math.round(ultimo.nivel * 100) / 100,
    ts: ultimo.horaLeitura,
    cotas: {
      observacao: cotas['Observação'] ?? 3,
      atencao: cotas['Atenção'] ?? 4,
      alerta: cotas['Alerta'] ?? 6,
      alertaMaximo: cotas['Alerta Máximo'] ?? 8,
    },
    fonte: 'AlertaBlu — Defesa Civil de Blumenau',
    url: 'https://defesacivil.blumenau.sc.gov.br/d/nivel-do-rio',
  };
}

async function coletaDcsc() {
  const json = await fetchJson(GQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: GQL_QUERY }),
  });
  const sts = json?.data?.tags_data?.qualle_meteorologia ?? [];
  return sts
    .filter((s) => {
      const nome = s?.name?.general ?? '';
      const nivel = s?.data?.rio?.rio_nivel?.value;
      // exclui estações (H) (referidas à altitude, ~300-400m) e leituras implausíveis;
      // cap 30m: a maior cheia da história de Blumenau foi ~17m
      return (
        nome.startsWith('SDC-SC ') &&
        !nome.includes('(H)') &&
        typeof nivel === 'number' &&
        nivel >= -1 &&
        nivel <= 30
      );
    })
    .map((s) => ({
      codigo: s.codigo,
      nome: s.name.general.replace(/^SDC-SC /, ''),
      nivel: Math.round(s.data.rio.rio_nivel.value * 100) / 100,
      ts: s.timestamp,
      bacia: s.position?.bacia ?? null,
      lat: s.position?.latitude ?? null, // o app confere a geografia (homônimos!)
      lon: s.position?.longitude ?? null,
    }));
}

// dado anterior publicado: uma fonte fora do ar não pode apagar a última leitura boa
// (quem aplica os limites de idade — 2h/4h — é o app, na hora de ler)
let anterior = {};
try {
  anterior = await fetchJson(
    `https://raw.githubusercontent.com/lucasrsmifsc-ux/niveldaaguaapp/dados/niveis.json?cb=${Date.now()}`
  );
} catch {
  /* primeira execução ou raw indisponível: segue sem carry-forward */
}

const resultado = {
  atualizadoEm: new Date().toISOString(),
  blumenau: anterior.blumenau ?? null,
  estacoes: anterior.estacoes ?? [],
};
let sucesso = 0;

try {
  resultado.blumenau = await coletaBlumenau();
  sucesso++;
  console.log(`Blumenau: ${resultado.blumenau.nivel} m @ ${resultado.blumenau.ts}`);
} catch (e) {
  console.error('AlertaBlu falhou (mantendo leitura anterior):', e.message);
}

try {
  const novas = await coletaDcsc();
  // a API "pisca" coordenadas: se a nova leitura vier sem, herda da publicação anterior
  const coordAnterior = new Map((anterior.estacoes ?? []).map((e) => [e.codigo, e]));
  for (const s of novas) {
    if (typeof s.lat !== 'number') {
      const ant = coordAnterior.get(s.codigo);
      if (ant && typeof ant.lat === 'number') {
        s.lat = ant.lat;
        s.lon = ant.lon;
      }
    }
  }
  resultado.estacoes = novas;
  sucesso++;
  console.log(`DCSC: ${resultado.estacoes.length} estações com nível`);
} catch (e) {
  console.error('DCSC falhou (mantendo estações anteriores):', e.message);
}

if (sucesso === 0) {
  console.error('Nenhuma fonte respondeu; mantendo dados anteriores.');
  process.exit(1);
}

writeFileSync('niveis.json', JSON.stringify(resultado, null, 1));
console.log('niveis.json gravado.');
