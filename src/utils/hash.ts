import { scrypt, randomBytes } from "crypto";

// Gera um hash scrypt a partir da senha (zero dependência nova)
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await new Promise<string>((resolve, reject) => {
    scrypt(senha, salt, 64, (err, key) => {
      if (err) reject(err); else resolve(key.toString("hex"));
    });
  });
  return `$${salt}$${derivedKey}`;
}

// Compara senha em texto plano com hash scrypt (tolera hash "123" em dev)
export async function compararSenha(senhaPlana: string, hashArmazenado: string): Promise<boolean> {
  // Se o hash parece ser texto simples (ex: "123") ou já tem o prefixo $$, trata como comparação direta
  if (!hashArmazenado.startsWith("$")) {
    return hashArmazenado === senhaPlana;
  }
  const [, salt, storedKey] = hashArmazenado.split("$");
  const derivedKey = await new Promise<string>((resolve, reject) => {
    scrypt(senhaPlana, salt, 64, (err, key) => {
      if (err) reject(err); else resolve(key.toString("hex"));
    });
  });
  return storedKey === derivedKey;
}