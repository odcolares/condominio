import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

describe("Visitantes Integration Tests", () => {
  let token: string;

  beforeEach(async () => {
    __resetDb();
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });
    token = loginRes.body.access_token;
  });

  it("GET /visitantes - lists visitors", async () => {
    const res = await request(app)
      .get("/visitantes")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /visitantes - creates a new visitor", async () => {
    const res = await request(app)
      .post("/visitantes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Visitante Teste",
        documento: "123456789",
        telefone: "11999999999",
        morador_id: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.nome).toBe("Visitante Teste");
  });

  it("POST /visitantes/:id/entrada and saida", async () => {
    const createRes = await request(app)
      .post("/visitantes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Visitante Entrada",
        documento: "987654321",
        telefone: "11888888888",
        morador_id: 1,
      });

    const id = createRes.body.id;

    const entryRes = await request(app)
      .post(`/visitantes/${id}/entrada`)
      .set("Authorization", `Bearer ${token}`);
    expect(entryRes.status).toBe(200);
    expect(entryRes.body.visitante).toHaveProperty("presente", true);

    const exitRes = await request(app)
      .post(`/visitantes/${id}/saida`)
      .set("Authorization", `Bearer ${token}`);
    expect(exitRes.status).toBe(200);
    expect(exitRes.body.visitante).toHaveProperty("presente", false);
  });
});
