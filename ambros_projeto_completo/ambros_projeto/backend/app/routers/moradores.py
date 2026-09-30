from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/moradores", tags=["Moradores"])


@router.get("", response_model=list[schemas.MoradorOut])
def listar(
    busca: str | None = Query(None, description="Nome, CPF ou bloco"),
    bloco: str | None = None,
    vinculo: models.VinculoMorador | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(models.Morador)
    if busca:
        like = f"%{busca}%"
        stmt = stmt.where(
            or_(
                models.Morador.nome_completo.ilike(like),
                models.Morador.cpf.ilike(like),
                models.Morador.bloco.ilike(like),
            )
        )
    if bloco:
        stmt = stmt.where(models.Morador.bloco == bloco)
    if vinculo:
        stmt = stmt.where(models.Morador.vinculo == vinculo)
    stmt = stmt.order_by(models.Morador.nome_completo).offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{morador_id}", response_model=schemas.MoradorOut)
def obter(morador_id: int, db: Session = Depends(get_db)):
    morador = db.get(models.Morador, morador_id)
    if not morador:
        raise HTTPException(404, "Morador não encontrado")
    return morador


@router.post("", response_model=schemas.MoradorOut, status_code=201)
def criar(dados: schemas.MoradorCreate, db: Session = Depends(get_db)):
    if db.scalar(select(models.Morador).where(models.Morador.cpf == dados.cpf)):
        raise HTTPException(409, "Já existe morador com esse CPF")
    morador = models.Morador(**dados.model_dump())
    db.add(morador)
    db.commit()
    db.refresh(morador)
    return morador


@router.put("/{morador_id}", response_model=schemas.MoradorOut)
def atualizar(morador_id: int, dados: schemas.MoradorUpdate, db: Session = Depends(get_db)):
    morador = db.get(models.Morador, morador_id)
    if not morador:
        raise HTTPException(404, "Morador não encontrado")
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(morador, campo, valor)
    db.commit()
    db.refresh(morador)
    return morador


@router.delete("/{morador_id}", status_code=204)
def remover(morador_id: int, db: Session = Depends(get_db)):
    morador = db.get(models.Morador, morador_id)
    if not morador:
        raise HTTPException(404, "Morador não encontrado")
    db.delete(morador)
    db.commit()
