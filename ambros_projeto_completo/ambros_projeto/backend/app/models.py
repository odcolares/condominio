"""Modelos ORM do AMBROS.

Entidades centrais do MVP:
  - Morador
  - Visitante
  - Veiculo
  - Acesso (registro de entrada/saída)

Funcionários e prestadores seguem exatamente o mesmo padrão do Morador e
podem ser adicionados depois copiando essa estrutura.
"""
import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class VinculoMorador(str, enum.Enum):
    proprietario = "proprietario"
    inquilino = "inquilino"


class TipoPessoa(str, enum.Enum):
    morador = "morador"
    visitante = "visitante"
    funcionario = "funcionario"
    prestador = "prestador"


class SentidoAcesso(str, enum.Enum):
    entrada = "entrada"
    saida = "saida"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil: Mapped[str] = mapped_column(String(20), default="admin")
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Morador(Base):
    __tablename__ = "moradores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome_completo: Mapped[str] = mapped_column(String(150), nullable=False)
    cpf: Mapped[str] = mapped_column(String(14), unique=True, index=True, nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(20))
    whatsapp: Mapped[str | None] = mapped_column(String(20))
    bloco: Mapped[str | None] = mapped_column(String(20))
    apartamento: Mapped[str | None] = mapped_column(String(20))
    vinculo: Mapped[VinculoMorador] = mapped_column(
        Enum(VinculoMorador), default=VinculoMorador.proprietario
    )
    foto_url: Mapped[str | None] = mapped_column(String(255))
    numero_vaga: Mapped[str | None] = mapped_column(String(20))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    veiculos: Mapped[list["Veiculo"]] = relationship(
        back_populates="morador", cascade="all, delete-orphan"
    )
    visitantes: Mapped[list["Visitante"]] = relationship(back_populates="morador_visitado")


class Veiculo(Base):
    __tablename__ = "veiculos"

    id: Mapped[int] = mapped_column(primary_key=True)
    placa: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    modelo: Mapped[str | None] = mapped_column(String(60))
    cor: Mapped[str | None] = mapped_column(String(30))
    vaga: Mapped[str | None] = mapped_column(String(20))
    morador_id: Mapped[int | None] = mapped_column(ForeignKey("moradores.id"))
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    morador: Mapped["Morador | None"] = relationship(back_populates="veiculos")


class Visitante(Base):
    __tablename__ = "visitantes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    documento: Mapped[str | None] = mapped_column(String(20), index=True)
    tipo_documento: Mapped[str | None] = mapped_column(String(10))  # CPF / RG / CNH
    telefone: Mapped[str | None] = mapped_column(String(20))
    foto_url: Mapped[str | None] = mapped_column(String(255))
    placa_veiculo: Mapped[str | None] = mapped_column(String(10))
    vaga: Mapped[str | None] = mapped_column(String(20))
    bloco: Mapped[str | None] = mapped_column(String(20))
    apartamento: Mapped[str | None] = mapped_column(String(20))
    morador_visitado_id: Mapped[int | None] = mapped_column(ForeignKey("moradores.id"))
    agendado_para: Mapped[datetime | None] = mapped_column(DateTime)
    presente: Mapped[bool] = mapped_column(Boolean, default=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    morador_visitado: Mapped["Morador | None"] = relationship(back_populates="visitantes")


class Acesso(Base):
    __tablename__ = "acessos"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo_pessoa: Mapped[TipoPessoa] = mapped_column(Enum(TipoPessoa), nullable=False)
    pessoa_id: Mapped[int] = mapped_column(Integer, nullable=False)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)  # snapshot no momento
    sentido: Mapped[SentidoAcesso] = mapped_column(Enum(SentidoAcesso), nullable=False)
    placa_veiculo: Mapped[str | None] = mapped_column(String(10))
    vaga: Mapped[str | None] = mapped_column(String(20))
    observacao: Mapped[str | None] = mapped_column(Text)
    registrado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
