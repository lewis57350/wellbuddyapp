// Dashboard config (widgets order + theme), persisted in localStorage.

const KEY = "wb_dashboard";
const THEME_KEY = "wb_theme";

// Default widgets shown on first load:
const DEFAULT_WIDGETS = ["oil", "map", "clock", "todo"];

const DEFAULT_CFG = {
  widgets: DEFAULT_WIDGETS,
  theme: (typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY)) || "light",
};

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    const widgets = Array.isArray(raw.widgets) ? raw.widgets : DEFAULT_CFG.widgets;
    const theme = raw.theme || DEFAULT_CFG.theme;
    return { widgets, theme };
  } catch {
    return { ...DEFAULT_CFG };
  }
}

function write(cfg) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  return cfg;
}

export function getDashboard() {
  return read();
}

export function saveDashboard(patch) {
  const prev = read();
  const next = { ...prev, ...patch };
  return write(next);
}

export function resetDashboard() {
  localStorage.removeItem(KEY);
  return write({ ...DEFAULT_CFG, widgets: [...DEFAULT_WIDGETS] });
}

export function setTheme(nextTheme) {
  const next = saveDashboard({ theme: nextTheme });
  localStorage.setItem(THEME_KEY, nextTheme);

  // apply html.dark class immediately for live preview
  const root = document.documentElement;
  if (nextTheme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  return next;
}
