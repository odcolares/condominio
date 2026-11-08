import { IDatabase } from "./interface.ts";
import { InMemoryDB } from "./InMemoryDB.ts";
import { PostgresDB } from "./PostgresDB.ts";

export function createDatabase(): IDatabase {
  const type = (process.env.DB_TYPE || "json").toLowerCase();
  if (type === "postgres" || type === "pg") {
    return new PostgresDB();
  }
  return new InMemoryDB();
}

export const db = createDatabase();
export function __resetDb() {
  db.__resetDb();
}

export type { IDatabase };
export { InMemoryDB, PostgresDB };
