import { Router, Response } from "express";
import { db } from "../db.js";
import { createToken, authMiddleware, AuthenticatedRequest } from "../auth.js";
import { Usuario } from "../types.js";
import { hashSenha, compararSenha } from "../utils/hash.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(401).json({ detail: "E-mail ou senha inválidos" });
  }

  const usuario = db.usuarios.find((u) => u.email === email);
  if (!usuario) {
    return res.status(401).json({ detail: "E-mail ou senha inválidos" });
  }

  const senhasIguais = await compararSenha(senha, usuario.senha_hash);
  if (!senhasIguais) {
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

authRouter.put("/me/foto", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ detail: "Não autenticado" });
  }
  const { foto_url } = req.body;
  if (foto_url === undefined) {
    return res.status(422).json({ detail: "Campo foto_url é obrigatório" });
  }
  req.user.foto_url = foto_url === "" ? null : foto_url;
  const originalUser = db.usuarios.find((u) => u.id === req.user!.id);
  if (originalUser) {
    originalUser.foto_url = req.user.foto_url;
  }
  await db.save();
  const { senha_hash, ...safeUser } = req.user;
  return res.json(safeUser);
});

authRouter.put("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ detail: "Não autenticado" });
  }
  const { nome, email, senha, foto_url } = req.body;
  const usuario = db.usuarios.find((u) => u.id === req.user!.id);
  if (!usuario) {
    return res.status(404).json({ detail: "Usuário não encontrado" });
  }

  if (email && email.trim() !== usuario.email) {
    const emailTrim = email.trim();
    const existe = db.usuarios.find((u) => u.email === emailTrim && u.id !== usuario.id);
    if (existe) {
      return res.status(422).json({ detail: "E-mail já em uso por outro usuário" });
    }
    usuario.email = emailTrim;
  }

  if (nome !== undefined && nome.trim() !== "") {
    usuario.nome = nome.trim();
  }

  if (senha !== undefined && String(senha).trim() !== "") {
    usuario.senha_hash = await hashSenha(String(senha).trim());
  }

  if (foto_url !== undefined) {
    usuario.foto_url = foto_url === "" ? null : foto_url;
  }

  await db.save();

  const newToken = createToken(usuario.email);
  const { senha_hash, ...safeUser } = usuario;
  return res.json({
    access_token: newToken,
    token_type: "bearer",
    usuario: safeUser,
  });
});

function adminMiddleware(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || (req.user.perfil !== "administrador" && req.user.perfil !== "admin")) {
    return res.status(403).json({ detail: "Acesso restrito a administradores" });
  }
  next();
}

authRouter.get("/usuarios", authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const lista = db.usuarios.map(({ senha_hash, ...u }) => u);
  return res.json(lista);
});

authRouter.post("/usuarios", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { nome, email, senha, perfil, ativo } = req.body;
  if (!nome || !email || !senha || !perfil) {
    return res.status(422).json({ detail: "Preencha todos os campos obrigatórios (nome, email, senha, perfil)" });
  }

  const emailTrim = email.trim().toLowerCase();
  const existe = db.usuarios.find((u) => u.email === emailTrim);
  if (existe) {
    return res.status(422).json({ detail: "Já existe um usuário com este e-mail" });
  }

  const senha_hash = await hashSenha(String(senha).trim());

  const novoUsuario: Usuario = {
    id: db.getNextUserId(),
    nome: nome.trim(),
    email: emailTrim,
    senha_hash,
    perfil: perfil as "administrador" | "morador" | "portaria",
    ativo: ativo !== undefined ? Boolean(ativo) : true,
    criado_em: new Date().toISOString(),
    foto_url: null,
  };

  db.usuarios.push(novoUsuario);
  await db.save();

  const { senha_hash: _hash, ...safe } = novoUsuario;
  return res.status(201).json(safe);
});

authRouter.put("/usuarios/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(422).json({ detail: "E-mail já em uso por outro usuário" });
    }
    usuario.email = emailTrim;
  }

  if (nome !== undefined && nome.trim() !== "") {
    usuario.nome = nome.trim();
  }

  if (senha !== undefined && String(senha).trim() !== "") {
    usuario.senha_hash = await hashSenha(String(senha).trim());
  }

  if (perfil !== undefined) {
    usuario.perfil = perfil;
  }

  if (ativo !== undefined) {
    usuario.ativo = Boolean(ativo);
  }

  await db.save();

  const { senha_hash, ...safe } = usuario;
  return res.json(safe);
});

authRouter.delete("/usuarios/:id", authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (req.user!.id === id) {
    return res.status(400).json({ detail: "Você não pode excluir sua própria conta logada" });
  }

  const index = db.usuarios.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ detail: "Usuário não encontrado" });
  }

  db.usuarios.splice(index, 1);
  await db.save();

  return res.json({ detail: "Usuário excluído com sucesso" });
});