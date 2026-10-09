export function normalizeApiBase(value) {
  const base = value?.trim().replace(/\/+$/, "") || "/api";
  return /(^|\/)api$/i.test(base) ? base : `${base}/api`;
}

export const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_URL);

export function buildApiUrl(path) {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}