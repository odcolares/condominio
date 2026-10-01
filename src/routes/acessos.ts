import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";
import { Acesso, TipoPessoa, SentidoAcesso } from "../types.js";

export const acessosRouter = Router();

function resolverNome(tipo: TipoPessoa, pessoaId: number): string {
  if (tipo === "morador") {
    const obj = db.moradores.find((m) => m.id === pessoaId);
    return obj ? obj.nome_completo : "";
  }
  if (tipo === "visitante") {
    const obj = db.visitantes.find((v) => v.id === pessoaId);
    return obj ? obj.nome : "";
  }
  return "";
}

acessosRouter.post("", authMiddleware, (req, res) => {
  const { tipo_pessoa, pessoa_id, sentido, placa_veiculo, vaga, observacao } = req.body;

  if (!tipo_pessoa || !pessoa_id || !sentido) {
    return res.status(422).json({ detail: "tipo_pessoa, pessoa_id e sentido são obrigatórios" });
  }

  const nome = resolverNome(tipo_pessoa, pessoa_id);
  if (!nome) {
    return res.status(404).json({ detail: "Pessoa não encontrada para o acesso" });
  }

  const acesso: Acesso = {
    id: db.getNextAcessoId(),
    tipo_pessoa,
    pessoa_id,
    nome,
    sentido,
    placa_veiculo: placa_veiculo ?? null,
    vaga: vaga ?? null,
    observacao: observacao ?? null,
    registrado_em: new Date().toISOString(),
  };

  db.acessos.push(acesso);

  // Atualiza presença do visitante se for o caso
  if (tipo_pessoa === "visitante") {
    const visitante = db.visitantes.find((v) => v.id === pessoa_id);
    if (visitante) {
      visitante.presente = sentido === "entrada";
    }
  }

  db.save();
  return res.status(201).json(acesso);
});

acessosRouter.get("", authMiddleware, (req, res) => {
  const tipoPessoa = req.query.tipo_pessoa as TipoPessoa | undefined;
  const sentido = req.query.sentido as SentidoAcesso | undefined;
  const inicioStr = req.query.inicio as string | undefined;
  const fimStr = req.query.fim as string | undefined;
  const skip = parseInt(req.query.skip as string, 10) || 0;
  const limit = parseInt(req.query.limit as string, 10) || 100;

  const inicio = inicioStr ? new Date(inicioStr) : null;
  const fim = fimStr ? new Date(fimStr) : null;

  let resultado = db.acessos.filter((a) => {
    if (tipoPessoa && a.tipo_pessoa !== tipoPessoa) return false;
    if (sentido && a.sentido !== sentido) return false;
    const reg = new Date(a.registrado_em);
    if (inicio && reg < inicio) return false;
    if (fim && reg > fim) return false;
    return true;
  });

  resultado.sort((a, b) => new Date(b.registrado_em).getTime() - new Date(a.registrado_em).getTime());
  resultado = resultado.slice(skip, skip + limit);

  return res.json(resultado);
});
