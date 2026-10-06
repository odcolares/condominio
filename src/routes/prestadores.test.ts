import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

describe("Prestadores Integration Tests", () => {
  let token: string;

  beforeEach(async () => {
    __resetDb();
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });
    token = loginRes.body.access_token;
  });

  it("GET /prestadores - lists providers", async () => {
    const res = await request(app)
      .get("/prestadores")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /prestadores - creates provider with valid data_fim", async () => {
    const res = await request(app)
      .post("/prestadores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Eletricista Teste",
        empresa: "EletroCorp",
        funcao: "Manutenção",
        documento: "123456789",
        data_inicio: "2026-10-01",
        data_fim: "2026-10-05",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.nome).toBe("Eletricista Teste");
    expect(res.body).toHaveProperty("whatsappUrl");
    expect(res.body).toHaveProperty("telegramUrl");
  });

  it("POST /prestadores - fails when data_fim is missing (422)", async () => {
    const res = await request(app)
      .post("/prestadores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Eletricista Teste",
        empresa: "EletroCorp",
        funcao: "Manutenção",
        documento: "123456789",
        data_inicio: "2026-10-01",
      });

    expect(res.status).toBe(422);
  });

  it("POST /prestadores/:id/entrada and saida", async () => {
    const createRes = await request(app)
      .post("/prestadores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Encanador Teste",
        empresa: "CanoCorp",
        funcao: "Encanamento",
        documento: "987654321",
        data_inicio: "2026-10-01",
        data_fim: "2026-10-05",
      });

    const id = createRes.body.id;

    const entryRes = await request(app)
      .post(`/prestadores/${id}/entrada`)
      .set("Authorization", `Bearer ${token}`);
    expect(entryRes.status).toBe(200);
    expect(entryRes.body.prestador).toHaveProperty("presente", true);
    expect(entryRes.body).toHaveProperty("whatsappUrl");
    expect(entryRes.body).toHaveProperty("telegramUrl");

    const exitRes = await request(app)
      .post(`/prestadores/${id}/saida`)
      .set("Authorization", `Bearer ${token}`);
    expect(exitRes.status).toBe(200);
    expect(exitRes.body.prestador).toHaveProperty("presente", false);
    expect(exitRes.body).toHaveProperty("telegramUrl");
  });
});
