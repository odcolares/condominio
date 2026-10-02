import { Router } from "express";
import { db } from "../db.js";
import { authMiddleware } from "../auth.js";
import { Prestador, Acesso } from "../types.js";

export const prestadoresRouter = Router();

prestadoresRouter.get(["", "/"], authMiddleware, (req, res) => {
  const presentesOnly = req.query.presentes === "true";
  const busca = (req.query.busca as string | undefined)?.toLowerCase().trim();
  const bloco = req.query.bloco as string | undefined;
  const apartamento = req.query.apartamento as string | undefined;

  let resultado = db.prestadores.filter((p) => {
    if (presentesOnly && !p.presente) return false;
    if (bloco && p.bloco !== bloco) return false;
    if (apartamento && p.apartamento !== apartamento) return false;

    if (busca) {
      const matchNome = p.nome.toLowerCase().includes(busca);
      const matchDoc = p.documento.toLowerCase().includes(busca);
      const matchEmpresa = p.empresa?.toLowerCase().includes(busca);
      const matchFuncao = p.funcao.toLowerCase().includes(busca);
      const matchPlaca = p.placa_veiculo?.toLowerCase().includes(busca);
      const matchCracha = p.cracha_numero?.toLowerCase().includes(busca);
      if (!matchNome && !matchDoc && !matchEmpresa && !matchFuncao && !matchPlaca && !matchCracha) {
        return false;
      }
    }
    return true;
  });

  resultado.sort((a, b) => {
    // Presentes primeiro, depois por nome
    if (a.presente && !b.presente) return -1;
    if (!a.presente && b.presente) return 1;
    return a.nome.localeCompare(b.nome);
  });

  return res.json(resultado);
});

prestadoresRouter.get("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const p = db.prestadores.find((item) => item.id === id);
  if (!p) {
    return res.status(404).json({ detail: "Prestador não encontrado" });
  }
  return res.json(p);
});

prestadoresRouter.post(["", "/"], authMiddleware, (req, res) => {
  const {
    nome,
    documento,
    tipo_documento,
    empresa,
    funcao,
    telefone,
    foto_url,
    placa_veiculo,
    cracha_numero,
    tipo_vinculo,
    bloco,
    apartamento,
    morador_autorizador_id,
    data_inicio,
    data_fim,
    horario_permitido,
    observacao,
  } = req.body;

  if (!nome || !documento || !funcao || !data_inicio || !data_fim) {
    return res.status(422).json({
      detail: "Nome, documento, função, data de início e data final de autorização são obrigatórios",
    });
  }

  let moradorAutorizadorNome: string | null = null;
  if (morador_autorizador_id) {
    const m = db.moradores.find((item) => item.id === Number(morador_autorizador_id));
    if (m) {
      moradorAutorizadorNome = m.nome_completo;
    }
  }

  const novoPrestador: Prestador = {
    id: db.getNextPrestadorId(),
    nome: String(nome).trim(),
    documento: String(documento).trim(),
    tipo_documento: tipo_documento || "CPF",
    empresa: empresa ? String(empresa).trim() : null,
    funcao: String(funcao).trim(),
    telefone: telefone ? String(telefone).trim() : null,
    foto_url: foto_url ?? null,
    placa_veiculo: placa_veiculo ? String(placa_veiculo).trim().toUpperCase() : null,
    cracha_numero: cracha_numero ? String(cracha_numero).trim().toUpperCase() : null,
    tipo_vinculo: tipo_vinculo === "condominio" ? "condominio" : "unidade",
    bloco: bloco ? String(bloco).trim() : null,
    apartamento: apartamento ? String(apartamento).trim() : null,
    morador_autorizador_id: morador_autorizador_id ? Number(morador_autorizador_id) : null,
    morador_autorizador_nome: moradorAutorizadorNome,
    data_inicio: String(data_inicio).trim(),
    data_fim: String(data_fim).trim(),
    horario_permitido: horario_permitido ? String(horario_permitido).trim() : "08:00 às 17:00",
    observacao: observacao ? String(observacao).trim() : null,
    presente: false,
    ativo: true,
    criado_em: new Date().toISOString(),
  };

  db.prestadores.push(novoPrestador);
  db.save();
  return res.status(201).json(novoPrestador);
});

