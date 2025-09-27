// src/features/profile/lib/profile.js
const KEY = "wb_profile";

const DEFAULT = {
  companyName: "",
  logoUrl: ""
};

export function getProfile() {
  try {
    return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY) || "{}")) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProfile(patch) {
  const next = { ...getProfile(), ...(patch || {}) };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}