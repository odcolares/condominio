import { Router, Response } from "express";
import { db } from "../db.js";
import { createToken, authMiddleware, AuthenticatedRequest } from "../auth.js";
import { Usuario } from "../types.js";

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

authRouter.put("/me", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ detail: "Não autenticado" });
  }
  const { nome, email, senha } = req.body;
  const usuario = db.usuarios.find((u) => u.id === req.user!.id);
  if (!usuario) {
    return res.status(404).json({ detail: "Usuário não encontrado" });
  }

  if (email && email.trim() !== usuario.email) {
    const emailTrim = email.trim();
    const existe = db.usuarios.find((u) => u.email === emailTrim && u.id !== usuario.id);
    if (existe) {
      return res.status(422).json({ detail: "E-mail já está em uso por outro usuário" });
    }
    usuario.email = emailTrim;
  }

  if (nome !== undefined && nome.trim() !== "") {
    usuario.nome = nome.trim();
  }

  if (senha !== undefined && String(senha).trim() !== "") {
    usuario.senha_hash = String(senha).trim();
  }

  db.save();

  const newToken = createToken(usuario.email);
  const { senha_hash, ...safeUser } = usuario;
  return res.json({
    access_token: newToken,
    token_type: "bearer",
    usuario: safeUser,
  });
});

function adminMiddleware(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || req.user.perfil !== "administrador") {
    return res.status(403).json({ detail: "Acesso restrito a administradores" });
  }
  next();
}

authRouter.get("/usuarios", authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const lista = db.usuarios.map(({ senha_hash, ...u }) => u);
  return res.json(lista);
});

authRouter.post("/usuarios", authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { nome, email, senha, perfil, ativo } = req.body;
  if (!nome || !email || !senha || !perfil) {
    return res.status(422).json({ detail: "Preencha todos os campos obrigatórios (nome, email, senha, perfil)" });
  }

  const emailTrim = email.trim().toLowerCase();
  const existe = db.usuarios.find((u) => u.email === emailTrim);
  if (existe) {
    return res.status(422).json({ detail: "Já existe um usuário com este e-mail" });
  }

  const novoUsuario: Usuario = {
    id: db.getNextUserId(),
    nome: nome.trim(),
    email: emailTrim,
    senha_hash: String(senha).trim(),
    perfil: perfil as "administrador" | "morador" | "portaria",
    ativo: ativo !== undefined ? Boolean(ativo) : true,
    criado_em: new Date().toISOString(),
  };

  db.usuarios.push(novoUsuario);
  db.save();

  const { senha_hash, ...safe } = novoUsuario;
  return res.status(201).json(safe);
});

authRouter.put("/usuarios/:id", authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const usuario = db.usuarios.find((u) => u.id === id);
  if (!usuario) {
    return res.status(404).json({ detail: "Usuário não encontrado" });
  }

  const { nome, email, senha, perfil, ativo } = req.body;

  if (email && email.trim().toLowerCase() !== usuario.email) {
    const emailTrim = email.trim().toLowerCase();
    const existe = db.usuarios.find((u) => u.email === emailTrim && u.id !== id);
    if (existe) {
      return res.status(422).json({ detail: "E-mail já está em uso por outro usuário" });
    }
    usuario.email = emailTrim;
  }

  if (nome !== undefined && nome.trim() !== "") {
    usuario.nome = nome.trim();
  }

  if (senha !== undefined && String(senha).trim() !== "") {
    usuario.senha_hash = String(senha).trim();
  }

  if (perfil !== undefined) {
    usuario.perfil = perfil;
  }

  if (ativo !== undefined) {
    usuario.ativo = Boolean(ativo);
  }

  db.save();

  const { senha_hash, ...safe } = usuario;
  return res.json(safe);
});

authRouter.delete("/usuarios/:id", authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (req.user!.id === id) {
    return res.status(400).json({ detail: "Você não pode excluir sua própria conta logada" });
  }

  const index = db.usuarios.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ detail: "Usuário não encontrado" });
  }

  db.usuarios.splice(index, 1);
  db.save();

  return res.json({ detail: "Usuário excluído com sucesso" });
});
