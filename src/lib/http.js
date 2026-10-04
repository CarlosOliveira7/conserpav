export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

/**
 * Faz uma requisição JSON enviando cookies httpOnly e o cabeçalho X-Requested-With (CSRF).
 * Devolve { data, error } sem lançar exceção.
 */
export async function request(method, path, body, { skipExpire = false } = {}) {
  const headers = {
    "X-Requested-With": "XMLHttpRequest",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: "include",
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
    if (response.status === 401 && !skipExpire) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    const errorMessage = payload?.error?.message || (typeof payload?.error === "string" ? payload.error : "Erro ao comunicar com o servidor.");
    return { data: null, error: new Error(errorMessage) };
  }

  return { data: payload, error: null };
}
