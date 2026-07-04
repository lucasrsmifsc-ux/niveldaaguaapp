// Central de operações da Estação Fluviométrica nº 001.

import * as C from './content.js';
import * as ui from './ui.js';
import * as audio from './audio.js';
import { storage } from './storage.js';
import { getWeather } from './weather.js';
import { searchCity } from './geocode.js';
import { computeResult, buildBoletim, skyStateOf, dailyBits, buildShareText } from './comedy.js';
import { makeRng, pickN, dayKey } from './rng.js';

const $ = (sel) => document.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const vibrate = (p) => navigator.vibrate?.(p);

const state = {
  city: null,
  measuring: false,
  sessionMeasures: 0,
  lastWeather: null,
  settings: storage.getSettings(),
};

/* ==================== inicialização ==================== */

function init() {
  ui.initUI();

  audio.setSound(state.settings.sound);
  ui.soundIcon(state.settings.sound);
  $('#chkSom').checked = state.settings.sound;

  if ('serviceWorker' in navigator) {
    if (new URLSearchParams(location.search).has('nosw')) {
      // bypass de desenvolvimento: desregistra de verdade (1 reload para escapar do SW ativo)
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    } else {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  wireHeader();
  wireConfig();
  wireButton();
  wireEggs();
  wireSetup();
  wireOnboarding();

  if (storage.getQuacks() >= 10) ui.duckAlmirante(true);

  state.city = storage.getCity();
  if (state.city) enterMain();
  else if (storage.getOnboarded()) enterSetup();
  else enterOnboarding();

  scheduleFishJump();
}

/* ==================== onboarding: processo de admissão ==================== */

const ob = { slide: 0, total: 5, assinando: false, timers: [] };

// Chrome/Android oferece instalação de verdade; guardamos o convite para o botão do ofício
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  const btn = document.querySelector('#btnInstalar');
  if (btn) btn.hidden = false;
});

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

function pickInstallVariant() {
  if (isStandalone()) return 'done';
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'generic';
}

function enterOnboarding() {
  ob.slide = 0;
  ob.assinando = false;
  ob.timers.forEach(clearTimeout); // uma posse antiga não pode ejetar a cerimônia nova
  ob.timers = [];
  $('#obCarimbo').hidden = true;
  $('#btnObProximo').disabled = false;

  const variant = pickInstallVariant();
  document.querySelectorAll('.ob-install').forEach((d) => {
    d.hidden = !d.classList.contains(`ob-install--${variant}`);
  });
  $('#btnInstalar').hidden = !installPrompt;

  showObSlide(0);
  ui.showScreen('onboarding');
}

function showObSlide(i) {
  ob.slide = i;
  document.querySelectorAll('.ob-slide').forEach((s) => {
    s.hidden = Number(s.dataset.slide) !== i;
  });
  document.querySelectorAll('.ob-dot').forEach((d, j) => {
    d.classList.toggle('ob-dot--on', j === i);
  });
  $('#obEtapa').textContent = `ETAPA ${i + 1} DE ${ob.total} · PROCESSO DE ADMISSÃO Nº 042/1987`;
  $('#btnObProximo').textContent = i === ob.total - 1 ? 'ASSINAR E ASSUMIR O CARGO' : 'PRÓXIMO ▸';
}

function finishOnboarding(toastMsg) {
  storage.setOnboarded();
  if (toastMsg) ui.toast(toastMsg, 4000);
  if (state.city) enterMain();
  else enterSetup();
}

