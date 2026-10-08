import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import { Usuario } from "./types.js";

const SECRET_KEY = process.env.SECRET_KEY || "troque-esta-chave-em-producao";

export interface AuthenticatedRequest extends Request {
  user?: Usuario;
}

export function createToken(email: string): string {
  return jwt.sign({ sub: email }, SECRET_KEY, { expiresIn: "8h" });
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Credenciais inválidas" });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, SECRET_KEY) as { sub: string };
    const user = db.usuarios.find((u) => u.email === payload.sub && u.ativo);
    if (!user) {
      return res.status(401).json({ detail: "Credenciais inválidas" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ detail: "Credenciais inválidas" });
  }
}

export type Perfil = "administrador" | "morador" | "portaria" | "sindico";

export function requirePerfil(...perfis: Perfil[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ detail: "Credenciais inválidas" });
    }
    if (!perfis.includes(req.user.perfil as Perfil)) {
      return res.status(403).json({ detail: "Acesso restrito a perfis autorizados" });
    }
    next();
  };
}
