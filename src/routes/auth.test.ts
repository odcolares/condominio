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

  it("GET /auth/me - fails without token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
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

  it("PUT /auth/me/foto - atualizar foto de um usuário não altera foto de outros (não-regressão)", async () => {
    // Login como admin e atualiza sua foto
    const adminLogin = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });
    const adminToken = adminLogin.body.access_token;

    const fotoAdmin = "https://example.com/fotos/admin.jpg";
    const resAdmin = await request(app)
      .put("/auth/me/foto")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ foto_url: fotoAdmin });

    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.foto_url).toBe(fotoAdmin);

    // Login como morador e atualiza sua foto com uma URL diferente
    const moradorLogin = await request(app)
      .post("/auth/login")
      .send({ email: "carlos@ambros.com", senha: "123" });
    const moradorToken = moradorLogin.body.access_token;

    const fotoMorador = "https://example.com/fotos/carlos.jpg";
    const resMorador = await request(app)
      .put("/auth/me/foto")
      .set("Authorization", `Bearer ${moradorToken}`)
      .send({ foto_url: fotoMorador });

    expect(resMorador.status).toBe(200);
    expect(resMorador.body.foto_url).toBe(fotoMorador);

    // Verifica que o admin mantém sua foto original (não foi sobrescrita pelo morador)
    const adminMe = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminMe.status).toBe(200);
    expect(adminMe.body.foto_url).toBe(fotoAdmin);

    // Verifica que o porteiro mantém foto null (não foi afetado por nenhuma atualização)
    const portariaLogin = await request(app)
      .post("/auth/login")
      .send({ email: "portaria@ambros.com", senha: "123" });
    const portariaToken = portariaLogin.body.access_token;

    const portariaMe = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${portariaToken}`);
    expect(portariaMe.status).toBe(200);
    expect(portariaMe.body.foto_url).toBeNull();
  });
});
