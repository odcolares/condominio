from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/visitantes", tags=["Visitantes"])


@router.get("", response_model=list[schemas.VisitanteOut])
def listar(
    busca: str | None = Query(None, description="Nome, documento ou placa"),
    presentes: bool | None = Query(None, description="Filtra quem está no condomínio"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(models.Visitante)
    if busca:
        like = f"%{busca}%"
        stmt = stmt.where(
            or_(
                models.Visitante.nome.ilike(like),
                models.Visitante.documento.ilike(like),
                models.Visitante.placa_veiculo.ilike(like),
            )
        )
    if presentes is not None:
        stmt = stmt.where(models.Visitante.presente == presentes)
    stmt = stmt.order_by(models.Visitante.criado_em.desc()).offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{visitante_id}", response_model=schemas.VisitanteOut)
def obter(visitante_id: int, db: Session = Depends(get_db)):
    visitante = db.get(models.Visitante, visitante_id)
    if not visitante:
        raise HTTPException(404, "Visitante não encontrado")
    return visitante


@router.post("", response_model=schemas.VisitanteOut, status_code=201)
def criar(dados: schemas.VisitanteCreate, db: Session = Depends(get_db)):
    if dados.morador_visitado_id and not db.get(models.Morador, dados.morador_visitado_id):
        raise HTTPException(400, "Morador visitado não existe")
    visitante = models.Visitante(**dados.model_dump())
    db.add(visitante)
    db.commit()
    db.refresh(visitante)
    return visitante


@router.delete("/{visitante_id}", status_code=204)
def remover(visitante_id: int, db: Session = Depends(get_db)):
    visitante = db.get(models.Visitante, visitante_id)
    if not visitante:
        raise HTTPException(404, "Visitante não encontrado")
    db.delete(visitante)
    db.commit()
