import { API_URL, clearToken, getToken } from "./http";

/**
 * Tempo real: abre uma conexão Server-Sent Events com a API (GET /events) e
 * entrega cada mudança de tabela como { table, eventType, new, old } — o mesmo
 * formato que o Supabase Realtime usava, então o AppContext quase não muda.
 *
 * Usa fetch em vez de EventSource para poder enviar o cabeçalho Authorization.
 * Reconecta sozinho; em reconexões chama onReconnect() para o app recarregar os
 * dados que possam ter mudado enquanto a conexão estava fora.
 *
 * Retorna uma função que encerra a assinatura.
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
          headers: { Authorization: `Bearer ${getToken()}`, Accept: "text/event-stream" },
          signal: controller.signal,
        });

        if (response.status === 401) {
          clearToken();
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
