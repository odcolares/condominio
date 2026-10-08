export type VinculoMorador = "proprietario" | "inquilino";
export type TipoPessoa = "morador" | "visitante" | "funcionario" | "prestador";
export type SentidoAcesso = "entrada" | "saida";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: string;
  ativo: boolean;
  criado_em: string;
}

export interface Morador {
  id: number;
  nome_completo: string;
  cpf: string;
  telefone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  bloco: string | null;
  apartamento: string | null;
  vinculo: VinculoMorador;
  foto_url: string | null;
  numero_vaga: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface Veiculo {
  id: number;
  placa: string;
  modelo: string | null;
  cor: string | null;
  vaga: string | null;
  morador_id: number | null;
  criado_em: string;
}

export interface Visitante {
  id: number;
  nome: string;
  documento: string | null;
  tipo_documento: string | null;
  telefone: string | null;
  foto_url: string | null;
  placa_veiculo: string | null;
  vaga: string | null;
  bloco: string | null;
  apartamento: string | null;
  morador_visitado_id: number | null;
  agendado_para: string | null;
  presente: boolean;
  criado_em: string;
}

export interface Acesso {
  id: number;
  tipo_pessoa: TipoPessoa;
  pessoa_id: number;
  nome: string;
  sentido: SentidoAcesso;
  placa_veiculo: string | null;
  vaga: string | null;
  observacao: string | null;
  registrado_em: string;
}

export type StatusEncomenda = "pendente" | "entregue" | "devolvida";

export interface Encomenda {
  id: number;
  morador_id: number;
  morador_nome: string;
  morador_unidade: string;
  morador_telefone: string | null;
  morador_whatsapp: string | null;
  morador_telegram: string | null;
  codigo_rastreio: string;
  transportadora: string;
  tipo_volume: string;
  local_armazenamento: string;
  observacoes: string | null;
  codigo_retirada: string;
  status: StatusEncomenda;
  recebido_em: string;
  recebido_por: string;
  retirado_em: string | null;
  retirado_por: string | null;
  notificacao_enviada_whatsapp: boolean;
  notificacao_enviada_telegram: boolean;
  mensagem_aviso: string;
}

export interface Prestador {
  id: number;
  nome: string;
  documento: string;
  tipo_documento: "CPF" | "RG" | "CNH" | "Outro";
  empresa: string | null;
  funcao: string;
  telefone: string | null;
  foto_url: string | null;
  placa_veiculo: string | null;
  cracha_numero: string | null;
  tipo_vinculo: "unidade" | "condominio";
  bloco: string | null;
  apartamento: string | null;
  morador_autorizador_id: number | null;
  morador_autorizador_nome: string | null;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string; // YYYY-MM-DD
  horario_permitido: string | null;
  observacao: string | null;
  presente: boolean;
  ativo: boolean;
  criado_em: string;
}

export type CategoriaOcorrencia =
  | "barulho"
  | "estacionamento"
  | "mudanca"
  | "animal"
  | "patrimonio"
  | "seguranca"
  | "outros";

export type GravidadeOcorrencia = "baixa" | "media" | "alta" | "critica";
export type StatusOcorrencia = "aberta" | "em_analise" | "resolvida";

export interface Ocorrencia {
  id: number;
  titulo: string;
  categoria: CategoriaOcorrencia;
  gravidade: GravidadeOcorrencia;
  status: StatusOcorrencia;
  bloco: string | null;
  apartamento: string | null;
  morador_envolvido: string | null;
  descricao: string;
  acao_tomada: string | null;
  registrado_por: string;
  data_hora: string;
  resolvido_em: string | null;
}

export interface RestricaoAcesso {
  id: number;
  tipo_identificador: "cpf" | "rg" | "placa" | "nome";
  valor_identificador: string;
  nome_pessoa: string | null;
  motivo: string;
  instrucao_portaria: string;
  bloqueio_total: boolean; // true = proibido / false = advertência
  ativo: boolean;
  criado_por: string;
  criado_em: string;
}

export type EspacoComum = "salao_festas" | "churrasqueira_1" | "churrasqueira_2" | "quadra" | "coworking";
export type StatusReserva = "pendente" | "confirmada" | "cancelada";

export interface Reserva {
  id: number;
  espaco: EspacoComum;
  espaco_nome: string;
  data_reserva: string; // YYYY-MM-DD
  periodo: "dia_inteiro" | "manha" | "tarde" | "noite";
  morador_id: number;
  morador_nome: string;
  bloco: string;
  apartamento: string;
  status: StatusReserva;
  convidados_estimados: number;
  observacoes: string | null;
  solicitado_em: string;
  aprovado_em: string | null;
  aprovado_por: string | null;
}

export type CategoriaComunicado = "urgente" | "manutencao" | "assembleia" | "aviso_geral" | "evento";

export interface Comunicado {
  id: number;
  titulo: string;
  categoria: CategoriaComunicado;
  conteudo: string;
  importante: boolean;
  publicado_por: string;
  data_publicacao: string;
  ativo: boolean;
}

export type CanalNotificacao = "whatsapp" | "telegram" | "app" | "email";
export type TipoNotificacao = "encomenda" | "visitante" | "reserva" | "ocorrencia" | "comunicado";

export interface NotificacaoMorador {
  id: number;
  morador_id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  canal: CanalNotificacao;
  enviado_em: string;
  lida: boolean;
  dados_adicionais: Record<string, any> | null;
}

export type StatusLead = "novo" | "contatado" | "em_demo" | "convertido" | "perdido";

export interface Lead {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  condominio_nome: string | null;
  numero_unidades: number | null;
  sistema_atual: string | null;
  status: StatusLead;
  origem: string | null;
  observacao: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface PreAutorizacaoVisitante {
  id: number;
  morador_id: number;
  morador_nome: string;
  bloco: string;
  apartamento: string;
  nome_visitante: string;
  documento_visitante: string | null;
  placa_veiculo: string | null;
  data_prevista: string; // YYYY-MM-DD
  observacao: string | null;
  codigo_acesso_qr: string; // Ex: QR-9821
  status: "aguardando" | "acessou" | "cancelado";
  criado_em: string;
}

