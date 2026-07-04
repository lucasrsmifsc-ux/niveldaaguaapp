// localStorage com try/catch (Safari em modo privado lança em setItem)

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado: o app segue sem memória, como um peixe */
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

let memPresses = null;

export const storage = {
  getCity: () => get('chs_city'),
  setCity: (c) => set('chs_city', c),

  getWeatherCache: () => get('chs_weather'),
  setWeatherCache: (w) => set('chs_weather', w),
  clearWeatherCache: () => remove('chs_weather'),

  // contador de apertos do dia (zera na virada)
  bumpPresses(dayKey) {
    const stored = get('chs_presses', null);
    const base = Math.max(
      stored && stored.date === dayKey ? stored.n : 0,
      memPresses && memPresses.date === dayKey ? memPresses.n : 0
    );
    const next = { date: dayKey, n: base + 1 };
    set('chs_presses', next);
    memPresses = next; // se o localStorage estiver de folga (modo privado), a memória segura
    return next.n;
  },

  getSettings: () => get('chs_settings', { sound: true, nudged: false }),
  setSettings: (s) => set('chs_settings', s),

  getQuacks: () => get('chs_quacks', 0),
  setQuacks: (n) => set('chs_quacks', n),

  getOnboarded: () => get('chs_onboarded', false),
  setOnboarded: () => set('chs_onboarded', true),
};
