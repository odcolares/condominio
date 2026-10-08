import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

describe("Portal Integration Tests", () => {
  let adminToken: string;
  let moradorToken: string;

  beforeEach(async () => {
    __resetDb();
    const adminRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });
    adminToken = adminRes.body.access_token;

    const moradorRes = await request(app)
      .post("/auth/login")
      .send({ email: "carlos@ambros.com", senha: "123" });
    moradorToken = moradorRes.body.access_token;
  });

  describe("GET /portal/morador", () => {
    it("returns consolidated resident data", async () => {
      const res = await request(app)
        .get("/portal/morador?morador_id=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("morador");
      expect(res.body).toHaveProperty("veiculos");
      expect(res.body).toHaveProperty("encomendas");
      expect(res.body).toHaveProperty("preautorizacoes");
      expect(res.body).toHaveProperty("reservas");
      expect(res.body).toHaveProperty("prestadores");
      expect(res.body).toHaveProperty("comunicados");
      expect(res.body).toHaveProperty("notificacoes");
      expect(res.body).toHaveProperty("moradoresDisponiveis");
    });

    it("returns 404 for non-existent morador", async () => {
      const res = await request(app)
        .get("/portal/morador?morador_id=99999")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /portal/preautorizacao", () => {
    it("creates pre-authorization and returns WhatsApp notification links", async () => {
      const res = await request(app)
        .post("/portal/preautorizacao")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          morador_id: 1,
          nome_visitante: "Maria Teste",
          data_prevista: "2026-10-15",
          documento_visitante: "123.456.789-00",
          placa_veiculo: "TST1A23",
          observacao: "Visita de negócios",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("codigo_acesso_qr");
      expect(res.body).toHaveProperty("whatsappUrl");
      expect(res.body).toHaveProperty("telegramUrl");
      expect(res.body.nome_visitante).toBe("Maria Teste");
      expect(res.body.status).toBe("aguardando");
    });

    it("creates pre-authorization and sends WhatsApp link for morador login", async () => {
      const res = await request(app)
        .post("/portal/preautorizacao")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({
          morador_id: 1,
          nome_visitante: "João Convidado",
          data_prevista: "2026-10-20",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("whatsappUrl");
      expect(res.body.whatsappUrl).toContain("api.whatsapp.com");
    });

    it("returns 422 when required fields are missing", async () => {
      const res = await request(app)
        .post("/portal/preautorizacao")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          morador_id: 1,
          nome_visitante: "Teste",
        });
      expect(res.status).toBe(422);
    });
  });

  describe("POST /portal/prestador", () => {
    it("creates a prestador for the logged-in morador with WhatsApp links", async () => {
      const res = await request(app)
        .post("/portal/prestador")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({
          nome: "Eletricista João",
          documento: "555.666.777-88",
          funcao: "Eletricista",
          empresa: "Luz & Cia",
          data_inicio: "2026-10-08",
          data_fim: "2026-10-15",
          telefone: "(11) 99999-8888",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.nome).toBe("Eletricista João");
      expect(res.body.morador_autorizador_id).toBe(1);
      expect(res.body.bloco).toBe("05");
      expect(res.body.apartamento).toBe("502");
      expect(res.body).toHaveProperty("whatsappUrl");
      expect(res.body).toHaveProperty("telegramUrl");
    });

    it("supports prazo_dias instead of explicit data_fim", async () => {
      const res = await request(app)
        .post("/portal/prestador")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({
          nome: "Encarnador Pedro",
          documento: "444.555.666-77",
          funcao: "Encanador",
          data_inicio: "2026-10-08",
          prazo_dias: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.data_fim).toBeTruthy();
    });

    it("returns 422 when required fields are missing", async () => {
      const res = await request(app)
        .post("/portal/prestador")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({
          nome: "Incomplete",
        });
      expect(res.status).toBe(422);
    });
  });

  describe("GET /portal/prestadores", () => {
    it("returns only prestadores for the specified morador", async () => {
      // Primeiro cria um prestador para o morador 1
      await request(app)
        .post("/portal/prestador")
        .set("Authorization", `Bearer ${moradorToken}`)
        .send({
          nome: "Prestador Teste",
          documento: "111.222.333-44",
          funcao: "Manutenção",
          data_inicio: "2026-10-08",
          data_fim: "2026-10-15",
        });

      const res = await request(app)
        .get("/portal/prestadores?morador_id=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((p: any) => p.nome === "Prestador Teste");
      expect(found).toBeTruthy();
      expect(found.morador_autorizador_id).toBe(1);
    });

    it("returns 404 for non-existent morador", async () => {
      const res = await request(app)
        .get("/portal/prestadores?morador_id=99999")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("Visitor entry confirmation flow", () => {
    it("POST /visitantes/:id/entrada updates pre-auth status and returns WhatsApp links", async () => {
      // Create a pre-authorization for morador 1
      const preRes = await request(app)
        .post("/portal/preautorizacao")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          morador_id: 1,
          nome_visitante: "Visita Confirmada",
          data_prevista: "2026-10-15",
        });

      expect(preRes.status).toBe(201);

      // Find the visitante created from this pre-auth
      const visitanteRes = await request(app)
        .get("/visitantes")
        .set("Authorization", `Bearer ${adminToken}`);
      const visitante = visitanteRes.body.find((v: any) => v.nome === "Visita Confirmada");
      expect(visitante).toBeTruthy();

      // Register entry
      const entryRes = await request(app)
        .post(`/visitantes/${visitante.id}/entrada`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(entryRes.status).toBe(200);
      expect(entryRes.body.sucesso).toBe(true);
      expect(entryRes.body).toHaveProperty("whatsappUrl");

      // Verify pre-auth was updated to "acessou"
      const preAuthRes = await request(app)
        .get("/portal/morador?morador_id=1")
        .set("Authorization", `Bearer ${adminToken}`);
      const pre = preAuthRes.body.preautorizacoes.find(
        (p: any) => p.nome_visitante === "Visita Confirmada"
      );
      expect(pre).toBeTruthy();
      expect(pre.status).toBe("acessou");
    });
  });

  describe("GET /portal/notificacoes-sistema", () => {
    it("returns notifications with pending count", async () => {
      const res = await request(app)
        .get("/portal/notificacoes-sistema")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total_pendentes");
      expect(res.body).toHaveProperty("notificacoes");
    });
  });

  describe("POST /portal/notificacoes-sistema/marcar-lidas", () => {
    it("marks all notifications as read", async () => {
      const res = await request(app)
        .post("/portal/notificacoes-sistema/marcar-lidas")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("sucesso", true);
      expect(res.body.total_pendentes).toBe(0);
    });
  });
});