function wireOnboarding() {
  $('#btnObProximo').addEventListener('click', () => {
    if (ob.slide < ob.total - 1) {
      showObSlide(ob.slide + 1);
      return;
    }
    if (ob.assinando) return;
    ob.assinando = true; // a firma só se reconhece uma vez
    audio.initAudio();
    $('#btnObProximo').disabled = true;
    $('#obCarimbo').hidden = false; // solta a animação de carimbada
    ob.timers.push(
      setTimeout(() => {
        audio.thud();
        vibrate(40);
      }, 250),
      setTimeout(() => finishOnboarding(C.TOASTS.posse), 1400)
    );
  });

  $('#btnInstalar').addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;
    $('#btnInstalar').hidden = true;
    if (outcome === 'accepted') ui.toast('Posto de comando instalado. A capivara aprova.', 4000);
  });

  $('#btnObPular').addEventListener('click', () => {
    if (ob.assinando) return; // a firma já está no cartório; tarde demais para desistir
    finishOnboarding(C.TOASTS.pularPosse);
  });

  $('#btnReverPosse').addEventListener('click', () => {
    if (state.measuring) {
      ui.toast('A cerimônia espera a medição terminar. Protocolo é protocolo.', 3000);
      return;
    }
    $('#telaConfig').hidden = true;
    enterOnboarding();
  });
}

function enterSetup() {
  $('#setupTexto').textContent = C.SETUP.texto;
  $('#setupTitulo').textContent = C.SETUP.titulo;
  $('#setupDica').textContent = C.SETUP.dica;
  $('#inputCidadeSetup').placeholder = C.SETUP.placeholder;
  ui.showScreen('setup');
}

function enterMain() {
  ui.showScreen('main');
  const bits = dailyBits(state.city.id);
  ui.renderFooter(bits, C.VERSAO);
  ui.setFaixa(
    `EST. FLUVIOMÉTRICA 001 · ${state.city.name.toUpperCase()} · PROTOCOLO Nº ${bits.protocoloDia}`
  );
  ui.panelIdle(C.IDLE_PANEL);
  ui.setBtnMedir({ disabled: false, label: 'MEDIR NÍVEL DO RIO AGORA' });
  ui.renderBoletim(null);

  // pré-busca: o céu da cena e o boletim já chegam prontos
  const reqCity = state.city;
  getWeather(reqCity).then((w) => {
    if (state.city?.id !== reqCity.id) return; // trocaram de rio no meio da busca
    state.lastWeather = w;
    applyScene(w);
    ui.renderBoletim(buildBoletim(w.outlook, w.source, w.ageHours, reqCity.id, 0));
  });
}

function applyScene(w) {
  const sky = skyStateOf(w.outlook);
  ui.setSky(sky.state, sky.drizzle);
  ui.setRaincoat(sky.raincoat);
  ui.setCondicao(C.CONDICAO_LABELS[sky.state]);
}

/* ==================== a medição (o espetáculo) ==================== */

