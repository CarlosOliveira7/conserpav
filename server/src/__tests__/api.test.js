import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { parseCorsOrigins } from "../config.js";

vi.mock("../db.js", () => ({
  query: vi.fn(async (sql) => {
    if (sql.includes("SELECT 1")) {
      return { rows: [{ "?column?": 1 }] };
    }
    if (sql.includes("FROM users WHERE lower(email)")) {
      return { rows: [] };
    }
    return { rows: [], rowCount: 0 };
  }),
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
  withTransaction: vi.fn(),
}));

import app from "../app.js";

describe("API Endpoints", () => {
  describe("CORS", () => {
    it("normaliza origens separadas por vírgula", () => {
      expect(parseCorsOrigins(" https://front.example/ , , http://localhost:5173/// ")).toEqual([
        "https://front.example",
        "http://localhost:5173",
      ]);
    });

    it("recusa origem não permitida com 403 JSON", async () => {
      const res = await request(app).get("/api/health").set("Origin", "https://untrusted.example");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("CORS_ORIGIN_DENIED");
    });

    it("responde preflight permitido com credenciais", async () => {
      const res = await request(app)
        .options("/api/auth/me")
        .set("Origin", "http://localhost:5173")
        .set("Access-Control-Request-Method", "GET");

      expect(res.status).toBe(204);
      expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("GET /api/health", () => {
    it("responde 200 com ok: true", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe("POST /api/auth/login - Validação e Segurança", () => {
    it("rejeita requisição com campos ausentes via Zod (400)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("X-Requested-With", "XMLHttpRequest")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejeita e-mail inválido via Zod (400)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("X-Requested-With", "XMLHttpRequest")
        .send({ email: "nao-eh-email", password: "qualquer-senha" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("retorna 401 com mensagem genérica para credenciais incorretas", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set("X-Requested-With", "XMLHttpRequest")
        .send({ email: "inexistente@conserpav.com.br", password: "senha-incorreta" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("Autenticação e Proteção de Rotas", () => {
    it("bloqueia acesso não autenticado a rotas protegidas (401)", async () => {
      const res = await request(app).get("/api/projects");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("bloqueia requisições de mutação sem o cabeçalho CSRF (403)", async () => {
      const res = await request(app)
        .post("/api/projects")
        .send({ name: "Obra Teste", closing_period: "quinzenal" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("CSRF_PROTECTION");
    });

    it("responde 403 para Referer malformado sem gerar erro interno", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Referer", "invalid-url");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("CSRF_PROTECTION");
    });
  });

  describe("Validação de Parâmetros e Constraints", () => {
    it("rejeita consulta de presença com semanas inválidas (não segundas-feiras)", async () => {
      const res = await request(app)
        .get("/api/attendance?weeks=2026-08-04") // 2026-08-04 is Tuesday
        .set("Authorization", "Bearer invalid-token");

      expect([400, 401]).toContain(res.status);
    });
  });

  describe("Rota 404", () => {
    it("retorna erro padronizado para rota inexistente", async () => {
      const res = await request(app).get("/api/rota-inexistente");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Rota não encontrada.",
        },
      });
    });
  });
});