prestadoresRouter.put("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const p = db.prestadores.find((item) => item.id === id);
  if (!p) {
    return res.status(404).json({ detail: "Prestador não encontrado" });
  }

  const {
    nome,
    documento,
    tipo_documento,
    empresa,
    funcao,
    telefone,
    foto_url,
    placa_veiculo,
    cracha_numero,
    tipo_vinculo,
    bloco,
    apartamento,
    morador_autorizador_id,
    data_inicio,
    data_fim,
    horario_permitido,
    observacao,
    ativo,
  } = req.body;

  if (nome !== undefined) p.nome = String(nome).trim();
  if (documento !== undefined) p.documento = String(documento).trim();
  if (tipo_documento !== undefined) p.tipo_documento = tipo_documento;
  if (empresa !== undefined) p.empresa = empresa ? String(empresa).trim() : null;
  if (funcao !== undefined) p.funcao = String(funcao).trim();
  if (telefone !== undefined) p.telefone = telefone ? String(telefone).trim() : null;
  if (foto_url !== undefined) p.foto_url = foto_url;
  if (placa_veiculo !== undefined) p.placa_veiculo = placa_veiculo ? String(placa_veiculo).trim().toUpperCase() : null;
  if (cracha_numero !== undefined) p.cracha_numero = cracha_numero ? String(cracha_numero).trim().toUpperCase() : null;
  if (tipo_vinculo !== undefined) p.tipo_vinculo = tipo_vinculo;
  if (bloco !== undefined) p.bloco = bloco ? String(bloco).trim() : null;
  if (apartamento !== undefined) p.apartamento = apartamento ? String(apartamento).trim() : null;
  if (morador_autorizador_id !== undefined) {
    p.morador_autorizador_id = morador_autorizador_id ? Number(morador_autorizador_id) : null;
    const m = db.moradores.find((item) => item.id === p.morador_autorizador_id);
    p.morador_autorizador_nome = m ? m.nome_completo : null;
  }
  if (data_inicio !== undefined) p.data_inicio = String(data_inicio).trim();
  if (data_fim !== undefined) p.data_fim = String(data_fim).trim();
  if (horario_permitido !== undefined) p.horario_permitido = horario_permitido;
  if (observacao !== undefined) p.observacao = observacao;
  if (ativo !== undefined) p.ativo = Boolean(ativo);

  db.save();
  return res.json(p);
});

prestadoresRouter.delete("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = db.prestadores.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ detail: "Prestador não encontrado" });
  }

  db.prestadores.splice(idx, 1);
  db.save();
  return res.status(204).send();
});

// Registro de ENTRADA do prestador na portaria
prestadoresRouter.post("/:id/entrada", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const prestador = db.prestadores.find((p) => p.id === id);
  if (!prestador) {
    return res.status(404).json({ detail: "Prestador não encontrado" });
  }

  const { placa_veiculo, cracha_numero, observacao } = req.body;
  const placaUsada = placa_veiculo ? String(placa_veiculo).trim().toUpperCase() : prestador.placa_veiculo;
  const crachaUsado = cracha_numero ? String(cracha_numero).trim().toUpperCase() : prestador.cracha_numero;

  prestador.presente = true;
  if (crachaUsado) prestador.cracha_numero = crachaUsado;
  if (placaUsada) prestador.placa_veiculo = placaUsada;

  // Registrar acesso
  const localInfo = prestador.bloco || prestador.apartamento ? ` (Bl ${prestador.bloco || '—'} / ${prestador.apartamento || '—'})` : ' (Geral)';
  const acesso: Acesso = {
    id: db.getNextAcessoId(),
    tipo_pessoa: "prestador",
    pessoa_id: prestador.id,
    nome: prestador.nome,
    sentido: "entrada",
    placa_veiculo: placaUsada || null,
    vaga: null,
    observacao: observacao || `Entrada Prestador [${prestador.funcao} - ${prestador.empresa || 'Autônomo'}]${localInfo}${crachaUsado ? ' Crachá: ' + crachaUsado : ''}`,
    registrado_em: new Date().toISOString(),
  };

  db.acessos.push(acesso);
  db.save();

  return res.json({ prestador, acesso });
});

// Registro de SAÍDA do prestador na portaria
prestadoresRouter.post("/:id/saida", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const prestador = db.prestadores.find((p) => p.id === id);
  if (!prestador) {
    return res.status(404).json({ detail: "Prestador não encontrado" });
  }

  const { observacao } = req.body;
  prestador.presente = false;

  const acesso: Acesso = {
    id: db.getNextAcessoId(),
    tipo_pessoa: "prestador",
    pessoa_id: prestador.id,
    nome: prestador.nome,
    sentido: "saida",
    placa_veiculo: prestador.placa_veiculo || null,
    vaga: null,
    observacao: observacao || `Saída Prestador [${prestador.funcao}] - Crachá devolvido`,
    registrado_em: new Date().toISOString(),
  };

  db.acessos.push(acesso);
  db.save();

  return res.json({ prestador, acesso });
});
