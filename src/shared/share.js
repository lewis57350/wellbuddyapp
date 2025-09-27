// src/shared/share.js
export function encodeShare(obj) {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return encodeURIComponent(b64);
}

export function decodeShare(s) {
  try {
    const json = decodeURIComponent(s);
    return JSON.parse(decodeURIComponent(escape(atob(json))));
  } catch {
    return null;
  }
}

export function makeShareUrl(encoded) {
  const base = window.location.origin + window.location.pathname + window.location.search;
  return `${base}#/viewer?s=${encoded}`;
}
