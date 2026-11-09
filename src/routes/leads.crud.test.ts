import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../server.js";
import { __resetDb } from "../db.js";

describe("Leads CRUD Integration Tests (Local - DB Type: json)", () => {
  beforeEach(() => {
    __resetDb();
  });

  let token: string;
  let leadId: number;

  beforeAll(async () => {
    // Obter token de admin para endpoints protegidos
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "adm@adm.com", senha: "123" });
    token = loginRes.body.access_token;
  });

  it("POST /leads - CREATE um novo lead", async () => {
    const res = await request(app)
      .post("/leads")
      .send({
        nome: "João Teste CRUD",
        email: "crud.teste@email.com",
        telefone: "(11) 99999-0000",
        condominio_nome: "Condomínio Teste",
        numero_unidades: 50,
        sistema_atual: "Planilha Excel",
        origem: "teste-automatizado",
        observacao: "Lead criado por teste automatizado",
        consentimento_lgpd: true,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.nome).toBe("João Teste CRUD");
    expect(res.body.email).toBe("crud.teste@email.com");
    expect(res.body.consentimento_lgpd).toBe(true);
    expect(res.body.mensagem).toContain("sucesso");

    leadId = res.body.id;
  });

  it("GET /leads - READ o lead criado", async () => {
    // Primeiro criar um lead para ler
    const createRes = await request(app)
      .post("/leads")
      .send({
        nome: "Maria Teste Leitura",
        email: "maria.leitura@email.com",
        telefone: "(11) 98888-0000",
        consentimento_lgpd: true,
      });
    const id = createRes.body.id;

    const res = await request(app)
      .get("/leads")
      .set("Authorization", `Bearer ${token}`)
      .query({ busca: "maria.leitura@email.com" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].email).toBe("maria.leitura@email.com");
    expect(res.body[0].nome).toBe("Maria Teste Leitura");
  });

  it("PUT /leads/:id - UPDATE o lead", async () => {
    // Criar lead para atualizar
    const createRes = await request(app)
      .post("/leads")
      .send({
        nome: "Pedro Teste Atualização",
        email: "pedro.atualizacao@email.com",
        telefone: "(11) 97777-0000",
        consentimento_lgpd: true,
      });
    const id = createRes.body.id;

    const res = await request(app)
      .put(`/leads/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "contatado", observacao: "Contato realizado com sucesso" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("contatado");
    expect(res.body.observacao).toBe("Contato realizado com sucesso");
  });

  it("DELETE /leads/:id - DELETE o lead", async () => {
    // Criar lead para deletar
    const createRes = await request(app)
      .post("/leads")
      .send({
        nome: "Ana Teste Deleção",
        email: "ana.delecao@email.com",
        telefone: "(11) 96666-0000",
        consentimento_lgpd: true,
      });
    const id = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/leads/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);

    // Verificar que não existe mais
    const getRes = await request(app)
      .get("/leads")
      .set("Authorization", `Bearer ${token}`)
      .query({ busca: "ana.delecao@email.com" });

    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(0);
  });

  it("POST /leads - rejeita sem consentimento LGPD", async () => {
    const res = await request(app)
      .post("/leads")
      .send({
        nome: "Sem Consentimento",
        email: "sem.consentimento@email.com",
        telefone: "(11) 95555-0000",
        // consentimento_lgpd omitido intencionalmente
      });

    expect(res.status).toBe(422);
    expect(res.body.detail).toContain("Consentimento LGPD");
  });

  it("POST /leads - rejeita email inválido", async () => {
    const res = await request(app)
      .post("/leads")
      .send({
        nome: "Email Inválido",
        email: "nao-eh-email",
        telefone: "(11) 94444-0000",
        consentimento_lgpd: true,
      });

    expect(res.status).toBe(422);
    expect(res.body.detail).toContain("E-mail inválido");
  });
});