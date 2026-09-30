from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=schemas.TokenOut)
def login(dados: schemas.LoginIn, db: Session = Depends(get_db)):
    usuario = db.scalar(select(models.Usuario).where(models.Usuario.email == dados.email))
    if not usuario or not security.verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-mail ou senha inválidos")
    if not usuario.ativo:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuário inativo")

    token = security.criar_token(sub=usuario.email)
    return schemas.TokenOut(access_token=token, usuario=usuario)


@router.get("/me", response_model=schemas.UsuarioOut)
def me(usuario: models.Usuario = Depends(security.get_current_user)):
    return usuario
