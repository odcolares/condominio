import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

describe("Acessos Integration Tests", () => {
  let token: string;

  beforeEach(async () => {
    __resetDb();
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });
    token = loginRes.body.access_token;
  });

  it("GET /acessos - lists access logs", async () => {
    const res = await request(app)
      .get("/acessos")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /acessos - manual access registration for valid visitor", async () => {
    const visitorRes = await request(app)
      .post("/visitantes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Visitante Acesso",
        documento: "111222333",
        telefone: "11777777777",
        morador_id: 1,
      });

    const visitorId = visitorRes.body.id;

    const res = await request(app)
      .post("/acessos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipo_pessoa: "visitante",
        pessoa_id: visitorId,
        sentido: "entrada",
        placa_veiculo: "ABC-1234",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.sentido).toBe("entrada");
  });

  it("POST /acessos - fails with missing fields (422)", async () => {
    const res = await request(app)
      .post("/acessos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipo_pessoa: "visitante",
      });

    expect(res.status).toBe(422);
  });

  it("POST /acessos - fails with unknown person (404)", async () => {
    const res = await request(app)
      .post("/acessos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipo_pessoa: "visitante",
        pessoa_id: 99999,
        sentido: "entrada",
      });

    expect(res.status).toBe(404);
  });
});
