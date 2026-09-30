from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/acessos", tags=["Acessos / Portaria"])


def _resolver_nome(db: Session, tipo: models.TipoPessoa, pessoa_id: int) -> str:
    """Busca o nome da pessoa para gravar um snapshot no acesso."""
    if tipo == models.TipoPessoa.morador:
        obj = db.get(models.Morador, pessoa_id)
        return obj.nome_completo if obj else ""
    if tipo == models.TipoPessoa.visitante:
        obj = db.get(models.Visitante, pessoa_id)
        return obj.nome if obj else ""
    return ""


@router.post("", response_model=schemas.AcessoOut, status_code=201)
def registrar(dados: schemas.AcessoCreate, db: Session = Depends(get_db)):
    """Registra uma entrada ou saída na portaria."""
    nome = _resolver_nome(db, dados.tipo_pessoa, dados.pessoa_id)
    if not nome:
        raise HTTPException(404, "Pessoa não encontrada para o acesso")

    acesso = models.Acesso(
        tipo_pessoa=dados.tipo_pessoa,
        pessoa_id=dados.pessoa_id,
        nome=nome,
        sentido=dados.sentido,
        placa_veiculo=dados.placa_veiculo,
        vaga=dados.vaga,
        observacao=dados.observacao,
    )
    db.add(acesso)

    # Atualiza presença do visitante
    if dados.tipo_pessoa == models.TipoPessoa.visitante:
        visitante = db.get(models.Visitante, dados.pessoa_id)
        if visitante:
            visitante.presente = dados.sentido == models.SentidoAcesso.entrada

    db.commit()
    db.refresh(acesso)
    return acesso


@router.get("", response_model=list[schemas.AcessoOut])
def historico(
    tipo_pessoa: models.TipoPessoa | None = None,
    sentido: models.SentidoAcesso | None = None,
    inicio: datetime | None = Query(None),
    fim: datetime | None = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Histórico de acessos, com filtros por tipo, sentido e período (relatórios)."""
    stmt = select(models.Acesso)
    if tipo_pessoa:
        stmt = stmt.where(models.Acesso.tipo_pessoa == tipo_pessoa)
    if sentido:
        stmt = stmt.where(models.Acesso.sentido == sentido)
    if inicio:
        stmt = stmt.where(models.Acesso.registrado_em >= inicio)
    if fim:
        stmt = stmt.where(models.Acesso.registrado_em <= fim)
    stmt = stmt.order_by(models.Acesso.registrado_em.desc()).offset(skip).limit(limit)
    return db.scalars(stmt).all()
