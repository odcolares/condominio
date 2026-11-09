import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";

const RENDER_URL = "https://condominio-7mm1.onrender.com";

let adminToken: string;
let createdLeadId: number;

beforeAll(async () => {
  // Login como admin para obter token
  const loginRes = await request(RENDER_URL)
    .post("/auth/login")
    .send({ email: "adm@adm.com", senha: "123" });

  expect(loginRes.status).toBe(200);
  adminToken = loginRes.body.access_token;
  expect(adminToken).toBeDefined();
});

describe("Leads CRUD - Persistência Real no Supabase (via Render)", () => {
  it("POST /leads - CREATE lead no banco real", async () => {
    const res = await request(RENDER_URL)
      .post("/leads")
      .send({
        nome: "Teste Persistência Supabase",
        email: "persistencia.supabase@teste.com",
        telefone: "(11) 91111-1111",
        condominio_nome: "Condomínio Persistência",
        numero_unidades: 30,
        sistema_atual: "Sistema Teste",
        origem: "teste-automatizado-supabase",
        observacao: "Validando persistência real no Supabase",
        consentimento_lgpd: true,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.nome).toBe("Teste Persistência Supabase");
    expect(res.body.email).toBe("persistencia.supabase@teste.com");
    expect(res.body.consentimento_lgpd).toBe(true);

    createdLeadId = res.body.id;
  });

  it("GET /leads - READ o lead criado (persistência)", async () => {
    const res = await request(RENDER_URL)
      .get("/leads")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ busca: "persistencia.supabase@teste.com" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].email).toBe("persistencia.supabase@teste.com");
    expect(res.body[0].nome).toBe("Teste Persistência Supabase");
  });

  it("PUT /leads/:id - UPDATE o lead no banco real", async () => {
    const res = await request(RENDER_URL)
      .put(`/leads/${createdLeadId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "contatado",
        observacao: "Lead validado por teste de persistência Supabase",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("contatado");
    expect(res.body.observacao).toBe(
      "Lead validado por teste de persistência Supabase"
    );
  });

  it("DELETE /leads/:id - DELETE o lead do banco real", async () => {
    const deleteRes = await request(RENDER_URL)
      .delete(`/leads/${createdLeadId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(204);

    // Confirmar que não existe mais
    const getRes = await request(RENDER_URL)
      .get("/leads")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ busca: "persistencia.supabase@teste.com" });

    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(0);
  });

  it("POST /leads - rejeita sem consentimento LGPD (validação server-side)", async () => {
    const res = await request(RENDER_URL)
      .post("/leads")
      .send({
        nome: "Sem LGPD",
        email: "sem.lgpd@teste.com",
        telefone: "(11) 92222-2222",
        consentimento_lgpd: false,
      });

    expect(res.status).toBe(422);
    expect(res.body.detail).toContain("Consentimento LGPD");
  });

  it("POST /leads - rejeita email inválido", async () => {
    const res = await request(RENDER_URL)
      .post("/leads")
      .send({
        nome: "Email Inválido",
        email: "nao-eh-email",
        telefone: "(11) 92222-2222",
        consentimento_lgpd: true,
      });

    expect(res.status).toBe(422);
    expect(res.body.detail).toContain("E-mail inválido");
  });
});

afterAll(async () => {
  // Limpeza: garantir que o lead de teste foi removido
  if (createdLeadId) {
    await request(RENDER_URL)
      .delete(`/leads/${createdLeadId}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }
});