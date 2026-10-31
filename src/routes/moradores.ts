import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware, requirePerfil } from "../auth.js";
import { Morador } from "../types.js";

export const moradoresRouter = Router();
moradoresRouter.use(authMiddleware, requirePerfil("administrador", "portaria"));

moradoresRouter.get("", (req, res) => {
  const busca = typeof req.query.busca === "string" ? req.query.busca.toLowerCase() : null;
  const bloco = typeof req.query.bloco === "string" ? req.query.bloco : null;
  const vinculo = typeof req.query.vinculo === "string" ? req.query.vinculo : null;
  const skip = parseInt(req.query.skip as string, 10) || 0;
  const limit = parseInt(req.query.limit as string, 10) || 50;

  let resultado = db.moradores.filter((m) => {
    if (busca) {
      const matchNome = m.nome_completo.toLowerCase().includes(busca);
      const matchCpf = m.cpf.toLowerCase().includes(busca);
      const matchBloco = m.bloco ? m.bloco.toLowerCase().includes(busca) : false;
      if (!matchNome && !matchCpf && !matchBloco) return false;
    }
    if (bloco && m.bloco !== bloco) return false;
    if (vinculo && m.vinculo !== vinculo) return false;
    return true;
  });

  resultado.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
  resultado = resultado.slice(skip, skip + limit);

  return res.json(resultado);
});

moradoresRouter.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const morador = db.moradores.find((m) => m.id === id);
  if (!morador) {
    return res.status(404).json({ detail: "Morador não encontrado" });
  }
  return res.json(morador);
});

moradoresRouter.post("", (req, res) => {
  const { nome_completo, cpf, telefone, whatsapp, telegram, bloco, apartamento, vinculo, foto_url, numero_vaga, ativo } = req.body;

  if (!nome_completo || !cpf) {
    return res.status(422).json({ detail: "Nome completo e CPF são obrigatórios" });
  }

  const hasContato = (whatsapp && String(whatsapp).trim()) || (telegram && String(telegram).trim()) || (telefone && String(telefone).trim());
  if (!hasContato) {
    return res.status(422).json({ detail: "É obrigatório informar WhatsApp, Telegram ou telefone de contato do morador" });
  }

  if (!bloco || !bloco.trim()) {
    return res.status(422).json({ detail: "Bloco é obrigatório" });
  }

  if (!apartamento || !apartamento.trim()) {
    return res.status(422).json({ detail: "Apartamento é obrigatório" });
  }

  const existing = db.moradores.find((m) => m.cpf.trim() === String(cpf).trim());
  if (existing) {
    return res.status(409).json({ detail: "Já existe morador com esse CPF" });
  }

  const novoMorador: Morador = {
    id: db.getNextMoradorId(),
    nome_completo,
    cpf,
    telefone: telefone ?? null,
    whatsapp: whatsapp ?? null,
    telegram: telegram ?? null,
    bloco: bloco,
    apartamento: apartamento,
    vinculo: vinculo ?? "proprietario",
    foto_url: foto_url ?? null,
    numero_vaga: numero_vaga ?? null,
    ativo: ativo !== undefined ? !!ativo : true,
    criado_em: new Date().toISOString(),
  };

  db.moradores.push(novoMorador);

  // If a vehicle was also provided during registration
  if (req.body.placa_veiculo) {
    db.veiculos.push({
      id: db.getNextVeiculoId(),
      placa: req.body.placa_veiculo,
      modelo: req.body.modelo_veiculo || null,
      cor: req.body.cor_veiculo || null,
      vaga: numero_vaga || null,
      morador_id: novoMorador.id,
      tipo_vinculo: "proprietario",
      titulo: novoMorador.nome_completo,
      criado_em: new Date().toISOString(),
    });
  }

  db.save();
  return res.status(201).json(novoMorador);
});

moradoresRouter.put("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const morador = db.moradores.find((m) => m.id === id);
  if (!morador) {
    return res.status(404).json({ detail: "Morador não encontrado" });
  }

  const { nome_completo, cpf, telefone, whatsapp, telegram, bloco, apartamento, vinculo, foto_url, numero_vaga, ativo } = req.body;

  const campos = ["nome_completo", "telefone", "whatsapp", "telegram", "bloco", "apartamento", "vinculo", "foto_url", "numero_vaga", "ativo"] as const;
  for (const campo of campos) {
    if (req.body[campo] !== undefined) {
      (morador as any)[campo] = req.body[campo];
    }
  }

  const hasContato = (morador.whatsapp && morador.whatsapp.trim()) || (morador.telegram && morador.telegram.trim()) || (morador.telefone && morador.telefone.trim());
  if (!hasContato) {
    return res.status(422).json({ detail: "É obrigatório informar WhatsApp, Telegram ou telefone de contato do morador" });
  }

  if (!morador.bloco || !String(morador.bloco).trim()) {
    return res.status(422).json({ detail: "Bloco é obrigatório" });
  }

  if (!morador.apartamento || !String(morador.apartamento).trim()) {
    return res.status(422).json({ detail: "Apartamento é obrigatório" });
  }

  db.save();
  return res.json(morador);
});

moradoresRouter.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.moradores.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Morador não encontrado" });
  }

  db.moradores.splice(idx, 1);
  // Remove linked veiculos
  db.veiculos = db.veiculos.filter((v) => v.morador_id !== id);

  db.save();
  return res.status(204).send();
});
