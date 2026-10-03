// Cliente HTTP da API própria (Node + PostgreSQL). Substitui o antigo cliente Supabase.
// Em desenvolvimento, o Vite encaminha "/api" para http://localhost:3001 (vite.config.js).
// Em produção, defina VITE_API_URL com a URL pública da API.
export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const TOKEN_KEY = "obra-frequencia-token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* armazenamento indisponível: a sessão vale apenas até recarregar */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignora */
  }
}

/**
 * Faz uma requisição JSON. Nunca lança exceção: devolve { data, error }.
 * Se a API responder 401 com um token salvo (sessão expirada), limpa o token e
 * dispara o evento "auth:expired" para o AuthContext levar o usuário ao login.
 */
export async function request(method, path, body, { skipExpire = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { data: null, error: new Error("Não foi possível conectar ao servidor.") };
  }

  if (response.status === 204) return { data: null, error: null };

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* resposta sem corpo JSON */
  }

  if (!response.ok) {
    if (response.status === 401 && token && !skipExpire) {
      clearToken();
      window.dispatchEvent(new Event("auth:expired"));
    }
    return { data: null, error: new Error(payload?.error || "Erro ao comunicar com o servidor.") };
  }

  return { data: payload, error: null };
}
