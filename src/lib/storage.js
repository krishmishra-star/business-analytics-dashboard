// Small localStorage wrapper that never throws (private mode, quota, SSR etc.)
export function loadJSON(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const KEYS = {
  data: 'pulsemetrics:data:v1',
  filters: 'pulsemetrics:filters:v1',
  sidebar: 'pulsemetrics:sidebar:v1',
};
