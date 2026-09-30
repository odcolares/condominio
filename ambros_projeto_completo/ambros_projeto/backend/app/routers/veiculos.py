from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/veiculos", tags=["Veículos"])


@router.get("", response_model=list[schemas.VeiculoOut])
def listar(
    placa: str | None = Query(None),
    morador_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stmt = select(models.Veiculo)
    if placa:
        stmt = stmt.where(models.Veiculo.placa.ilike(f"%{placa}%"))
    if morador_id:
        stmt = stmt.where(models.Veiculo.morador_id == morador_id)
    stmt = stmt.order_by(models.Veiculo.placa).offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{veiculo_id}", response_model=schemas.VeiculoOut)
def obter(veiculo_id: int, db: Session = Depends(get_db)):
    veiculo = db.get(models.Veiculo, veiculo_id)
    if not veiculo:
        raise HTTPException(404, "Veículo não encontrado")
    return veiculo


@router.post("", response_model=schemas.VeiculoOut, status_code=201)
def criar(dados: schemas.VeiculoCreate, db: Session = Depends(get_db)):
    if dados.morador_id and not db.get(models.Morador, dados.morador_id):
        raise HTTPException(400, "Morador informado não existe")
    veiculo = models.Veiculo(**dados.model_dump())
    db.add(veiculo)
    db.commit()
    db.refresh(veiculo)
    return veiculo


@router.delete("/{veiculo_id}", status_code=204)
def remover(veiculo_id: int, db: Session = Depends(get_db)):
    veiculo = db.get(models.Veiculo, veiculo_id)
    if not veiculo:
        raise HTTPException(404, "Veículo não encontrado")
    db.delete(veiculo)
    db.commit()
