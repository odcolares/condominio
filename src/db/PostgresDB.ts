import { Pool } from "pg";
import { BaseDB } from "./base.js";

function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeRow(
  row: Record<string, any>,
  dateCols: string[],
  tsCols: string[]
): Record<string, any> {
  const out: Record<string, any> = { ...row };
  for (const c of dateCols) {
    const v = out[c];
    if (v instanceof Date) out[c] = toDateOnly(v);
  }
  for (const c of tsCols) {
    const v = out[c];
    if (v instanceof Date) out[c] = v.toISOString();
  }
  return out;
}

function encodeParam(v: any): any {
  if (v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return v;
}

type TableDef = {
  name: string;
  create: string;
  cols: string[];
  dateCols: string[];
  tsCols: string[];
};

const TABLES: TableDef[] = [
  {
    name: "usuarios",
    create: `
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        perfil VARCHAR(50) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        tenant_id VARCHAR(50),
        foto_url TEXT
      )
    `,
    cols: ["id","nome","email","senha_hash","perfil","ativo","criado_em","tenant_id","foto_url"],
    dateCols: [],
    tsCols: ["criado_em"],
  },
  {
    name: "moradores",
    create: `
      CREATE TABLE IF NOT EXISTS moradores (
        id SERIAL PRIMARY KEY,
        nome_completo VARCHAR(255) NOT NULL,
        cpf VARCHAR(20) NOT NULL,
        telefone VARCHAR(30),
        whatsapp VARCHAR(30),
        telegram VARCHAR(100),
        bloco VARCHAR(10),
        apartamento VARCHAR(10),
        vinculo VARCHAR(20) NOT NULL,
        foto_url TEXT,
        numero_vaga VARCHAR(20),
        ativo BOOLEAN DEFAULT true,
        criado_em DATE DEFAULT CURRENT_DATE,
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","nome_completo","cpf","telefone","whatsapp","telegram","bloco","apartamento","vinculo","foto_url","numero_vaga","ativo","criado_em","tenant_id"],
    dateCols: ["criado_em"],
    tsCols: [],
  },
  {
    name: "veiculos",
    create: `
      CREATE TABLE IF NOT EXISTS veiculos (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(20) NOT NULL,
        modelo VARCHAR(100),
        cor VARCHAR(50),
        vaga VARCHAR(20),
        morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
        tipo_vinculo VARCHAR(20) NOT NULL,
        titulo VARCHAR(255),
        criado_em DATE DEFAULT CURRENT_DATE,
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","placa","modelo","cor","vaga","morador_id","tipo_vinculo","titulo","criado_em","tenant_id"],
    dateCols: ["criado_em"],
    tsCols: [],
  },
  {
    name: "visitantes",
    create: `
      CREATE TABLE IF NOT EXISTS visitantes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        documento VARCHAR(30),
        tipo_documento VARCHAR(20),
        telefone VARCHAR(30),
        foto_url TEXT,
        placa_veiculo VARCHAR(20),
        vaga VARCHAR(20),
        bloco VARCHAR(10),
        apartamento VARCHAR(10),
        morador_visitado_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
        agendado_para DATE,
        presente BOOLEAN DEFAULT false,
        criado_em DATE DEFAULT CURRENT_DATE,
        nome_visitante VARCHAR(255) NOT NULL,
        documento_visitante VARCHAR(30),
        data_prevista DATE,
        observacao TEXT,
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","nome","documento","tipo_documento","telefone","foto_url","placa_veiculo","vaga","bloco","apartamento","morador_visitado_id","agendado_para","presente","criado_em","nome_visitante","documento_visitante","data_prevista","observacao","tenant_id"],
    dateCols: ["agendado_para","criado_em","data_prevista"],
    tsCols: [],
  },
  {
    name: "acessos",
    create: `
      CREATE TABLE IF NOT EXISTS acessos (
        id SERIAL PRIMARY KEY,
        tipo_pessoa VARCHAR(20) NOT NULL,
        pessoa_id INTEGER NOT NULL,
        nome VARCHAR(255) NOT NULL,
        sentido VARCHAR(10) NOT NULL,
        placa_veiculo VARCHAR(20),
        vaga VARCHAR(20),
        observacao TEXT,
        registrado_em TIMESTAMPTZ DEFAULT NOW(),
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","tipo_pessoa","pessoa_id","nome","sentido","placa_veiculo","vaga","observacao","registrado_em","tenant_id"],
    dateCols: [],
    tsCols: ["registrado_em"],
  },
  {
    name: "encomendas",
    create: `
      CREATE TABLE IF NOT EXISTS encomendas (
        id SERIAL PRIMARY KEY,
        morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
        morador_nome VARCHAR(255) NOT NULL,
        morador_unidade VARCHAR(50),
        morador_telefone VARCHAR(30),
        morador_whatsapp VARCHAR(30),
        morador_telegram VARCHAR(100),
        codigo_rastreio VARCHAR(100),
        transportadora VARCHAR(100),
        tipo_volume VARCHAR(50),
        local_armazenamento VARCHAR(100),
        observacoes TEXT,
        codigo_retirada VARCHAR(20),
        status VARCHAR(20) NOT NULL,
        recebido_em TIMESTAMPTZ,
        recebido_por VARCHAR(255),
        retirado_em TIMESTAMPTZ,
        retirado_por VARCHAR(255),
        notificacao_enviada_whatsapp BOOLEAN DEFAULT false,
        notificacao_enviada_telegram BOOLEAN DEFAULT false,
        mensagem_aviso TEXT,
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","morador_id","morador_nome","morador_unidade","morador_telefone","morador_whatsapp","morador_telegram","codigo_rastreio","transportadora","tipo_volume","local_armazenamento","observacoes","codigo_retirada","status","recebido_em","recebido_por","retirado_em","retirado_por","notificacao_enviada_whatsapp","notificacao_enviada_telegram","mensagem_aviso","tenant_id"],
    dateCols: [],
    tsCols: ["recebido_em","retirado_em"],
  },
  {
    name: "prestadores",
    create: `
      CREATE TABLE IF NOT EXISTS prestadores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        documento VARCHAR(30) NOT NULL,
        tipo_documento VARCHAR(20) NOT NULL,
        empresa VARCHAR(255),
        funcao VARCHAR(255) NOT NULL,
        telefone VARCHAR(30),
        foto_url TEXT,
        placa_veiculo VARCHAR(20),
        cracha_numero VARCHAR(50),
        tipo_vinculo VARCHAR(20) NOT NULL,
        bloco VARCHAR(10),
        apartamento VARCHAR(10),
        morador_autorizador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
        morador_autorizador_nome VARCHAR(255),
        data_inicio DATE NOT NULL,
        data_fim DATE,
        horario_permitido VARCHAR(100),
        observacao TEXT,
        presente BOOLEAN DEFAULT false,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","nome","documento","tipo_documento","empresa","funcao","telefone","foto_url","placa_veiculo","cracha_numero","tipo_vinculo","bloco","apartamento","morador_autorizador_id","morador_autorizador_nome","data_inicio","data_fim","horario_permitido","observacao","presente","ativo","criado_em","tenant_id"],
    dateCols: ["data_inicio","data_fim"],
    tsCols: ["criado_em"],
  },
  {
    name: "ocorrencias",
    create: `
      CREATE TABLE IF NOT EXISTS ocorrencias (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        gravidade VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        bloco VARCHAR(10),
        apartamento VARCHAR(10),
        morador_envolvido VARCHAR(255),
        descricao TEXT NOT NULL,
        acao_tomada TEXT,
        registrado_por VARCHAR(255) NOT NULL,
        data_hora TIMESTAMPTZ DEFAULT NOW(),
        resolvido_em TIMESTAMPTZ,
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","titulo","categoria","gravidade","status","bloco","apartamento","morador_envolvido","descricao","acao_tomada","registrado_por","data_hora","resolvido_em","tenant_id"],
    dateCols: [],
    tsCols: ["data_hora","resolvido_em"],
  },
  {
    name: "restricoes_acesso",
    create: `
      CREATE TABLE IF NOT EXISTS restricoes_acesso (
        id SERIAL PRIMARY KEY,
        tipo_identificador VARCHAR(20) NOT NULL,
        valor_identificador VARCHAR(100) NOT NULL,
        nome_pessoa VARCHAR(255),
        motivo TEXT NOT NULL,
        instrucao_portaria TEXT NOT NULL,
        bloqueio_total BOOLEAN DEFAULT true,
        ativo BOOLEAN DEFAULT true,
        criado_por VARCHAR(255),
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","tipo_identificador","valor_identificador","nome_pessoa","motivo","instrucao_portaria","bloqueio_total","ativo","criado_por","criado_em","tenant_id"],
    dateCols: [],
    tsCols: ["criado_em"],
  },
  {
    name: "reservas",
    create: `
      CREATE TABLE IF NOT EXISTS reservas (
        id SERIAL PRIMARY KEY,
        espaco VARCHAR(50) NOT NULL,
        espaco_nome VARCHAR(255) NOT NULL,
        data_reserva DATE NOT NULL,
        periodo VARCHAR(20) NOT NULL,
        morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
        morador_nome VARCHAR(255) NOT NULL,
        bloco VARCHAR(10),
        apartamento VARCHAR(10),
        status VARCHAR(20) NOT NULL,
        convidados_estimados INTEGER,
        observacoes TEXT,
        solicitado_em TIMESTAMPTZ DEFAULT NOW(),
        aprovado_em TIMESTAMPTZ,
        aprovado_por VARCHAR(255),
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","espaco","espaco_nome","data_reserva","periodo","morador_id","morador_nome","bloco","apartamento","status","convidados_estimados","observacoes","solicitado_em","aprovado_em","aprovado_por","tenant_id"],
    dateCols: ["data_reserva"],
    tsCols: ["solicitado_em","aprovado_em"],
  },
  {
    name: "comunicados",
    create: `
      CREATE TABLE IF NOT EXISTS comunicados (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        conteudo TEXT NOT NULL,
        importante BOOLEAN DEFAULT false,
        publicado_por VARCHAR(255) NOT NULL,
        data_publicacao TIMESTAMPTZ DEFAULT NOW(),
        ativo BOOLEAN DEFAULT true,
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","titulo","categoria","conteudo","importante","publicado_por","data_publicacao","ativo","tenant_id"],
    dateCols: [],
    tsCols: ["data_publicacao"],
  },
  {
    name: "notificacoes_morador",
    create: `
      CREATE TABLE IF NOT EXISTS notificacoes_morador (
        id SERIAL PRIMARY KEY,
        morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        canal VARCHAR(20) NOT NULL,
        enviado_em TIMESTAMPTZ DEFAULT NOW(),
        lida BOOLEAN DEFAULT false,
        dados_adicionais JSONB,
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","morador_id","tipo","titulo","mensagem","canal","enviado_em","lida","dados_adicionais","tenant_id"],
    dateCols: [],
    tsCols: ["enviado_em"],
  },
  {
    name: "preautorizacoes_visitante",
    create: `
      CREATE TABLE IF NOT EXISTS preautorizacoes_visitante (
        id SERIAL PRIMARY KEY,
        morador_id INTEGER REFERENCES moradores(id) ON DELETE SET NULL,
        morador_nome VARCHAR(255) NOT NULL,
        bloco VARCHAR(10),
        apartamento VARCHAR(10),
        nome_visitante VARCHAR(255) NOT NULL,
        documento_visitante VARCHAR(30),
        placa_veiculo VARCHAR(20),
        data_prevista DATE NOT NULL,
        observacao TEXT,
        codigo_acesso_qr VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","morador_id","morador_nome","bloco","apartamento","nome_visitante","documento_visitante","placa_veiculo","data_prevista","observacao","codigo_acesso_qr","status","criado_em","tenant_id"],
    dateCols: ["data_prevista"],
    tsCols: ["criado_em"],
  },
  {
    name: "leads",
    create: `
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(30),
        condominio_nome VARCHAR(255),
        numero_unidades INTEGER,
        sistema_atual VARCHAR(255),
        status VARCHAR(20) NOT NULL,
        origem VARCHAR(100),
        observacao TEXT,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ DEFAULT NOW(),
        tenant_id VARCHAR(50)
      )
    `,
    cols: ["id","nome","email","telefone","condominio_nome","numero_unidades","sistema_atual","status","origem","observacao","criado_em","atualizado_em","tenant_id"],
    dateCols: [],
    tsCols: ["criado_em","atualizado_em"],
  },
];

const INDEXES: string[] = [
  "CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);",
  "CREATE INDEX IF NOT EXISTS idx_moradores_cpf ON moradores(cpf);",
  "CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);",
  "CREATE INDEX IF NOT EXISTS idx_visitantes_morador ON visitantes(morador_visitado_id);",
  "CREATE INDEX IF NOT EXISTS idx_acessos_registrado ON acessos(registrado_em);",
  "CREATE INDEX IF NOT EXISTS idx_encomendas_morador ON encomendas(morador_id);",
  "CREATE INDEX IF NOT EXISTS idx_encomendas_codigo ON encomendas(codigo_retirada);",
  "CREATE INDEX IF NOT EXISTS idx_prestadores_morador ON prestadores(morador_autorizador_id);",
  "CREATE INDEX IF NOT EXISTS idx_reservas_data ON reservas(data_reserva);",
  "CREATE INDEX IF NOT EXISTS idx_notificacoes_morador ON notificacoes_morador(morador_id);",
];

export class PostgresDB extends BaseDB {
  private pool: Pool;
  private connected = false;

  constructor() {
    super();
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.connect().catch((err) => {
      console.warn("PostgresDB: conexão inicial falhou:", err.message);
    });
  }

  async connect() {
    await this.ensureTables();
    await this.loadAll();
    this.connected = true;
    if (this.usuarios.length === 0) {
      this.initializeFresh();
      await this.flush();
    }
  }

  async ensureTables() {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (const t of TABLES) {
        await client.query(t.create);
      }
      for (const idx of INDEXES) {
        await client.query(idx);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async loadAll() {
    const self = this as any;
    for (const t of TABLES) {
      const { rows } = await this.pool.query(`SELECT * FROM ${t.name}`);
      const arr: any[] = [];
      for (const row of rows) {
        arr.push(normalizeRow(row, t.dateCols, t.tsCols));
      }
      self[t.name] = arr;
    }
    this.rebaseIds();
  }

  save(): void {
    this.flush().catch((err) => {
      console.error("Erro ao persistir no Postgres:", err);
    });
  }

  private async flush() {
    const self = this as any;
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (const t of TABLES) {
        await client.query(`TRUNCATE TABLE ${t.name} RESTART IDENTITY CASCADE`);
      }
      const order = TABLES.map((t) => t.name);
      for (const name of order) {
        const t = TABLES.find((x) => x.name === name)!;
        const rows: any[] = self[name];
        for (const row of rows) {
          const values = t.cols.map((c) => encodeParam(row[c]));
          const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
          await client.query(
            `INSERT INTO ${t.name} (${t.cols.join(", ")}) VALUES (${placeholders})`,
            values
          );
        }
        const maxId = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
        await client.query(`SELECT setval('${t.name}_id_seq', $1, true)`, [maxId || 1]);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  __resetDb() {
    super.__resetDb();
    this.save();
  }
}