async function measure(turbo) {
  if (state.measuring || !state.city) return;
  const city = state.city; // snapshot: trocar de cidade no meio não mistura os dados
  state.measuring = true;
  state.sessionMeasures++;

  audio.initAudio();
  vibrate(30);

  const pressCount = storage.bumpPresses(dayKey());
  const f = turbo ? 0.55 : 1; // MODO TURBO: mesma liturgia, metade da paciência

  ui.setBtnMedir({ disabled: true, label: turbo ? 'MEDINDO EM MODO TURBO...' : 'MEDINDO...' });
  ui.termStart();
  ui.setMeasuring(true);

  // clima real em paralelo com o teatro — a demora É o produto
  const weatherP = getWeather(city);

  // sonar (pitch sobe = "chegando na resposta")
  const pingTimes = turbo ? [150, 850, 1500, 2000, 2400] : [200, 1600, 3100];
  const pingFreqs = [880, 990, 1100, 1200, 1320];
  const timers = pingTimes.map((t, i) => setTimeout(() => audio.ping(pingFreqs[i]), t * f));

  const loadRng = makeRng(`${dayKey()}:${city.id}:${pressCount}:load`);
  const msgs = pickN(loadRng, C.LOADING_MESSAGES, 5);

  const passo = async (msg, pct, dur, hold = 0) => {
    if (msg) {
      ui.termMsg(msg);
      audio.tick();
      vibrate(15);
    }
    if (pct !== null) ui.termProgress(pct, dur * f);
    await sleep((dur + hold) * f);
  };

  await passo(msgs[0], 45, 900);
  await passo(msgs[1], 70, 900);
  await passo(msgs[2], 87, 900);
  await passo(C.STALL_87, null, 0, 700); // trava institucional nos 87%
  await passo(msgs[3], 99, 300);
  await passo(msgs[4], null, 0, 400);
  ui.termProgress(100, 150 * f);
  await sleep(250 * f);

  // coleta de amostra
  ui.fishJump(false);
  await sleep(500 * f);

  // se a API ainda não respondeu, o teatro continua
  let w = null;
  let extraIdx = 0;
  w = await Promise.race([weatherP, sleep(1).then(() => null)]);
  while (w === null) {
    ui.termMsg(C.MEASURING_EXTRAS[extraIdx++ % C.MEASURING_EXTRAS.length]);
    audio.tick();
    w = await Promise.race([weatherP, sleep(900).then(() => null)]);
  }
  state.lastWeather = w;

  if (state.city?.id !== city.id) {
    // trocaram o rio no meio do expediente; esta medição é arquivada sem carimbo
    timers.forEach(clearTimeout);
    ui.setMeasuring(false);
    state.measuring = false;
    return;
  }

  const result = computeResult({
    outlook: w.outlook,
    source: w.source,
    ageHours: w.ageHours,
    pressCount,
    cityId: city.id,
    turbo,
  });

  audio.chime();
  vibrate([30, 50, 30]);
  ui.termMsg(`MEDIÇÃO CONCLUÍDA ✓ PROTOCOLO Nº ${result.protocol}`);
  await sleep(600 * f);

  ui.setMeasuring(false);
  applyScene(w);
  ui.setWaterLevel(result.riverPercent);

  let sourceBadge = null;
  if (w.source === 'stale') sourceBadge = C.STALE_BADGE.replace('{h}', w.ageHours);
  if (w.source === 'none') sourceBadge = 'sem contato com o satélite GOIABA-7 — laudo emitido no modo intuição';

  const laudoCard = ui.renderLaudo(result, sourceBadge, () => share(result));
  laudoCard?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
  setTimeout(() => {
    audio.thud();
    vibrate(40);
    ui.laudoTreme();
  }, 480);
  if (result.topHat) setTimeout(() => ui.fishJump(true), 1600); // o peixe elegante honra o laudo

  ui.renderBoletim(buildBoletim(w.outlook, w.source, w.ageHours, city.id, pressCount));

  ui.setBtnMedir({ disabled: false, label: 'MEDIR DE NOVO (o rio não fugiu)' });
  state.measuring = false;
  timers.forEach(clearTimeout);

  maybeNudgeInstall();
}

function share(result) {
  const text = buildShareText(result.share, location.origin + location.pathname);
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
}

function maybeNudgeInstall() {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (state.sessionMeasures === 2 && !state.settings.nudged && !standalone) {
    ui.toast(C.TOASTS.installNudge, 7000);
    state.settings.nudged = true;
    storage.setSettings(state.settings);
  }
}

/* ==================== botão (com long-press turbo) ==================== */

function wireButton() {
  const btn = $('#btnMedir');
  let pressTimer = null;
  let turboFired = false;

  btn.addEventListener('pointerdown', () => {
    if (state.measuring) return;
    audio.initAudio(); // dentro do gesto: senão o turbo do long-press fica mudo no iOS
    turboFired = false;
    pressTimer = setTimeout(() => {
      turboFired = true;
      ui.toast(C.TOASTS.turbo, 2500);
      vibrate(60);
      measure(true);
    }, 1500);
  });
  const cancel = () => clearTimeout(pressTimer);
  btn.addEventListener('pointerup', cancel);
  btn.addEventListener('pointerleave', cancel);
  btn.addEventListener('pointercancel', cancel);

  btn.addEventListener('click', (e) => {
    if (turboFired) {
      turboFired = false;
      if (e.detail !== 0) return; // clique fantasma pós-turbo; teclado (detail 0) passa
    }
    measure(false);
  });
}

/* ==================== bichos e segredos ==================== */

