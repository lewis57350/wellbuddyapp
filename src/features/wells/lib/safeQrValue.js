export function makeWellUrl(wellId) {
  try {
    const { origin, pathname } = window.location;
    // HashRouter route works on localhost AND GitHub Pages
    return `${origin}${pathname}#/well/${encodeURIComponent(wellId)}`;
  } catch {
    // Fallback (in case window is unavailable)
    return `#/well/${encodeURIComponent(wellId)}`;
  }
}