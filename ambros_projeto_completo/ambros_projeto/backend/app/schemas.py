"""Schemas Pydantic (v2) para entrada/saída da API."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from .models import SentidoAcesso, TipoPessoa, VinculoMorador


# ---------- Morador ----------
class MoradorBase(BaseModel):
    nome_completo: str
    cpf: str
    telefone: str | None = None
    whatsapp: str | None = None
    bloco: str | None = None
    apartamento: str | None = None
    vinculo: VinculoMorador = VinculoMorador.proprietario
    foto_url: str | None = None
    numero_vaga: str | None = None
    ativo: bool = True


class MoradorCreate(MoradorBase):
    pass


class MoradorUpdate(BaseModel):
    nome_completo: str | None = None
    telefone: str | None = None
    whatsapp: str | None = None
    bloco: str | None = None
    apartamento: str | None = None
    vinculo: VinculoMorador | None = None
    foto_url: str | None = None
    numero_vaga: str | None = None
    ativo: bool | None = None


class MoradorOut(MoradorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    criado_em: datetime


# ---------- Veículo ----------
class VeiculoBase(BaseModel):
    placa: str
    modelo: str | None = None
    cor: str | None = None
    vaga: str | None = None
    morador_id: int | None = None


class VeiculoCreate(VeiculoBase):
    pass


class VeiculoOut(VeiculoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    criado_em: datetime


# ---------- Visitante ----------
class VisitanteBase(BaseModel):
    nome: str
    documento: str | None = None
    tipo_documento: str | None = None
    telefone: str | None = None
    foto_url: str | None = None
    placa_veiculo: str | None = None
    vaga: str | None = None
    bloco: str | None = None
    apartamento: str | None = None
    morador_visitado_id: int | None = None
    agendado_para: datetime | None = None


class VisitanteCreate(VisitanteBase):
    pass


class VisitanteOut(VisitanteBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    presente: bool
    criado_em: datetime


# ---------- Acesso ----------
class AcessoCreate(BaseModel):
    tipo_pessoa: TipoPessoa
    pessoa_id: int
    sentido: SentidoAcesso
    placa_veiculo: str | None = None
    vaga: str | None = None
    observacao: str | None = None


class AcessoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tipo_pessoa: TipoPessoa
    pessoa_id: int
    nome: str
    sentido: SentidoAcesso
    placa_veiculo: str | None
    vaga: str | None
    observacao: str | None
    registrado_em: datetime


# ---------- Dashboard ----------
class CardsDashboard(BaseModel):
    moradores_ativos: int
    visitantes_hoje: int
    veiculos_cadastrados: int
    entradas_hoje: int
    saidas_hoje: int
    dentro_condominio: int
    visitas_agendadas: int
    ultimo_acesso: AcessoOut | None


class PontoGrafico(BaseModel):
    label: str
    valor: int


class MovimentacaoDia(BaseModel):
    entradas: list[PontoGrafico]
    saidas: list[PontoGrafico]


class DashboardOut(BaseModel):
    cards: CardsDashboard
    movimentacao_hoje: MovimentacaoDia
    visitantes_7dias: list[PontoGrafico]
    ultimos_acessos: list[AcessoOut]


# ---------- Autenticação ----------
class LoginIn(BaseModel):
    email: str
    senha: str


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    email: str
    perfil: str
    ativo: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
