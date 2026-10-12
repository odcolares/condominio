import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

async function login(email: string, senha: string) {
  const res = await request(app)
    .post("/auth/login")
    .send({ email, senha });
  return res.body.access_token;
}

describe("RBAC - Role-Based Access Control", () => {
  let adminToken: string;
  let moradorToken: string;

  beforeEach(async () => {
    __resetDb();
    adminToken = await login("adm@adm.com", "123");
    moradorToken = await login("carlos@ambros.com", "123");
  });

  describe("Morador (resident) is denied access to admin/portaria routes", () => {
    const restrictedRoutes = [
      { method: "get" as const, path: "/moradores" },
      { method: "get" as const, path: "/moradores/1" },
      { method: "get" as const, path: "/veiculos" },
      { method: "get" as const, path: "/veiculos/stats" },
      { method: "get" as const, path: "/visitantes" },
      { method: "get" as const, path: "/visitantes/stats" },
      { method: "get" as const, path: "/acessos" },
      { method: "get" as const, path: "/encomendas" },
      { method: "get" as const, path: "/encomendas/stats" },
      { method: "get" as const, path: "/prestadores" },
      { method: "get" as const, path: "/ocorrencias" },
      { method: "get" as const, path: "/ocorrencias/1" },
      { method: "get" as const, path: "/restricoes" },
      { method: "post" as const, path: "/restricoes" },
      { method: "get" as const, path: "/dashboard" },
      { method: "get" as const, path: "/leads" },
      { method: "get" as const, path: "/auth/usuarios" },
    ];

    for (const { method, path } of restrictedRoutes) {
      it(`Morador receives 403 on ${method.toUpperCase()} ${path}`, async () => {
        const res = await request(app)
          [method](path)
          .set("Authorization", `Bearer ${moradorToken}`);
        expect(res.status).toBe(403);
      });
    }

    it("Morador receives 403 on POST /comunicados", async () => {
      const res = await request(app)
        .post("/portal/comunicados")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({ titulo: "Teste", categoria: "aviso_geral", conteudo: "Teste" });
      expect(res.status).toBe(403);
    });

    it("Morador receives 403 on DELETE /comunicados/:id", async () => {
      const res = await request(app)
        .delete("/portal/comunicados/1")
        .set("Authorization", `Bearer ${moradorToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Morador retains access to portal and own data", () => {
    it("Morador receives 200 on GET /portal/morador", async () => {
      const res = await request(app)
        .get("/portal/morador")
        .set("Authorization", `Bearer ${moradorToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("morador");
      expect(res.body).toHaveProperty("preautorizacoes");
      expect(res.body).toHaveProperty("prestadores");
    });

    it("Morador receives 200 on GET /portal/comunicados", async () => {
      const res = await request(app)
        .get("/portal/comunicados")
        .set("Authorization", `Bearer ${moradorToken}`);
      expect(res.status).toBe(200);
    });

    it("Morador receives 200 on GET /portal/notificacoes-sistema", async () => {
      const res = await request(app)
        .get("/portal/notificacoes-sistema")
        .set("Authorization", `Bearer ${moradorToken}`);
      expect(res.status).toBe(200);
    });

    it("Morador receives 200 on POST /portal/preautorizacao", async () => {
      const res = await request(app)
        .post("/portal/preautorizacao")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({
          morador_id: 1,
          nome_visitante: "Visitante Teste RBAC",
          data_prevista: "2026-10-10",
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("codigo_acesso_qr");
    });

    it("Morador receives 201 on POST /portal/prestador", async () => {
      const res = await request(app)
        .post("/portal/prestador")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({
          nome: "Pedreiro Teste",
          documento: "999.888.777-66",
          funcao: "Pedreiro",
          data_inicio: "2026-10-08",
          data_fim: "2026-10-15",
        });
      expect(res.status).toBe(201);
      expect(res.body.nome).toBe("Pedreiro Teste");
      expect(res.body.morador_autorizador_id).toBe(1);
    });

    it("Morador receives 200 on GET /portal/prestadores", async () => {
      const res = await request(app)
        .get("/portal/prestadores?morador_id=1")
        .set("Authorization", `Bearer ${moradorToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("Morador receives 200 on GET /ocorrencias POST (can report incidents)", async () => {
      const res = await request(app)
        .post("/ocorrencias")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({
          titulo: "Incidente de Teste",
          categoria: "outros",
          gravidade: "baixa",
          descricao: "Teste de ocorrência pelo morador",
          bloco: "05",
          apartamento: "502",
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  describe("Admin retains full access to all routes", () => {
    it("Admin receives 200 on GET /dashboard", async () => {
      const res = await request(app)
        .get("/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("Admin receives 200 on GET /moradores", async () => {
      const res = await request(app)
        .get("/moradores")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("Admin receives 200 on GET /leads", async () => {
      const res = await request(app)
        .get("/leads")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe("Unauthenticated requests are rejected", () => {
    it("No token → 401 on /moradores", async () => {
      const res = await request(app).get("/moradores");
      expect(res.status).toBe(401);
    });

    it("No token → 401 on /portal/morador", async () => {
      const res = await request(app).get("/portal/morador");
      expect(res.status).toBe(401);
    });
  });
});
