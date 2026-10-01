import { Router, Response } from "express";
import { db } from "../db.js";
import { createToken, authMiddleware, AuthenticatedRequest } from "../auth.js";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(401).json({ detail: "E-mail ou senha inválidos" });
  }

  const usuario = db.usuarios.find((u) => u.email === email);
  if (!usuario || usuario.senha_hash !== senha) {
    return res.status(401).json({ detail: "E-mail ou senha inválidos" });
  }

  if (!usuario.ativo) {
    return res.status(403).json({ detail: "Usuário inativo" });
  }

  const token = createToken(usuario.email);
  return res.json({
    access_token: token,
    token_type: "bearer",
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    },
  });
});

authRouter.get("/me", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ detail: "Não autenticado" });
  }
  const { senha_hash, ...safeUser } = req.user;
  return res.json(safeUser);
});
