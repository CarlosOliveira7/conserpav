import { API_URL } from "./http";

/**
 * Conexão SSE com a API (GET /events) que entrega alterações em tempo real via fetch + stream,
 * autenticada automaticamente pelo cookie httpOnly.
 */
export function subscribeToChanges({ onChange, onReconnect }) {
  let stopped = false;
  let controller = null;
  let connectedBefore = false;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function loop() {
    while (!stopped) {
      try {
        controller = new AbortController();
        const response = await fetch(`${API_URL}/events`, {
          headers: {
            Accept: "text/event-stream",
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.dispatchEvent(new Event("auth:expired"));
          return;
        }
        if (!response.ok || !response.body) throw new Error("falha ao abrir eventos");

        if (connectedBefore) onReconnect?.();
        connectedBefore = true;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split("\n\n");
          buffer = messages.pop();
          for (const message of messages) {
            const line = message.split("\n").find((entry) => entry.startsWith("data:"));
            if (!line) continue;
            try {
              onChange(JSON.parse(line.slice(5).trim()));
            } catch {
              /* mensagem malformada: ignora */
            }
          }
        }
      } catch {
        /* queda de rede ou abortado: tenta reconectar abaixo */
      }
      if (!stopped) await sleep(3000);
    }
  }

  loop();

  return () => {
    stopped = true;
    controller?.abort();
  };
}
