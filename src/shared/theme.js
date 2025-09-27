// src/shared/theme.js
const KEY = "wb_theme";
export const THEMES = ["light", "dark", "oil", "oil-dark"];

export function applyTheme(name) {
  const t = THEMES.includes(name) ? name : "light";
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(KEY, t);

  // Optional: mobile browser status bar color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.content =
      t === "oil" || t === "oil-dark" ? "#7a1d1d" :
      t === "dark"                    ? "#111827" :
                                        "#ffffff";
  }
}

export function initTheme() {
  const saved = localStorage.getItem(KEY);
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (sysDark ? "dark" : "light"));
}
