import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

describe("Encomendas Integration Tests", () => {
  let token: string;

  beforeEach(async () => {
    __resetDb();
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });
    token = loginRes.body.access_token;
  });

  it("GET /encomendas - lists packages", async () => {
    const res = await request(app)
      .get("/encomendas")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /encomendas/:id - returns notification links", async () => {
    const res = await request(app)
      .get("/encomendas/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("whatsappUrl");
    expect(res.body).toHaveProperty("telegramUrl");
    expect(res.body.morador_telegram).toBeTruthy();
  });

  it("POST /encomendas - creates package with notification links and propagates telegram", async () => {
    const res = await request(app)
      .post("/encomendas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        morador_id: 1,
        codigo_rastreio: "BR123456789012",
        transportadora: "Correios",
        tipo_volume: "Caixa Pequena",
        observacoes: "Entregar com cuidado",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("codigo_retirada");
    expect(res.body).toHaveProperty("whatsappUrl");
    expect(res.body).toHaveProperty("telegramUrl");
    expect(res.body.morador_telegram).toBe("@carloslima502");
    expect(res.body.mensagem_aviso).toContain("RET-");
  });

  it("POST /encomendas/:id/notificar - returns notification links", async () => {
    const res = await request(app)
      .post("/encomendas/1/notificar")
      .set("Authorization", `Bearer ${token}`)
      .send({ canal: "ambos" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("whatsappUrl");
    expect(res.body).toHaveProperty("telegramUrl");
    expect(res.body).toHaveProperty("sucesso", true);
  });

  it("POST /encomendas/:id/retirar - marks as delivered", async () => {
    const codeRes = await request(app)
      .get("/encomendas/1")
      .set("Authorization", `Bearer ${token}`);
    const codigoRetirada = codeRes.body.codigo_retirada;

    const res = await request(app)
      .post("/encomendas/1/retirar")
      .set("Authorization", `Bearer ${token}`)
      .send({
        codigo_retirada: codigoRetirada,
        retirado_por: "Carlos Lima (Própria)",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("sucesso", true);
  });

  it("POST /encomendas/:id/retirar - rejects wrong code", async () => {
    const res = await request(app)
      .post("/encomendas/1/retirar")
      .set("Authorization", `Bearer ${token}`)
      .send({
        codigo_retirada: "RET-9999",
        retirado_por: "Intruso",
      });

    expect(res.status).toBe(400);
  });

  it("GET /encomendas/stats - returns summary stats", async () => {
    const res = await request(app)
      .get("/encomendas/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("pendentes");
    expect(res.body).toHaveProperty("retiradas_hoje");
  });

  it("GET /encomendas/:id - returns 404 for non-existent", async () => {
    const res = await request(app)
      .get("/encomendas/99999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