function wireEggs() {
  // Jurema: 5 toques em 4s -> festa secreta
  let taps = 0;
  let tapTimer = null;
  $('#capivara').addEventListener('click', () => {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => (taps = 0), 4000);
    if (taps >= 5) {
      taps = 0;
      audio.initAudio();
      audio.chime();
      ui.juremaFesta();
      ui.toast(C.TOASTS.festaJurema, 4000);
    }
  });

  // Pato: quack + pirueta; 10 quacks na vida -> ALMIRANTE Nº 042
  $('#pato').addEventListener('click', () => {
    audio.initAudio();
    audio.quack();
    ui.duckSpin();
    const q = storage.getQuacks() + 1;
    storage.setQuacks(q);
    if (q === 10) {
      ui.duckAlmirante(true);
      ui.toast(C.TOASTS.almirante, 5000);
    }
  });

  // Konami do interior: 4 cantos do céu em ordem
  let seq = 0;
  document.querySelectorAll('.konami').forEach((r) => {
    r.addEventListener('click', () => {
      const canto = Number(r.dataset.canto);
      if (canto === seq) {
        seq++;
        if (seq === 4) {
          seq = 0;
          ui.jacareVai();
          ui.setVersao(C.VERSAO_JACARE);
          ui.toast(C.TOASTS.jacare, 4000);
        }
      } else {
        seq = canto === 0 ? 1 : 0;
      }
    });
  });
}

// o Lambari Aposentado pula sozinho de vez em quando
function scheduleFishJump() {
  setTimeout(() => {
    if (!state.measuring && !document.hidden && state.city) ui.fishJump(false);
    scheduleFishJump();
  }, 9000 + Math.random() * 6000);
}

/* ==================== busca de cidade ==================== */

function attachCitySearch(input, list, onPick) {
  let debounce = null;
  let ctrl = null;

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value;
    if (q.trim().length < 2) {
      ctrl?.abort(); // resposta atrasada não pode reabrir a lista vazia
      ctrl = null;
      ui.renderCityList(list, null);
      return;
    }
    debounce = setTimeout(async () => {
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const results = await searchCity(q, ctrl.signal);
        ui.renderCityList(list, results, C.SETUP.semResultado, (city) => {
          input.value = '';
          ui.renderCityList(list, null);
          onPick(city);
        });
      } catch (err) {
        if (err.name === 'AbortError') return;
        ui.renderCityList(list, [], 'Arquivo de cidades fora do ar. Tente de novo em instantes.', () => {});
      }
    }, 350);
  });
}

function wireSetup() {
  attachCitySearch($('#inputCidadeSetup'), $('#listaCidadesSetup'), (city) => {
    state.city = city;
    storage.setCity(city);
    storage.clearWeatherCache();
    ui.toast(C.TOASTS.cidadeSalva, 3500);
    enterMain();
  });
}

/* ==================== cabeçalho + configurações ==================== */

function wireHeader() {
  $('#btnSom').addEventListener('click', () => {
    state.settings.sound = !state.settings.sound;
    storage.setSettings(state.settings);
    audio.initAudio();
    audio.setSound(state.settings.sound);
    ui.soundIcon(state.settings.sound);
    $('#chkSom').checked = state.settings.sound;
  });

  $('#btnConfig').addEventListener('click', openConfig);
}

function openConfig() {
  $('#cidadeAtual').textContent = state.city
    ? `${state.city.name} – ${state.city.admin1}`
    : '— (nenhum rio sob vigilância)';
  $('#telaConfig').hidden = false;
}

function wireConfig() {
  $('#btnFecharConfig').addEventListener('click', () => {
    $('#telaConfig').hidden = true;
  });
  $('#telaConfig').addEventListener('click', (e) => {
    if (e.target === $('#telaConfig')) $('#telaConfig').hidden = true;
  });

  $('#chkSom').addEventListener('change', (e) => {
    state.settings.sound = e.target.checked;
    storage.setSettings(state.settings);
    audio.setSound(state.settings.sound);
    ui.soundIcon(state.settings.sound);
  });

  attachCitySearch($('#inputCidadeConfig'), $('#listaCidadesConfig'), (city) => {
    state.city = city;
    storage.setCity(city);
    storage.clearWeatherCache();
    $('#telaConfig').hidden = true;
    ui.toast(C.TOASTS.cidadeSalva, 3500);
    enterMain();
  });
}

init();
