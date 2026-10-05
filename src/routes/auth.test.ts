import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

describe("Auth Integration Tests", () => {
  beforeEach(() => {
    __resetDb();
  });

  it("POST /auth/login - success with valid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("access_token");
    expect(res.body.usuario).toHaveProperty("email", "adm@adm.com");
  });

  it("POST /auth/login - fails with invalid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "wrong" });

    expect(res.status).toBe(401);
  });

  it("GET /auth/me - success with valid token", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });

    const token = loginRes.body.access_token;

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "adm@adm.com");
  });

  it("PUT /auth/me - successfully updates profile", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });

    const token = loginRes.body.access_token;

    const res = await request(app)
      .put("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Administrador Atualizado", email: "adm@adm.com" });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toHaveProperty("nome", "Administrador Atualizado");
  });

  it("GET /portal/notificacoes-sistema and POST /portal/notificacoes-sistema/marcar-lidas", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });

    const token = loginRes.body.access_token;

    const notifRes = await request(app)
      .get("/portal/notificacoes-sistema")
      .set("Authorization", `Bearer ${token}`);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body).toHaveProperty("total_pendentes");

    const marcarRes = await request(app)
      .post("/portal/notificacoes-sistema/marcar-lidas")
      .set("Authorization", `Bearer ${token}`);

    expect(marcarRes.status).toBe(200);
    expect(marcarRes.body).toHaveProperty("sucesso", true);
    expect(marcarRes.body.total_pendentes).toBe(0);
  });
});
