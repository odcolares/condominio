import "dotenv/config";
import { Pool } from "pg";
import { readFileSync } from "fs";

const ORDER: string[] = [
  "usuarios",
  "moradores",
  "veiculos",
  "visitantes",
  "acessos",
  "encomendas",
  "prestadores",
  "ocorrencias",
  "restricoes",
  "reservas",
  "comunicados",
  "notificacoes",
  "preautorizacoes",
  "leads",
];

const TABLE_TO_COLLECTION: Record<string, string> = {
  usuarios: "usuarios",
  moradores: "moradores",
  veiculos: "veiculos",
  visitantes: "visitantes",
  acessos: "acessos",
  encomendas: "encomendas",
  prestadores: "prestadores",
  ocorrencias: "ocorrencias",
  restricoes_acesso: "restricoes",
  reservas: "reservas",
  comunicados: "comunicados",
  notificacoes_morador: "notificacoes",
  preautorizacoes_visitante: "preautorizacoes",
  leads: "leads",
};

const COLLECTION_TO_TABLE: Record<string, string> = {
  usuarios: "usuarios",
  moradores: "moradores",
  veiculos: "veiculos",
  visitantes: "visitantes",
  acessos: "acessos",
  encomendas: "encomendas",
  prestadores: "prestadores",
  ocorrencias: "ocorrencias",
  restricoes: "restricoes_acesso",
  reservas: "reservas",
  comunicados: "comunicados",
  notificacoes: "notificacoes_morador",
  preautorizacoes: "preautorizacoes_visitante",
  leads: "leads",
};

function encodeParam(v: any): any {
  if (v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return v;
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL não definida no .env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  const raw = readFileSync("data/database.json", "utf-8");
  const data: Record<string, any[]> = JSON.parse(raw);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const collection of ORDER) {
      const table = COLLECTION_TO_TABLE[collection];
      const rows: any[] = data[collection] || [];

      await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

      if (rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      for (const row of rows) {
        const values = keys.map((k) => encodeParam(row[k]));
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        await client.query(
          `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
          values
        );
      }

      const maxId = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
      if (maxId > 0) {
        await client.query(
          `SELECT setval('${table}_id_seq', $1, true)`,
          [maxId]
        );
      }

      console.log(`${table}: ${rows.length} rows inseridos`);
    }

    await client.query("COMMIT");
    console.log("Migração concluída com sucesso.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro na migração:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
