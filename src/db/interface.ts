import {
  Usuario,
  Morador,
  Veiculo,
  Visitante,
  Acesso,
  Encomenda,
  Prestador,
  Ocorrencia,
  RestricaoAcesso,
  Reserva,
  Comunicado,
  NotificacaoMorador,
  PreAutorizacaoVisitante,
  Lead,
} from "../types.js";
import { TenantConfig } from "../tenant.js";

export interface TenantData {
  moradores: Morador[];
  veiculos: Veiculo[];
  visitantes: Visitante[];
  acessos: Acesso[];
  encomendas: Encomenda[];
  prestadores: Prestador[];
  ocorrencias: Ocorrencia[];
  restricoes: RestricaoAcesso[];
  reservas: Reserva[];
  comunicados: Comunicado[];
  notificacoes: NotificacaoMorador[];
  preautorizacoes: PreAutorizacaoVisitante[];
}

export interface IDatabase {
  usuarios: Usuario[];
  moradores: Morador[];
  veiculos: Veiculo[];
  visitantes: Visitante[];
  acessos: Acesso[];
  encomendas: Encomenda[];
  prestadores: Prestador[];
  ocorrencias: Ocorrencia[];
  restricoes: RestricaoAcesso[];
  reservas: Reserva[];
  comunicados: Comunicado[];
  notificacoes: NotificacaoMorador[];
  preautorizacoes: PreAutorizacaoVisitante[];
  leads: Lead[];

  tenantConfigs: TenantConfig[];
  tenantData: Map<string, TenantData>;

  getNextUserId(): number;
  getNextMoradorId(): number;
  getNextVeiculoId(): number;
  getNextVisitanteId(): number;
  getNextAcessoId(): number;
  getNextEncomendaId(): number;
  getNextPrestadorId(): number;
  getNextOcorrenciaId(): number;
  getNextRestricaoId(): number;
  getNextReservaId(): number;
  getNextComunicadoId(): number;
  getNextNotificacaoId(): number;
  getNextPreAutorizacaoId(): number;
  getNextLeadId(): number;

  save(): void;
  __resetDb(): void;
}
