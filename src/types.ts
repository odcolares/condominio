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
