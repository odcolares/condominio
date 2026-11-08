import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Testes NUNCA devem tocar o banco real: força InMemoryDB mesmo com
    // DB_TYPE=postgres no .env local (o dotenv não sobrescreve env existente)
    env: { DB_TYPE: "json" },
  },
});
