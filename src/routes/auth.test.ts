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
});
