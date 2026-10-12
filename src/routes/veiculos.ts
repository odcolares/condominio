import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware, requirePerfil } from "../auth.js";
import { Veiculo } from "../types.js";

export const veiculosRouter = Router();
veiculosRouter.use(authMiddleware, requirePerfil("administrador", "portaria"));

// GET /veiculos/stats
veiculosRouter.get("/stats", (_req, res) => {
  const total = db.veiculos.length;
  const com_morador = db.veiculos.filter((v) => v.morador_id !== null).length;
  const vagas_ocupadas = new Set(
    db.veiculos.filter((v) => v.vaga && v.vaga.trim() !== "").map((v) => v.vaga)
  ).size;
  const visitantes_com_carro = db.visitantes.filter(
    (v) => v.placa_veiculo && v.placa_veiculo.trim() !== ""
  ).length;

  return res.json({
    total,
    com_morador,
    vagas_ocupadas,
    visitantes_com_carro,
  });
});

// GET /veiculos
veiculosRouter.get("", (req, res) => {
  const busca = typeof req.query.busca === "string" ? req.query.busca.toLowerCase().trim() : null;
  const placa = typeof req.query.placa === "string" ? req.query.placa.toLowerCase().trim() : null;
  const moradorId = req.query.morador_id ? parseInt(req.query.morador_id as string, 10) : null;
  const skip = parseInt(req.query.skip as string, 10) || 0;
  const limit = parseInt(req.query.limit as string, 10) || 100;

  let resultado = db.veiculos.map((v) => {
    const morador = v.morador_id ? db.moradores.find((m) => m.id === v.morador_id) : null;
    return {
      ...v,
      morador_nome: morador ? morador.nome_completo : null,
      morador_unidade: morador ? `Bloco ${morador.bloco || "0"} - Apto ${morador.apartamento || "0"}` : null,
      morador_telefone: morador ? morador.telefone : null,
    };
  });

  if (placa) {
    resultado = resultado.filter((v) => v.placa.toLowerCase().includes(placa));
  }

  if (moradorId !== null) {
    resultado = resultado.filter((v) => v.morador_id === moradorId);
  }

  if (busca) {
    resultado = resultado.filter((v) => {
      const matchPlaca = v.placa.toLowerCase().includes(busca);
      const matchModelo = v.modelo ? v.modelo.toLowerCase().includes(busca) : false;
      const matchCor = v.cor ? v.cor.toLowerCase().includes(busca) : false;
      const matchVaga = v.vaga ? v.vaga.toLowerCase().includes(busca) : false;
      const matchNome = v.morador_nome ? v.morador_nome.toLowerCase().includes(busca) : false;
      const matchUnidade = v.morador_unidade ? v.morador_unidade.toLowerCase().includes(busca) : false;
      return matchPlaca || matchModelo || matchCor || matchVaga || matchNome || matchUnidade;
    });
  }

  resultado.sort((a, b) => a.placa.localeCompare(b.placa));
  resultado = resultado.slice(skip, skip + limit);

  return res.json(resultado);
});

// GET /veiculos/:id
veiculosRouter.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const veiculo = db.veiculos.find((v) => v.id === id);
  if (!veiculo) {
    return res.status(404).json({ detail: "Veículo não encontrado" });
  }

  const morador = veiculo.morador_id ? db.moradores.find((m) => m.id === veiculo.morador_id) : null;
  return res.json({
    ...veiculo,
    morador_nome: morador ? morador.nome_completo : null,
    morador_unidade: morador ? `Bloco ${morador.bloco || "0"} - Apto ${morador.apartamento || "0"}` : null,
  });
});

// POST /veiculos
veiculosRouter.post("", (req, res) => {
  const { placa, modelo, cor, vaga, morador_id } = req.body;
  if (!placa || !placa.trim()) {
    return res.status(422).json({ detail: "Placa é obrigatória" });
  }

  const placaLimpa = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Checa se a placa já existe
  const existe = db.veiculos.some((v) => v.placa.toUpperCase().replace(/[^A-Z0-9]/g, "") === placaLimpa);
  if (existe) {
    return res.status(400).json({ detail: `Já existe um veículo cadastrado com a placa ${placa.trim().toUpperCase()}` });
  }

  const mId = morador_id ? parseInt(morador_id, 10) : null;
  if (mId && !db.moradores.some((m) => m.id === mId)) {
    return res.status(400).json({ detail: "Morador informado não existe" });
  }

  const veiculo: Veiculo = {
    id: db.getNextVeiculoId(),
    placa: placa.trim().toUpperCase(),
    modelo: modelo ? modelo.trim() : null,
    cor: cor ? cor.trim() : null,
    vaga: vaga ? vaga.trim().toUpperCase() : null,
    morador_id: mId,
    criado_em: new Date().toISOString(),
  };

  db.veiculos.push(veiculo);
  db.save();

  const morador = veiculo.morador_id ? db.moradores.find((m) => m.id === veiculo.morador_id) : null;
  return res.status(201).json({
    ...veiculo,
    morador_nome: morador ? morador.nome_completo : null,
    morador_unidade: morador ? `Bloco ${morador.bloco || "0"} - Apto ${morador.apartamento || "0"}` : null,
  });
});

// PUT /veiculos/:id
veiculosRouter.put("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const veiculo = db.veiculos.find((v) => v.id === id);
  if (!veiculo) {
    return res.status(404).json({ detail: "Veículo não encontrado" });
  }

  const { placa, modelo, cor, vaga, morador_id } = req.body;
  if (placa) {
    veiculo.placa = placa.trim().toUpperCase();
  }
  if (modelo !== undefined) {
    veiculo.modelo = modelo ? modelo.trim() : null;
  }
  if (cor !== undefined) {
    veiculo.cor = cor ? cor.trim() : null;
  }
  if (vaga !== undefined) {
    veiculo.vaga = vaga ? vaga.trim().toUpperCase() : null;
  }
  if (morador_id !== undefined) {
    veiculo.morador_id = morador_id ? parseInt(morador_id, 10) : null;
  }

  db.save();

  const morador = veiculo.morador_id ? db.moradores.find((m) => m.id === veiculo.morador_id) : null;
  return res.json({
    ...veiculo,
    morador_nome: morador ? morador.nome_completo : null,
    morador_unidade: morador ? `Bloco ${morador.bloco || "0"} - Apto ${morador.apartamento || "0"}` : null,
  });
});

// DELETE /veiculos/:id
veiculosRouter.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.veiculos.findIndex((v) => v.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Veículo não encontrado" });
  }

  db.veiculos.splice(idx, 1);
  db.save();
  return res.status(204).send();
});
