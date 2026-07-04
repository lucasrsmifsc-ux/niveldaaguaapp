// Trilha sonora oficial da Estação: 100% Web Audio, zero arquivos.
// AudioContext só nasce no primeiro gesto do usuário (regra do iOS/Android).

let ctx = null;
let master = null;
let soundOn = true;

export function initAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = soundOn ? 0.5 : 0;
    master.connect(ctx.destination);
  }
  // 'suspended' (política de autoplay) e 'interrupted' (iOS pós-ligação/Siri)
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
}

// só retoma se o contexto já existe — para o safety net de visibilitychange
export function resumeIfNeeded() {
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

export function audioState() {
  return {
    supported: !!(window.AudioContext || window.webkitAudioContext),
    created: !!ctx,
    state: ctx ? ctx.state : 'não criado',
    soundOn,
  };
}

export function setSound(on) {
  soundOn = on;
  if (master) master.gain.value = on ? 0.5 : 0;
}

function env(gainNode, t0, peak, dur) {
  gainNode.gain.setValueAtTime(0.0001, t0);
  gainNode.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

// Sonar: senoide caindo de startFreq até 220Hz + eco via DelayNode
export function ping(startFreq = 880) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, t0);
  osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.35);
  env(g, t0, 0.4, 0.4);

  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.28;
  const fb = ctx.createGain();
  fb.gain.value = 0.3;
  delay.connect(fb);
  fb.connect(delay);

  osc.connect(g);
  g.connect(master);
  g.connect(delay);
  delay.connect(master);
  osc.start(t0);
  osc.stop(t0 + 1.6);
}

// Tique de teletipo nas trocas de mensagem (quase subliminar)
export function tick() {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 1400;
  env(g, t0, 0.08, 0.03);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.05);
}

// "Protocolo concluído": C5 -> G5, institucional, não celebratório
export function chime() {
  if (!ctx) return;
  const notes = [
    { f: 523.25, t: 0, d: 0.14 },
    { f: 783.99, t: 0.13, d: 0.32 },
  ];
  for (const n of notes) {
    const t0 = ctx.currentTime + n.t;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = n.f;
    env(g, t0, 0.3, n.d);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + n.d + 0.1);
  }
}

// Carimbo: tum grave + sopro de ruído filtrado
export function thud() {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, t0);
  osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.08);
  env(g, t0, 0.6, 0.12);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.2);

  const len = Math.floor(ctx.sampleRate * 0.04);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  const ng = ctx.createGain();
  ng.gain.value = 0.5;
  noise.connect(lp);
  lp.connect(ng);
  ng.connect(master);
  noise.start(t0);
}

// Quack comicamente ruim de propósito
export function quack() {
  if (!ctx) return;
  const notes = [
    { f: 280, t: 0 },
    { f: 180, t: 0.12 },
  ];
  for (const n of notes) {
    const t0 = ctx.currentTime + n.t;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(n.f, t0);
    osc.frequency.exponentialRampToValueAtTime(n.f * 0.7, t0 + 0.1);
    env(g, t0, 0.12, 0.11);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.15);
  }
}
