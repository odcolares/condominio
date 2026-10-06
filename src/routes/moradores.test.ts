import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

describe("Moradores Integration Tests", () => {
  let token: string;

  beforeEach(async () => {
    __resetDb();
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });
    token = loginRes.body.access_token;
  });

  it("GET /moradores - lists moradores", async () => {
    const res = await request(app)
      .get("/moradores")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /moradores/:id - returns morador with telegram field", async () => {
    const res = await request(app)
      .get("/moradores/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("telegram");
  });

  it("POST /moradores - creates morador with telegram and whatsapp", async () => {
    const res = await request(app)
      .post("/moradores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome_completo: "Teste Morador",
        cpf: "111.222.333-44",
        whatsapp: "(11) 99999-8888",
        telegram: "@teste_morador",
        bloco: "12",
        apartamento: "301",
      });
    expect(res.status).toBe(201);
    expect(res.body.nome_completo).toBe("Teste Morador");
    expect(res.body.telegram).toBe("@teste_morador");
    expect(res.body.whatsapp).toBe("(11) 99999-8888");
  });

  it("POST /moradores - rejects when no contact (whatsapp/telegram/telefone)", async () => {
    const res = await request(app)
      .post("/moradores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome_completo: "Sem Contato",
        cpf: "222.333.444-55",
        whatsapp: null,
        telegram: null,
        telefone: null,
        bloco: "12",
        apartamento: "301",
      });
    expect(res.status).toBe(422);
    expect(res.body.detail).toContain("WhatsApp");
  });

  it("POST /moradores - rejects when bloco is missing", async () => {
    const res = await request(app)
      .post("/moradores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome_completo: "Sem Bloco",
        cpf: "333.444.555-66",
        whatsapp: "(11) 99999-8888",
        bloco: null,
        apartamento: "301",
      });
    expect(res.status).toBe(422);
    expect(res.body.detail).toContain("Bloco");
  });

  it("POST /moradores - rejects when apartamento is missing", async () => {
    const res = await request(app)
      .post("/moradores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome_completo: "Sem Apto",
        cpf: "444.555.666-77",
        whatsapp: "(11) 99999-8888",
        bloco: "12",
        apartamento: null,
      });
    expect(res.status).toBe(422);
    expect(res.body.detail).toContain("Apartamento");
  });

  it("POST /moradores - accepts telefone as fallback contact when no whatsapp/telegram", async () => {
    const res = await request(app)
      .post("/moradores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome_completo: "Tel apenas",
        cpf: "555.666.777-88",
        telefone: "(11) 97777-6666",
        whatsapp: null,
        telegram: null,
        bloco: "12",
        apartamento: "301",
      });
    expect(res.status).toBe(201);
    expect(res.body.telefone).toBe("(11) 97777-6666");
  });

  it("PUT /moradores/:id - accepts telegram field update", async () => {
    const res = await request(app)
      .put("/moradores/1")
      .set("Authorization", `Bearer ${token}`)
      .send({
        telegram: "@novo_telegram_502",
      });
    expect(res.status).toBe(200);
    expect(res.body.telegram).toBe("@novo_telegram_502");
  });

  it("PUT /moradores/:id - rejects emptying all contacts", async () => {
    const res = await request(app)
      .put("/moradores/1")
      .set("Authorization", `Bearer ${token}`)
      .send({
        whatsapp: null,
        telegram: null,
        telefone: null,
      });
    expect(res.status).toBe(422);
  });

  it("POST /moradores - rejects duplicate CPF", async () => {
    const res = await request(app)
      .post("/moradores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome_completo: "Duplicado",
        cpf: "123.456.789-00",
        whatsapp: "(11) 99999-8888",
        bloco: "12",
        apartamento: "301",
      });
    expect(res.status).toBe(409);
  });

  it("GET /moradores/:id - returns 404 for non-existent", async () => {
    const res = await request(app)
      .get("/moradores/99999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("DELETE /moradores/:id - removes morador and linked veiculos", async () => {
    const res = await request(app)
      .delete("/moradores/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
