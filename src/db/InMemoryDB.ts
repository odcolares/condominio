import fs from "fs";
import path from "path";
import { BaseDB } from "./base.js";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

export class InMemoryDB extends BaseDB {
  constructor() {
    super();
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.usuarios) && parsed.usuarios.length > 0) {
          this.usuarios = parsed.usuarios || [];
          this.moradores = parsed.moradores || [];
          this.veiculos = parsed.veiculos || [];
          this.visitantes = parsed.visitantes || [];
          this.acessos = parsed.acessos || [];
          this.encomendas = parsed.encomendas || [];
          this.prestadores = parsed.prestadores || [];
          this.ocorrencias = parsed.ocorrencias || [];
          this.restricoes = parsed.restricoes || [];
          this.reservas = parsed.reservas || [];
          this.comunicados = parsed.comunicados || [];
          this.notificacoes = parsed.notificacoes || [];
          this.preautorizacoes = parsed.preautorizacoes || [];
          this.leads = parsed.leads || [];

          this.nextUserId = parsed.nextUserId || (this.usuarios.length + 1);
          this.nextMoradorId = parsed.nextMoradorId || (this.moradores.length + 1);
          this.nextVeiculoId = parsed.nextVeiculoId || (this.veiculos.length + 1);
          this.nextVisitanteId = parsed.nextVisitanteId || (this.visitantes.length + 1);
          this.nextAcessoId = parsed.nextAcessoId || (this.acessos.length + 1);
          this.nextEncomendaId = parsed.nextEncomendaId || (this.encomendas.length + 1);
          this.nextPrestadorId = parsed.nextPrestadorId || (this.prestadores.length + 1);
          this.nextOcorrenciaId = parsed.nextOcorrenciaId || (this.ocorrencias.length + 1);
          this.nextRestricaoId = parsed.nextRestricaoId || (this.restricoes.length + 1);
          this.nextReservaId = parsed.nextReservaId || (this.reservas.length + 1);
          this.nextComunicadoId = parsed.nextComunicadoId || (this.comunicados.length + 1);
          this.nextNotificacaoId = parsed.nextNotificacaoId || (this.notificacoes.length + 1);
          this.nextPreAutorizacaoId = parsed.nextPreAutorizacaoId || (this.preautorizacoes.length + 1);
          this.nextLeadId = parsed.nextLeadId || (this.leads.length + 1);

          if (this.prestadores.length === 0) this.seedPrestadores();
          if (this.ocorrencias.length === 0) this.seedOcorrencias();
          if (this.restricoes.length === 0) this.seedRestricoes();
          if (this.reservas.length === 0) this.seedReservas();
          if (this.comunicados.length === 0) this.seedComunicados();
          if (this.notificacoes.length === 0) this.seedNotificacoes();
          if (this.preautorizacoes.length === 0) this.seedPreAutorizacoes();
          if (this.leads.length === 0) this.seedLeads();
          this.ensureDemoUsers();
          this.seedMultiTenant();
          this.fixDemoMorador();
          return;
        }
      }
    } catch (err) {
      console.warn("Falha ao carregar banco do disco, inicializando com sementes:", err);
    }

    this.initializeFresh();
    this.save();
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        usuarios: this.usuarios,
        moradores: this.moradores,
        veiculos: this.veiculos,
        visitantes: this.visitantes,
        acessos: this.acessos,
        encomendas: this.encomendas,
        prestadores: this.prestadores,
        ocorrencias: this.ocorrencias,
        restricoes: this.restricoes,
        reservas: this.reservas,
        comunicados: this.comunicados,
        notificacoes: this.notificacoes,
        preautorizacoes: this.preautorizacoes,
        leads: this.leads,
        nextUserId: this.nextUserId,
        nextMoradorId: this.nextMoradorId,
        nextVeiculoId: this.nextVeiculoId,
        nextVisitanteId: this.nextVisitanteId,
        nextAcessoId: this.nextAcessoId,
        nextEncomendaId: this.nextEncomendaId,
        nextPrestadorId: this.nextPrestadorId,
        nextOcorrenciaId: this.nextOcorrenciaId,
        nextRestricaoId: this.nextRestricaoId,
        nextReservaId: this.nextReservaId,
        nextComunicadoId: this.nextComunicadoId,
        nextNotificacaoId: this.nextNotificacaoId,
        nextPreAutorizacaoId: this.nextPreAutorizacaoId,
        nextLeadId: this.nextLeadId,
      };
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error("Erro ao persistir banco em disco:", err);
    }
  }
}
